import crypto from 'crypto';
import { isVercel } from '../config/database.js';
import { incrementApiCalls } from '../services/stats.js';
import { format as originalLyricFormat, get_url } from '../../src/util.js';
import { readCookieFile, isAllowedHost } from '../utils/cookie.js';
import { createDocsHandler } from './docs.js';
import { handler as testPageHandler } from '../../src/template.js';
import { LRUCache } from 'lru-cache';
import Meting from '@meting/core';
import { HMAC_SECRET, ENABLE_AUTH } from '../../setting/hmac.js';

// 可选:QQ 歌词代理。用于 Vercel 等海外节点绕过 QQ 音乐对 fcg_query_lyric_new.fcg 的境外 IP 限制。
// 例如指向部署在国内的中转服务:https://你的代理域名
// 留空则走默认直连(国内/无限制环境下正常工作)。
const LYRIC_PROXY = process.env.LYRIC_PROXY || '';

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
            album_id: item.album_id,
            source: 'kugou',
            _raw: item,
            pic: coverUrl
        };
    });
};

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

// 把各平台返回的音频直链做规范化（https 化、域名修正、去过期参数等）
const postProcessUrl = (server, rawUrl) => {
    if (!rawUrl) return '';
    let url = rawUrl;
    if (url.startsWith('@')) return url;
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
    } else if (server === 'tencent') {
        url = url
            .replace('http://', 'https://')
            .replace('://ws.stream.qqmusic.qq.com', '://dl.stream.qqmusic.qq.com');
    } else if (server === 'kugou') {
        url = url
            .replace('http://', 'https://')
            .replace('://trackercdn.kugou.com', '://tracker.kugou.com')
            .replace('://media.store.kugou.com', '://media.kugou.com');
    }
    return url;
};

