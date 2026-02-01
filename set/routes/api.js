/**
 * API 路由模块 - Meting API 核心功能
 */

import { isVercel } from '../config/database.js';
import { incrementApiCalls } from '../services/stats.js';
import { format as lyricFormat, get_url } from '../../src/util.js';
import { format as originalLyricFormat } from '../utils/lyric.js';
import { readCookieFile, isAllowedHost } from '../utils/cookie.js';
import { createDocsHandler } from './docs.js';
import { handler as testPageHandler } from '../../src/template.js';
import { LRUCache } from 'lru-cache';
import { createHmac } from 'crypto';
import Meting from '@meting/core';
import { HMAC_SECRET, ENABLE_AUTH } from '../../setting/hmac.js';

const cache = new LRUCache({
  max: 1000,
  ttl: 1000 * 30
})

const METING_METHODS = {
  search: 'search',
  song: 'song',
  album: 'album',
  artist: 'artist',
  playlist: 'playlist',
  lrc: 'lyric',
  url: 'url',
  pic: 'pic'
}

/**
 * 酷狗音乐搜索 API
 */
const kugouSearch = async (keyword, limit = 30) => {
  const response = await fetch(`http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=${encodeURIComponent(keyword)}&pagesize=${limit}`);
  const data = await response.json();
  
  if (data.status !== 1 || !data.data || !data.data.info) {
    return [];
  }
  
  return data.data.info.map(item => {
    const coverUrl = item.trans_param && item.trans_param.union_cover 
      ? item.trans_param.union_cover.replace('{size}', '400')
      : '';
    
    return {
      id: item.hash,
      name: item.songname,
      artist: item.singername,
      album: item.album_name,
      url_id: item.hash,
      pic_id: item.hash,
      lyric_id: item.hash,
      source: 'kugou',
      _raw: item,
      pic: coverUrl
    };
  });
};

/**
 * 酷狗音乐歌单 API
 */
const kugouPlaylist = async (playlistId) => {
  const meting = new Meting('kugou');
  meting.format(true);
  const result = await meting.playlist(playlistId);
  const songs = JSON.parse(result);
  
  if (!songs || songs.length === 0) {
    return [];
  }
  
  const songsWithCovers = await Promise.all(songs.map(async (song) => {
    try {
      const searchResult = await kugouSearch(song.name, 1);
      if (searchResult && searchResult.length > 0) {
        song.pic = searchResult[0].pic;
      }
    } catch (e) {
    }
    return song;
  }));
  
  return songsWithCovers;
};

/**
 * 酷狗音乐艺术家 API
 */
const kugouArtist = async (artistId) => {
  const meting = new Meting('kugou');
  meting.format(true);
  const result = await meting.artist(artistId);
  const songs = JSON.parse(result);
  
  if (!songs || songs.length === 0) {
    return [];
  }
  
  const songsWithCovers = await Promise.all(songs.map(async (song) => {
    try {
      const searchResult = await kugouSearch(song.name, 1);
      if (searchResult && searchResult.length > 0) {
        song.pic = searchResult[0].pic;
      }
    } catch (e) {
    }
    return song;
  }));
  
  return songsWithCovers;
};

/**
 * 构建URL辅助函数
 */
const buildUrl = (c, path) => {
    // 优先使用 X-Forwarded-* 头（Nginx代理传递的真实信息）
    const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('X-Scheme') || 'http';
    const forwardedHost = c.req.header('X-Forwarded-Host');
    const host = forwardedHost || c.req.header('Host') || new URL(c.req.url).host;
    
    // 移除端口号（如果域名不需要端口）
    let cleanHost = host;
    if (forwardedHost && !forwardedHost.includes(':')) {
        cleanHost = host.split(':')[0];
    }
    
    let base = protocol + '://' + cleanHost;
    const currentPath = new URL(c.req.url).pathname;

    if (isVercel) {
        return base + path;
    } else {
        if (currentPath.startsWith('/meting')) {
            return base + '/meting' + path;
        } else {
            return base + path;
        }
    }
};

