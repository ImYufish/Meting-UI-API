import { registerHomeRoutes, homeHandler } from './home.js';
import { registerStatsRoutes, statsHandler } from './stats.js';
import { registerApiRoutes, apiHandler, testHandler, healthHandler, docsHandler } from './api.js';

export const registerAllRoutes = (app) => {
    registerHomeRoutes(app);
    registerStatsRoutes(app);
    registerApiRoutes(app);
    
    console.log('✅ 所有路由注册完成');
};

export { 
    registerHomeRoutes, 
    registerStatsRoutes, 
    registerApiRoutes 
};

export { homeHandler } from './home.js';
export { statsHandler } from './stats.js';
export { apiHandler, testHandler, healthHandler, docsHandler } from './api.js';
