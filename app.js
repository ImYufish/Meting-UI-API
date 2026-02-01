/**
 * Meting API 主应用
 * 支持独立部署和 Vercel 部署
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import os from 'os';

// 导入配置和服务
import { isVercel } from './set/config/database.js';
import { loadStats, saveStats, checkAndResetStats } from './set/services/stats.js';

// 导入路由处理器
import { apiHandler, testHandler, healthHandler, docsHandler } from './set/routes/api.js';
import { statsHandler } from './set/routes/stats.js';
import { homeHandler } from './set/routes/home.js';

// 端口配置
export const PORT = process.env.PORT || 2500;

// 创建 Hono 应用
const app = new Hono();

// 中间件
app.use('*', cors());
app.use('*', logger());

// 静态文件服务 - 字体文件
app.get('/set/ziti/:filename', async (c) => {
    const filename = c.req.param('filename');
    const filePath = join(process.cwd(), 'set', 'ziti', filename);
    
    try {
        const stats = await stat(filePath);
        if (!stats.isFile()) {
            return c.text('Not Found', 404);
        }
        
        const ext = filename.split('.').pop().toLowerCase();
        const contentType = {
            'woff2': 'font/woff2',
            'woff': 'font/woff',
            'ttf': 'font/ttf',
            'otf': 'font/otf'
        }[ext] || 'application/octet-stream';
        
        const stream = createReadStream(filePath);
        return new Response(stream, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000'
            }
        });
    } catch (error) {
        return c.text('Not Found', 404);
    }
});

// ==================== 路由注册 ====================

// 首页
app.get('/', homeHandler);

// 核心 API
app.get('/api', apiHandler);

// 统计相关
app.get('/stats', statsHandler);
app.get('/stats/json', statsHandler);  // JSON 格式统计

// 辅助路由
app.get('/test', testHandler);
app.get('/health', healthHandler);
app.get('/docs', docsHandler);

// ==================== 错误处理 ====================

// 404 处理
app.notFound((c) => {
    return c.json({
        error: true,
        message: '未找到请求的资源',
        path: c.req.path,
        availableEndpoints: {
            home: '/',
            api: '/api?server=netease&type=song&id=1901371647',
            stats: '/stats',
            health: '/health',
            docs: '/docs',
            test: '/test'
        }
    }, 404);
});

// 全局错误处理
app.onError((err, c) => {
    console.error('应用错误:', err);
    return c.json({
        error: true,
        message: err.message || '服务器内部错误'
    }, 500);
});

// ==================== 初始化和清理 ====================

// 保存定时器引用
let saveInterval = null;
let resetInterval = null;

/**
 * 获取本地 IP 地址
 */
export function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

/**
 * 初始化应用
 */
export async function initialize() {
    if (isVercel) {
        console.log('☁️ Vercel 环境，跳过本地初始化');
        return;
    }
    
    console.log('🚀 初始化 Meting API 服务...');
    
    try {
        // 加载统计数据
        await loadStats();
        console.log('📊 统计数据加载完成');
        
        // 设置定时保存（每5分钟）
        saveInterval = setInterval(async () => {
            try {
                await saveStats();
                console.log('💾 统计数据已自动保存');
            } catch (error) {
                console.error('❌ 自动保存失败:', error.message);
            }
        }, 5 * 60 * 1000);
        
        // 设置定时检查重置（每小时）
        resetInterval = setInterval(async () => {
            try {
                await checkAndResetStats();
            } catch (error) {
                console.error('❌ 重置检查失败:', error.message);
            }
        }, 60 * 60 * 1000);
        
        console.log('✅ Meting API 服务初始化完成');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        throw error;
    }
}

/**
 * 清理函数（优雅关闭时调用）
 */
export async function cleanup() {
    console.log('🧹 正在清理资源...');
    
    // 清除定时器
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
    if (resetInterval) {
        clearInterval(resetInterval);
        resetInterval = null;
    }
    
    // 保存统计数据
    if (!isVercel) {
        try {
            await saveStats();
            console.log('💾 统计数据已保存');
        } catch (error) {
            console.error('❌ 保存统计数据失败:', error.message);
        }
    }
    
    console.log('✅ 清理完成');
}

// 将 cleanup 挂载到 app 上，供 node.js 调用
app.cleanup = cleanup;

export default app;