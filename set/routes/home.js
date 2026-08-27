import { get_runtime, get_url } from '../../src/util.js';
import { isVercel } from '../config/database.js';
import { isUsingMySQL } from '../services/database.js';
import { 
    apiStats, 
    getTodayCalls, 
    getWeekCalls, 
    getMonthCalls,
    getNextResetTime,
    getNextWeeklyReset,
    getNextMonthlyReset
} from '../services/stats.js';
import { generateHomePage } from '../templates/home.js';

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

const getRealRequestUrl = (c) => {
    const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('X-Scheme') || 'http';
    const forwardedHost = c.req.header('X-Forwarded-Host');
    const host = forwardedHost || c.req.header('Host') || new URL(c.req.url).host;

    let cleanHost = host;

    cleanHost = cleanHost.replace(/^https?:\/\//, '');
    cleanHost = cleanHost.split('/')[0];

    if (forwardedHost && !forwardedHost.includes(':')) {
        cleanHost = cleanHost.split(':')[0];
    }

    const currentPath = new URL(c.req.url).pathname;
    return protocol + '://' + cleanHost + currentPath;
};

export const homeHandler = (c) => {
    const currentTime = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const runtime = get_runtime();
    
    const apiUrl = buildUrl(c, '/api');
    const testUrl = buildUrl(c, '/test');
    const healthUrl = buildUrl(c, '/health');
    const correctBaseUrl = buildUrl(c, '');
    
    let totalCalls = 0;
    let todayCalls = 0;
    let weekCalls = 0;
    let monthCalls = 0;
    let lastUpdated = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    let nextReset = { time: '', formatted: '' };
    let nextWeeklyReset = { time: '', formatted: '' };
    let nextMonthlyReset = { time: '', formatted: '' };
    
    if (!isVercel) {
        totalCalls = apiStats.totalCalls;
        todayCalls = getTodayCalls();
        weekCalls = getWeekCalls();
        monthCalls = getMonthCalls();
        lastUpdated = new Date(apiStats.lastUpdated).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        nextReset = getNextResetTime();
        nextWeeklyReset = getNextWeeklyReset();
        nextMonthlyReset = getNextMonthlyReset();
    }
    
    const storageType = isVercel ? 'Vercel无状态环境' : (isUsingMySQL() ? '数据库' : '本地文件');
    const storageIcon = isVercel ? '☁️' : (isUsingMySQL() ? '💾' : '📁');
    
    const html = generateHomePage({
        currentTime,
        runtime,
        apiUrl,
        testUrl,
        healthUrl,
        correctBaseUrl,
        requestUrl: getRealRequestUrl(c),
        totalCalls,
        todayCalls,
        weekCalls,
        monthCalls,
        lastUpdated,
        nextReset,
        nextWeeklyReset,
        nextMonthlyReset,
        storageType,
        storageIcon
    });
    
    return c.html(html);
};

export default homeHandler;
