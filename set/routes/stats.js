import { isVercel } from '../config/database.js';
import { getApiStats, getApiStatsAsync } from '../services/stats.js';

export const statsHandler = async (c) => {
    if (isVercel) {
        return c.json({
            message: 'Vercel 环境不支持统计功能',
            reason: '无状态部署环境无法持久化统计数据'
        });
    }
    
    try {
        const stats = await getApiStatsAsync();
        return c.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        return c.json({
            success: false,
            error: error.message
        }, 500);
    }
};

export const registerStatsRoutes = (app) => {
    app.get('/stats', statsHandler);
    app.get('/stats/json', statsHandler);
    console.log('✅ 统计路由注册完成');
};

export default statsHandler;
