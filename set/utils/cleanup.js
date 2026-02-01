import { closeDatabase } from '../services/database.js';
import { saveStats } from '../services/stats.js';
import { isVercel } from '../config/database.js';

export const setupGracefulShutdown = () => {
    if (isVercel) {
        console.log('ℹ️  Vercel环境：跳过优雅关闭设置');
        return;
    }

    const gracefulShutdown = async (signal) => {
        console.log(`\n📴 收到 ${signal} 信号，正在优雅关闭...`);
        
        try {
            await saveStats();
            console.log('✅ 统计数据已保存');
            
            await closeDatabase();
            console.log('✅ 数据库连接已关闭');
            
            console.log('👋 服务已安全关闭');
            process.exit(0);
        } catch (error) {
            console.error('❌ 关闭过程中出错:', error);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    console.log('✅ 优雅关闭处理器已设置');
};

export const setupAutoSave = (intervalMs = 60000) => {
    if (isVercel) {
        console.log('ℹ️  Vercel环境：跳过自动保存设置');
        return null;
    }

    const intervalId = setInterval(async () => {
        try {
            await saveStats();
            console.log('⏰ 定时保存统计数据完成');
        } catch (error) {
            console.error('❌ 定时保存失败:', error);
        }
    }, intervalMs);
    
    console.log(`✅ 自动保存已设置，间隔: ${intervalMs / 1000}秒`);
    return intervalId;
};
