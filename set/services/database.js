import { DB_CONFIG, mysql } from '../config/database.js';

let dbPool = null;
let useMySQL = false;

export const getDbPool = () => dbPool;

export const isUsingMySQL = () => useMySQL;

const initDatabaseTables = async () => {
    if (!dbPool) return;

    try {
        await dbPool.execute(`
            CREATE TABLE IF NOT EXISTS api_statistics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                stat_key VARCHAR(100) UNIQUE NOT NULL,
                stat_value JSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        await dbPool.execute(`
            CREATE TABLE IF NOT EXISTS api_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                endpoint VARCHAR(255) NOT NULL,
                method VARCHAR(10) NOT NULL,
                status_code INT NOT NULL,
                response_time_ms INT NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_endpoint (endpoint),
                INDEX idx_created_at (created_at),
                INDEX idx_status_code (status_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ 数据库表初始化完成');
    } catch (error) {
        console.error('❌ 数据库表初始化失败:', error);
        throw error;
    }
};

export const initMySQL = async () => {
    if (!mysql) return false;

    const hasDBConfig = DB_CONFIG.host && DB_CONFIG.user && DB_CONFIG.database;
    const isDefaultConfig = DB_CONFIG.host === 'localhost' && DB_CONFIG.user === 'root' && !DB_CONFIG.password;
    
    if (!hasDBConfig || isDefaultConfig) {
        console.log('ℹ️  未配置数据库连接信息或使用默认配置，使用本地文件存储');
        return false;
    }

    try {
        console.log('🔗 尝试连接数据库...');
        dbPool = mysql.createPool(DB_CONFIG);
        
        const connection = await dbPool.getConnection();
        console.log('✅ 数据库连接成功');
        connection.release();

        await initDatabaseTables();
        useMySQL = true;
        console.log('💾 已启用数据库存储');
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        if (dbPool) {
            await dbPool.end();
            dbPool = null;
        }
        useMySQL = false;
        return false;
    }
};

export const closeDatabase = async () => {
    if (dbPool) {
        try {
            console.log('🔒 关闭数据库连接池...');
            await dbPool.end();
            dbPool = null;
            console.log('✅ 数据库连接池已关闭');
        } catch (error) {
            console.error('❌ 关闭数据库连接池失败:', error);
        }
    }
};

const parseValue = (rows) => {
    const value = rows[0]?.stat_value;
    if (!value) return null;
    return typeof value === 'string' ? JSON.parse(value) : value;
};

const safeValue = (val, defaultVal = null) => {
    if (val === undefined) return defaultVal;
    return val;
};

const safeStringify = (obj) => {
    return JSON.stringify(obj, (key, value) => {
        if (value === undefined) return null;
        return value;
    });
};

const getDateString = () => {
    return new Date().toLocaleDateString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
};

const getWeekString = () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const year = now.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
};

const getMonthString = () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const dbOperations = {
    loadStats: async () => {
        if (!dbPool) return null;

        try {
            const [totalRows] = await dbPool.execute(
                'SELECT stat_value FROM api_statistics WHERE stat_key = ?',
                ['total_calls']
            );
            const [dailyRows] = await dbPool.execute(
                'SELECT stat_value FROM api_statistics WHERE stat_key = ?',
                ['daily_calls']
            );
            const [hourlyRows] = await dbPool.execute(
                'SELECT stat_value FROM api_statistics WHERE stat_key = ?',
                ['hourly_calls']
            );
            const [weeklyRows] = await dbPool.execute(
                'SELECT stat_value FROM api_statistics WHERE stat_key = ?',
                ['weekly_calls']
            );
            const [monthlyRows] = await dbPool.execute(
                'SELECT stat_value FROM api_statistics WHERE stat_key = ?',
                ['monthly_calls']
            );
            const [metaRows] = await dbPool.execute(
                'SELECT stat_value FROM api_statistics WHERE stat_key = ?',
                ['metadata']
            );

            const total = parseValue(totalRows);
            const daily = parseValue(dailyRows);
            const hourly = parseValue(hourlyRows);
            const weekly = parseValue(weeklyRows);
            const monthly = parseValue(monthlyRows);
            const meta = parseValue(metaRows);

            return {
                totalCalls: total?.totalCalls || 0,
                dailyCalls: daily || {},
                hourlyCalls: hourly || {},
                weeklyCalls: weekly || {},
                monthlyCalls: monthly || {},
                lastUpdated: meta?.lastUpdated || new Date().toISOString(),
                lastResetDate: meta?.lastResetDate || getDateString(),
                lastWeeklyReset: meta?.lastWeeklyReset || getWeekString(),
                lastMonthlyReset: meta?.lastMonthlyReset || getMonthString()
            };
        } catch (error) {
            console.error('❌ 从数据库加载统计数据失败:', error);
            return null;
        }
    },

    saveStats: async (apiStats) => {
        if (!dbPool) return false;

        try {
            const now = new Date().toISOString();
            
            const metadata = {
                lastUpdated: now,
                lastResetDate: safeValue(apiStats.lastResetDate, getDateString()),
                lastWeeklyReset: safeValue(apiStats.lastWeeklyReset, getWeekString()),
                lastMonthlyReset: safeValue(apiStats.lastMonthlyReset, getMonthString())
            };

            const queries = [
                ['total_calls', safeStringify({ totalCalls: safeValue(apiStats.totalCalls, 0) })],
                ['daily_calls', safeStringify(safeValue(apiStats.dailyCalls, {}))],
                ['hourly_calls', safeStringify(safeValue(apiStats.hourlyCalls, {}))],
                ['weekly_calls', safeStringify(safeValue(apiStats.weeklyCalls, {}))],
                ['monthly_calls', safeStringify(safeValue(apiStats.monthlyCalls, {}))],
                ['metadata', safeStringify(metadata)]
            ];

            for (const [key, value] of queries) {
                await dbPool.execute(
                    `INSERT INTO api_statistics (stat_key, stat_value) 
                     VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE stat_value = ?, updated_at = CURRENT_TIMESTAMP`,
                    [key, value, value]
                );
            }

            console.log('💾 统计数据已保存到数据库');
            return true;
        } catch (error) {
            console.error('❌ 保存统计数据到数据库失败:', error);
            return false;
        }
    },

    logApiRequest: async (endpoint, method, statusCode, responseTime, ip, userAgent) => {
        if (!dbPool) return;
        
        try {
            await dbPool.execute(
                'INSERT INTO api_logs (endpoint, method, status_code, response_time_ms, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    safeValue(endpoint, '/'),
                    safeValue(method, 'GET'),
                    safeValue(statusCode, 200),
                    safeValue(responseTime, 0),
                    safeValue(ip, null),
                    safeValue(userAgent, null)
                ]
            );
        } catch (error) {
            console.error('❌ 记录API日志失败:', error);
        }
    },

    getAnalytics: async () => {
        if (!dbPool) return null;
        
        try {
            const [topEndpoints] = await dbPool.execute(
                'SELECT endpoint, COUNT(*) as count FROM api_logs GROUP BY endpoint ORDER BY count DESC LIMIT 10'
            );
            
            const [statusCodes] = await dbPool.execute(
                'SELECT status_code, COUNT(*) as count FROM api_logs GROUP BY status_code ORDER BY count DESC'
            );
            
            const [responseTimes] = await dbPool.execute(
                'SELECT AVG(response_time_ms) as avg_time, MIN(response_time_ms) as min_time, MAX(response_time_ms) as max_time FROM api_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
            );
            
            const [hourlyActivity] = await dbPool.execute(
                'SELECT HOUR(created_at) as hour, COUNT(*) as count FROM api_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) GROUP BY HOUR(created_at) ORDER BY hour'
            );
            
            return {
                topEndpoints,
                statusCodes,
                responseTimes: responseTimes[0] || {},
                hourlyActivity
            };
        } catch (error) {
            console.error('❌ 获取分析数据失败:', error);
            return null;
        }
    }
};

export default {
    getDbPool,
    isUsingMySQL,
    initMySQL,
    closeDatabase,
    dbOperations
};