/**
 * API 主处理器 - 核心音乐数据接口
 */
export const apiHandler = async (c) => {
    const query = c.req.query();
    const server = query.server || 'tencent';
    const type = query.type || 'playlist';
    const id = query.id || '8664505249';
    const token = query.token || query.auth || 'token';

    // 验证参数
    if (!['netease', 'tencent', 'kugou'].includes(server)) {
        c.status(400);
        return c.json({
            status: 400,
            message: 'server 参数不合法',
            param: { server, type, id },
            validServers: ['netease', 'tencent', 'kugou'],
            example: buildUrl(c, '/api?server=netease&type=song&id=1901371647')
        });
    }
    if (!['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'].includes(type)) {
        c.status(400);
        return c.json({
            status: 400,
            message: 'type 参数不合法',
            param: { server, type, id }
        });
    }

    // 鉴权 - url/pic/lrc 需要鉴权
    if (['lrc', 'url', 'pic'].includes(type)) {
        if (ENABLE_AUTH && auth(server, type, id) !== token) {
            c.status(401);
            return c.json({ message: '鉴权失败,非法调用' });
        }
    }

    try {
        // 记录 API 调用（非 Vercel 环境）
        if (!isVercel) {
            await incrementApiCalls();
        }

        // 检查缓存
        const cacheKey = `${server}/${type}/${id}`;
        let data = cache.get(cacheKey);
        
        // 酷狗音乐封面图特殊处理（跳过 @meting/core 库调用）
        if (type === 'pic' && server === 'kugou') {
            const hash = id;
            if (hash && hash.length >= 32) {
                const url = `http://imge.kugou.com/stdmusic/400/${hash}.jpg`;
                return c.redirect(url);
            }
            c.status(404);
            return c.body(null, 404);
        }
        
        if (data === undefined) {
            c.header('x-cache', 'miss');
            
            // 酷狗音乐搜索使用自定义 API
            if (type === 'search' && server === 'kugou') {
                const limit = query.limit ? parseInt(query.limit) : 30;
                data = await kugouSearch(id, limit);
            } else if (type === 'playlist' && server === 'kugou') {
                data = await kugouPlaylist(id);
            } else if (type === 'artist' && server === 'kugou') {
                data = await kugouArtist(id);
            } else {
                // 检查 referrer 并配置 cookie
                const referrer = c.req.header('referer');
                let cookie = '';
                if (isAllowedHost(referrer)) {
                    cookie = await readCookieFile(server);
                }

                const meting = new Meting(server);
                meting.format(true);
                
                if (cookie) {
                    meting.cookie(cookie);
                }

                const method = METING_METHODS[type];
                let response;
                try {
                    response = await meting[method](id);
                } catch (error) {
                    console.error('Meting API error:', server, type, id, error.message);
                    c.status(404);
                    return c.json({ error: 'no data' });
                }
                try {
                    data = JSON.parse(response);
                } catch (error) {
                    console.error('JSON parse error:', server, type, id, error.message);
                    c.status(404);
                    return c.json({ error: 'no data' });
                }
            }

            // 缓存结果
            cache.set(cacheKey, data, {
                ttl: type === 'url' ? 1000 * 60 * 10 : 1000 * 60 * 60
            });
        } else {
            c.header('x-cache', 'hit');
        }

        // URL 类型处理
        if (type === 'url') {
            let url = data.url;

            if (!url) {
                c.status(404);
                return c.body(null, 404);
            }
            if (url.startsWith('@')) {
                return c.text(url);
            }

            // 链接转换
            if (server === 'netease') {
                url = url
                    .replace('://m7c.', '://m7.')
                    .replace('://m8c.', '://m8.')
                    .replace('http://', 'https://');
                if (url.includes('vuutv=')) {
                    const tempUrl = new URL(url);
                    tempUrl.search = '';
                    url = tempUrl.toString();
                }
            }
            if (server === 'tencent') {
                url = url
                    .replace('http://', 'https://')
                    .replace('://ws.stream.qqmusic.qq.com', '://dl.stream.qqmusic.qq.com');
            }
            if (server === 'kugou') {
                url = url
                    .replace('http://', 'https://')
                    .replace('://trackercdn.kugou.com', '://tracker.kugou.com')
                    .replace('://media.store.kugou.com', '://media.kugou.com');
            }

            return c.redirect(url);
        }

        // 图片类型处理
        if (type === 'pic') {
            let url = data.url;
            if (!url) {
                c.status(404);
                return c.body(null, 404);
            }
            return c.redirect(url);
        }

        // 歌词类型处理 - 使用原版格式化
        if (type === 'lrc') {
            return c.text(originalLyricFormat(data.lyric, data.tlyric || ''));
        }

        // JSON 类型数据填充 API URL
        if (!Array.isArray(data)) {
            if (data && (data.name || data.songName)) {
                const songName = data.name || data.songName;
                const artistName = data.author_name || data.singerName || (Array.isArray(data.artist) ? data.artist.join(' / ') : data.artist);
                const picId = data.pic_id || data.hash;
                const urlId = data.url_id || data.hash;
                const lyricId = data.lyric_id || data.hash;
                
                let picUrl = '';
                if (server === 'kugou' && data.pic) {
                    picUrl = data.pic;
                } else if (data.trans_param && data.trans_param.union_cover) {
                    picUrl = data.trans_param.union_cover.replace('{size}', '400');
                } else if (picId) {
                    picUrl = `${get_url(c)}?server=${server}&type=pic&id=${picId}&auth=${auth(server, 'pic', picId)}`;
                }
                
                return c.json([{
                    title: songName,
                    author: artistName,
                    url: urlId ? `${get_url(c)}?server=${server}&type=url&id=${urlId}&auth=${auth(server, 'url', urlId)}` : '',
                    pic: picUrl,
                    lrc: lyricId ? `${get_url(c)}?server=${server}&type=lrc&id=${lyricId}&auth=${auth(server, 'lrc', lyricId)}` : ''
                }]);
            }
            c.status(404);
            return c.json({ error: 'no data' });
        }
        return c.json(data.map(x => {
            let picUrl = '';
            if (server === 'kugou' && x.pic) {
                picUrl = x.pic;
            } else if (x.pic_id) {
                picUrl = `${get_url(c)}?server=${server}&type=pic&id=${x.pic_id}&auth=${auth(server, 'pic', x.pic_id)}`;
            }
            return {
                title: x.name,
                author: Array.isArray(x.artist) ? x.artist.join(' / ') : x.artist,
                url: x.url_id ? `${get_url(c)}?server=${server}&type=url&id=${x.url_id}&auth=${auth(server, 'url', x.url_id)}` : '',
                pic: picUrl,
                lrc: x.lyric_id ? `${get_url(c)}?server=${server}&type=lrc&id=${x.lyric_id}&auth=${auth(server, 'lrc', x.lyric_id)}` : ''
            };
        }));

    } catch (error) {
        console.error('API Error:', error);
        c.status(500);
        return c.json({
            error: true,
            message: error.message || '服务器内部错误',
            param: { server, type, id }
        });
    }
};

const auth = (server, type, id) => {
    const hmac = createHmac('sha1', HMAC_SECRET);
    hmac.update(`${server}${type}${id}`);
    return hmac.digest('hex');
};

/**
 * 测试路由处理器
 */
export const testHandler = (c) => {
    return testPageHandler(c);
};

/**
 * 健康检查处理器
 */
export const healthHandler = (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: isVercel ? 'vercel' : 'standalone',
        version: '1.0.0'
    });
};

/**
 * API 文档处理器 - HTML 页面
 */
export const docsHandler = createDocsHandler(buildUrl);

/**
 * 注册 API 路由
 */
export const registerApiRoutes = (app) => {
    // 核心 API 路由
    app.get('/api', apiHandler);

    // 辅助路由
    app.get('/test', testHandler);
    app.get('/health', healthHandler);
    app.get('/docs', docsHandler);

    console.log('✅ API 路由注册完成');
};

export default apiHandler;
