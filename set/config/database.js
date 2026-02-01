export const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV);

export const STATS_FILE = './stats.json';

export const metingConfig = {
    url: process.env.METING_URL || '',
    token: process.env.METING_TOKEN || 'token',
    cookie: {
        allowHosts: process.env.METING_COOKIE_ALLOW_HOSTS
            ? (process.env.METING_COOKIE_ALLOW_HOSTS).split(',').map(h => h.trim().toLowerCase())
            : []
    }
};

let DB_CONFIG;
let mysql = null;

const initConfig = async () => {
    if (isVercel) {
        const hasHost = process.env.CHUYE_MYSQL_HOST;
        const hasPassword = process.env.CHUYE_MYSQL_PASSWD;
        
        if (hasHost && hasPassword) {
            console.log('☁️ Vercel 环境：使用环境变量配置数据库');
            DB_CONFIG = {
                host: process.env.CHUYE_MYSQL_HOST,
                port: parseInt(process.env.CHUYE_MYSQL_PORT) || 3306,
                user: process.env.CHUYE_MYSQL_USER || 'meting',
                password: process.env.CHUYE_MYSQL_PASSWD,
                database: process.env.CHUYE_MYSQL_DB || 'meting',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                charset: 'utf8mb4'
            };
        } else {
            console.log('ℹ️  Vercel 环境：未配置MySQL环境变量，不使用统计功能');
            DB_CONFIG = null;
        }
    } else {
        try {
            const mysqlConfig = await import('../../setting/mysql.js');
            DB_CONFIG = mysqlConfig.default;
            console.log('✅ 从mysql.js加载数据库配置');
        } catch (error) {
            console.log('ℹ️  未找到mysql.js配置文件，使用本地文件存储');
            DB_CONFIG = null;
        }
    }
};

const initMySQL = async () => {
    try {
        mysql = (await import('mysql2/promise')).default;
        console.log('✅ MySQL2 模块加载成功');
    } catch (error) {
        console.log('ℹ️  MySQL2 模块未安装，将使用本地文件存储');
    }
};

await initConfig();
await initMySQL();

export { DB_CONFIG, mysql };

export default {
    isVercel,
    DB_CONFIG,
    mysql,
    STATS_FILE,
    meting: metingConfig
};
