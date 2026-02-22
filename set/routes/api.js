import { isVercel } from '../config/database.js';
import { incrementApiCalls } from '../services/stats.js';
import { format as lyricFormat, get_url } from '../../src/util.js';
import { format as originalLyricFormat } from '../utils/lyric.js';
import { readCookieFile, isAllowedHost } from '../utils/cookie.js';
import { createDocsHandler } from './docs.js';
import { handler as testPageHandler } from '../../src/template.js';
import { LRUCache } from 'lru-cache';
import Meting from '@meting/core';

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

const buildUrl = (c, path) => {
    const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('X-Scheme') || 'http';
    const forwardedHost = c.req.header('X-Forwarded-Host');
    const host = forwardedHost || c.req.header('Host') || new URL(c.req.url).host;

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

    try {
        if (!isVercel) {
            await incrementApiCalls();
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

            cache.set(cacheKey, data, {
                ttl: type === 'url' ? 1000 * 60 * 10 : 1000 * 60 * 60
            });
        } else {
            c.header('x-cache', 'hit');
        }

        if (type === 'url') {
            let url = data.url;

            if (!url) {
                c.status(404);
                return c.body(null, 404);
            }
            if (url.startsWith('@')) {
                return c.text(url);
            }

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

        if (type === 'pic') {
            let url = data.url;
            if (!url) {
                c.status(404);
                return c.body(null, 404);
            }
            return c.redirect(url);
        }

        if (type === 'lrc') {
            return c.text(originalLyricFormat(data.lyric, data.tlyric || ''));
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

                return c.json([{
                    title: songName,
                    author: artistName,
                    url: urlId ? `${get_url(c)}?server=${server}&type=url&id=${urlId}` : '',
                    pic: picUrl,
                    lrc: lyricId ? `${get_url(c)}?server=${server}&type=lrc&id=${lyricId}` : ''
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
                picUrl = `${get_url(c)}?server=${server}&type=pic&id=${x.pic_id}`;
            }
            return {
                title: x.name,
                author: Array.isArray(x.artist) ? x.artist.join(' / ') : x.artist,
                url: x.url_id ? `${get_url(c)}?server=${server}&type=url&id=${x.url_id}` : '',
                pic: picUrl,
                lrc: x.lyric_id ? `${get_url(c)}?server=${server}&type=lrc&id=${x.lyric_id}` : ''
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

export const registerApiRoutes = (app) => {
    app.get('/api', apiHandler);

    app.get('/test', testHandler);
    app.get('/health', healthHandler);
    app.get('/docs', docsHandler);

    console.log('✅ API 路由注册完成');
};

export default apiHandler;
