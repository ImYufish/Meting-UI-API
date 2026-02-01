/**
 * 路由汇总模块
 */

import { registerHomeRoutes, homeHandler } from './home.js';
import { registerStatsRoutes, statsHandler } from './stats.js';
import { registerApiRoutes, apiHandler, testHandler, healthHandler, docsHandler } from './api.js';

/**
 * 注册所有路由
 */
export const registerAllRoutes = (app) => {
    registerHomeRoutes(app);
    registerStatsRoutes(app);
    registerApiRoutes(app);
    
    console.log('✅ 所有路由注册完成');
};

// 导出各个路由模块
export { 
    registerHomeRoutes, 
    registerStatsRoutes, 
    registerApiRoutes 
};

// 导出各个处理器
export { homeHandler } from './home.js';
export { statsHandler } from './stats.js';
export { apiHandler, testHandler, healthHandler, docsHandler } from './api.js';
