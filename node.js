import { serve } from '@hono/node-server'
import app, { initialize, PORT, getLocalIP } from './app.js'

const startServer = async () => {
    await initialize();
    
    const localIP = getLocalIP();
    
    const server = serve({
        fetch: app.fetch,
        port: PORT
    }, (info) => {
        console.log(`\n🎵 Meting API 服务已启动`);
        console.log(`📡 本地地址: http://localhost:${info.port}`);
        console.log(`📡 网络地址: http://${localIP}:${info.port}`);
        console.log(`\n💡 提示: 访问 http://localhost:${info.port} 查看服务状态`);
        console.log(`📊 统计页面: http://localhost:${info.port}/stats\n`);
    });

    let isShuttingDown = false;

    const shutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        
        console.log('\n正在关闭服务器...');
        
        server.close(async (err) => {
            if (err) {
                console.error('关闭服务器失败:', err);
                process.exit(1);
            }
            
            console.log('✅ 服务器已关闭');
            
            if (app.cleanup) {
                try {
                    await app.cleanup();
                } catch (error) {
                    console.error('清理失败:', error);
                }
            }
            
            setTimeout(() => {
                process.exit(0);
            }, 100);
        });
        
        setTimeout(() => {
            console.error('关闭超时，强制退出');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
        console.error('未处理的异常:', error);
        shutdown();
    });
    process.on('unhandledRejection', (reason) => {
        console.error('未处理的Promise拒绝:', reason);
        shutdown();
    });
};

startServer().catch(console.error);
