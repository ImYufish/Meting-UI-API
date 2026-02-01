import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { isVercel } from '../config/database.js';
import { dbOperations, isUsingMySQL, getDbPool } from '../services/database.js';
import { updateStats, checkAndResetStats } from '../services/stats.js';

export const registerBaseMiddleware = (app) => {
    app.use('*', cors());
    app.use('*', logger());
};

export const registerStatsMiddleware = (app) => {
    if (isVercel) {
        console.log('ℹ️  Vercel环境：跳过统计中间件注册');
        return;
    }

    app.use('/api', async (c, next) => {
        const startTime = Date.now();
        await next();
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (c.req.url.includes('/api') && c.res.status === 200) {
            await updateStats();
            
            const ip = c.req.header('x-real-ip') || c.req.header('x-forwarded-for') || 'unknown';
            const userAgent = c.req.header('user-agent') || 'unknown';
            
            if (isUsingMySQL() && getDbPool()) {
                await dbOperations.logApiRequest(
                    c.req.path,
                    c.req.method,
                    c.res.status,
                    responseTime,
                    ip,
                    userAgent
                );
            }
        }
    });

    app.use('*', async (c, next) => {
        await checkAndResetStats();
        await next();
    });
};
