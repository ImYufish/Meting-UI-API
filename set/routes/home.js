/**
 * 主页路由
 */

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

/**
 * 构建URL辅助函数
 */
const buildUrl = (c, path) => {
    const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('X-Scheme') || 'http';
    const forwardedHost = c.req.header('X-Forwarded-Host');
    const host = forwardedHost || c.req.header('Host') || new URL(c.req.url).host;
    
    let cleanHost = host;
    if (forwardedHost && !forwardedHost.includes(':')) {
        cleanHost = host.split(':')[0];
    }
    
    let base = protocol + '://' + cleanHost;
    
    if (isVercel) {
        return base + path;
    } else {
        const isIP = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(cleanHost) || /^localhost(:\d+)?$/.test(cleanHost);
        if (isIP) {
            return base + path;
        } else {
            return base + '/meting' + path;
        }
    }
};

/**
 * 获取真实的请求URL
 */
const getRealRequestUrl = (c) => {
    const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('X-Scheme') || 'http';
    const forwardedHost = c.req.header('X-Forwarded-Host');
    const host = forwardedHost || c.req.header('Host') || new URL(c.req.url).host;
    
    // 移除端口号（如果域名不需要端口）
    let cleanHost = host;
    if (forwardedHost && !forwardedHost.includes(':')) {
        cleanHost = host.split(':')[0];
    }
    
    const pathname = new URL(c.req.url).pathname;
    return protocol + '://' + cleanHost + pathname;
};

/**
 * 主页路由处理器
 */
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
    
    // 构建各种URL
    const apiUrl = buildUrl(c, '/api');
    const testUrl = buildUrl(c, '/test');
    const healthUrl = buildUrl(c, '/health');
    const correctBaseUrl = buildUrl(c, '');
    
    // 获取统计信息
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
    
    // 存储类型信息
    const storageType = isVercel ? 'Vercel无状态环境' : (isUsingMySQL() ? '数据库' : '本地文件');
    const storageIcon = isVercel ? '☁️' : (isUsingMySQL() ? '💾' : '📁');
    
    // 生成HTML
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

/**
 * 注册主页路由
 * @param {Object} app - Hono应用实例
 */
export const registerHomeRoutes = (app) => {
    // 主页路由
    app.get('/', homeHandler);
    
    // 如果有 /meting 前缀的情况
    app.get('/meting', homeHandler);
    
    console.log('🏠 主页路由注册完成');
};

export default homeHandler;