// 解析歌曲直链（带缓存，供 &fill=1 内联使用；空结果也缓存避免重复打接口）
const resolveAudioUrl = async (server, id, cookie) => {
    const key = `url/${server}/${id}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const meting = new Meting(server);
    meting.format(true);
    if (cookie) meting.cookie(cookie);
    let parsed;
    try {
        parsed = JSON.parse(await meting.url(id));
    } catch (e) {
        cache.set(key, '', { ttl: 1000 * 60 * 10 });
        return '';
    }
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    const result = item && item.url ? postProcessUrl(server, item.url) : '';
    cache.set(key, result, { ttl: 1000 * 60 * 10 });
    return result;
};

// 边缘缓存：让 Vercel 边缘节点就近返回（仅对稳定响应生效）
const setEdgeCache = (c, type) => {
    // url 直链带时效，不边缘缓存——避免过期直链被复用，更避免限流/失败时空响应被缓存放大成「永久放不了」
    if (type === 'url') return;
    const ttl = (type === 'pic') ? 600 : 3600;
    c.header('Cache-Control', `public, s-maxage=${ttl}, max-age=60`);
};

const buildUrl = (c, path) => {
    const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('X-Scheme') || 'http';
    const forwardedHost = c.req.header('X-Forwarded-Host');
    const host = forwardedHost || c.req.header('Host') || new URL(c.req.url).host;

    let cleanHost = host;
    cleanHost = cleanHost.replace(/^https?:\/\//, '');
    cleanHost = cleanHost.split('/')[0];

    if (forwardedHost && !forwardedHost.includes(':')) {
        cleanHost = cleanHost.split(':')[0];
    }

    return protocol + '://' + cleanHost + path;
};

export const apiHandler = async (c) => {
    const query = c.req.query();
    const server = query.server || 'tencent';
    const type = query.type || 'playlist';
    const id = query.id || '8664505249';

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

    if (ENABLE_AUTH && ['url', 'pic', 'lrc'].includes(type)) {
        const token = query.token;
        const expected = crypto.createHmac('sha256', HMAC_SECRET).update(`${server}${type}${id}`).digest('hex');
        if (!token || token !== expected) {
            c.status(401);
            return c.json({
                error: true,
                message: '签名校验失败',
                hint: 'url/pic/lrc 类型请求在开启鉴权时需携带正确 token 参数',
                param: { server, type, id }
            });
        }
    }

    try {
        if (!isVercel) {
            await incrementApiCalls();
        }

        const referrer = c.req.header('referer');
        let cookie = '';
        if (isAllowedHost(referrer)) {
            cookie = await readCookieFile(server);
        }

        const cacheKey = `${server}/${type}/${id}`;
        let data = cache.get(cacheKey);

        if (data === undefined) {
            c.header('x-cache', 'miss');

            if (type === 'search' && server === 'kugou') {
                const limit = query.limit ? parseInt(query.limit) : 30;
                data = await kugouSearch(id, limit);
            } else if (type === 'playlist' && server === 'kugou') {
                data = await kugouPlaylist(id);
            } else if (type === 'artist' && server === 'kugou') {
                data = await kugouArtist(id);
            } else {
                const meting = new Meting(server);
                meting.format(true);

                if (cookie) {
                    meting.cookie(cookie);
                }

                // 仅对 tencent 歌词走代理:QQ 的歌词接口对境外 IP 常被限,经国内中转即可(其余接口/search/url/pic 不受影响)
                if (type === 'lrc' && server === 'tencent' && LYRIC_PROXY) {
                    const proxyBase = LYRIC_PROXY.replace(/\/$/, '');
                    const origCurl = meting._curl.bind(meting);
                    meting._curl = (url, body) =>
                        origCurl(String(url).replace(/^https:\/\/c\.y\.qq\.com/, proxyBase), body);
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

            cache.set(cacheKey, data, {
                ttl: type === 'url' ? 1000 * 60 * 10 : 1000 * 60 * 60
            });
        } else {
            c.header('x-cache', 'hit');
        }

        const fillSong = query.fill === '1' && type === 'song';

        if (type === 'url') {
            const url = postProcessUrl(server, data.url);

            if (!url) {
                c.status(404);
                return c.json({ error: 'no url', server, message: '直链为空：该平台可能需要配置对应 cookie（如 METING_COOKIE_KUGOU / METING_COOKIE_NETEASE）' });
            }
            if (url.startsWith('@')) {
                return c.text(url);
            }

            return c.redirect(url);
        }

        if (type === 'pic') {
            let url = data.url;
            if (!url) {
                c.status(404);
                return c.body(null, 404);
            }
            setEdgeCache(c, type);
            return c.redirect(url);
        }

        if (type === 'lrc') {
            const lyricObj = Array.isArray(data) ? data[0] : data;
            const rawLyric = lyricObj && typeof lyricObj.lyric === 'string' ? lyricObj.lyric : '';
            const rawTlyric = lyricObj && typeof lyricObj.tlyric === 'string' ? lyricObj.tlyric : '';
            if (!rawLyric.trim()) {
                c.status(404);
                return c.text('');
            }
            setEdgeCache(c, type);
            return c.text(originalLyricFormat(rawLyric, rawTlyric));
        }

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
                    picUrl = `${get_url(c)}?server=${server}&type=pic&id=${picId}`;
                }

                const audioUrl = urlId
                    ? (fillSong ? await resolveAudioUrl(server, urlId, cookie) : `${get_url(c)}?server=${server}&type=url&id=${urlId}`)
                    : '';

                setEdgeCache(c, type);
                return c.json([{
                    title: songName,
                    author: artistName,
                    url: audioUrl,
                    pic: picUrl,
                    lrc: lyricId ? `${get_url(c)}?server=${server}&type=lrc&id=${lyricId}` : ''
                }]);
            }
            c.status(404);
            return c.json({ error: 'no data' });
        }
        setEdgeCache(c, type);
        return c.json(await Promise.all(data.map(async (x) => {
            let picUrl = '';
            if (server === 'kugou' && x.pic) {
                picUrl = x.pic;
            } else if (x.pic_id) {
                picUrl = `${get_url(c)}?server=${server}&type=pic&id=${x.pic_id}`;
            }
            const audioUrl = x.url_id
                ? (fillSong ? await resolveAudioUrl(server, x.url_id, cookie) : `${get_url(c)}?server=${server}&type=url&id=${x.url_id}`)
                : '';
            return {
                title: x.name,
                author: Array.isArray(x.artist) ? x.artist.join(' / ') : x.artist,
                url: audioUrl,
                pic: picUrl,
                lrc: x.lyric_id ? `${get_url(c)}?server=${server}&type=lrc&id=${x.lyric_id}` : ''
            };
        })));

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

export const testHandler = (c) => {
    return testPageHandler(c);
};

export const healthHandler = (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: isVercel ? 'vercel' : 'standalone',
        version: '1.0.0'
    });
};

export const docsHandler = createDocsHandler(buildUrl);

export default apiHandler;
