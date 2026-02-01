/**
 * 统计服务模块
 * 处理API调用统计相关功能
 * 支持 MySQL 和本地文件存储
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isVercel } from '../config/database.js';
import { initMySQL, isUsingMySQL, dbOperations } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 统计数据文件路径
const STATS_FILE = path.join(__dirname, '../../data/api_stats.json');

// 确保data目录存在
const dataDir = path.dirname(STATS_FILE);
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
        console.log('⚠️ 无法创建data目录:', e.message);
    }
}

/**
 * 获取北京时间的日期字符串 (YYYY-MM-DD)
 */
function getBeijingDateString() {
    return new Date().toLocaleDateString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
}

/**
 * 获取北京时间的周标识
 * 使用本周一的日期作为标识 (YYYY-MM-DD)
 * 这样每周一00:00会自动切换到新的周标识
 */
function getBeijingWeekString() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    
    // 获取当前是星期几 (0=周日, 1=周一, ..., 6=周六)
    const dayOfWeek = now.getDay();
    
    // 计算本周一的日期
    // 如果今天是周日(0)，本周一是昨天往前推6天
    // 如果今天是周一(1)，本周一就是今天
    // 如果今天是周二(2)，本周一是昨天
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    
    // 返回本周一的日期作为周标识
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 获取北京时间的月标识 (YYYY-MM)
 */
function getBeijingMonthString() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// API统计数据
export let apiStats = {
    totalCalls: 0,
    todayCalls: 0,
    weekCalls: 0,
    monthCalls: 0,
    // 使用标准格式存储日期标识
    lastResetDate: getBeijingDateString(),      // YYYY-MM-DD
    lastWeeklyReset: getBeijingWeekString(),    // YYYY-WXX
    lastMonthlyReset: getBeijingMonthString(),  // YYYY-MM
    lastUpdated: new Date().toISOString(),
    // 历史数据
    dailyCalls: {},
    weeklyCalls: {},
    monthlyCalls: {},
    hourlyCalls: {}
};

/**
 * 从本地文件加载统计数据
 */
function loadStatsFromFile() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = fs.readFileSync(STATS_FILE, 'utf8');
            const loaded = JSON.parse(data);
            
            // 合并加载的数据，确保所有字段都有默认值
            apiStats = {
                totalCalls: loaded.totalCalls || 0,
                todayCalls: loaded.todayCalls || 0,
                weekCalls: loaded.weekCalls || 0,
                monthCalls: loaded.monthCalls || 0,
                lastResetDate: loaded.lastResetDate || getBeijingDateString(),
                lastWeeklyReset: loaded.lastWeeklyReset || getBeijingWeekString(),
                lastMonthlyReset: loaded.lastMonthlyReset || getBeijingMonthString(),
                lastUpdated: loaded.lastUpdated || new Date().toISOString(),
                dailyCalls: loaded.dailyCalls || {},
                weeklyCalls: loaded.weeklyCalls || {},
                monthlyCalls: loaded.monthlyCalls || {},
                hourlyCalls: loaded.hourlyCalls || {}
            };
            
            console.log('📊 统计数据已从本地文件加载');
            return true;
        }
    } catch (error) {
        console.error('❌ 从本地文件加载统计数据失败:', error.message);
    }
    return false;
}

/**
 * 从MySQL加载统计数据
 */
async function loadStatsFromMySQL() {
    try {
        const dbStats = await dbOperations.loadStats();
        if (dbStats) {
            const today = getBeijingDateString();
            const currentWeek = getBeijingWeekString();
            const currentMonth = getBeijingMonthString();
            
            apiStats = {
                totalCalls: dbStats.totalCalls || 0,
                todayCalls: dbStats.dailyCalls?.[today] || 0,
                weekCalls: dbStats.weeklyCalls?.[currentWeek] || 0,
                monthCalls: dbStats.monthlyCalls?.[currentMonth] || 0,
                lastResetDate: dbStats.lastResetDate || today,
                lastWeeklyReset: dbStats.lastWeeklyReset || currentWeek,
                lastMonthlyReset: dbStats.lastMonthlyReset || currentMonth,
                lastUpdated: dbStats.lastUpdated || new Date().toISOString(),
                dailyCalls: dbStats.dailyCalls || {},
                weeklyCalls: dbStats.weeklyCalls || {},
                monthlyCalls: dbStats.monthlyCalls || {},
                hourlyCalls: dbStats.hourlyCalls || {}
            };
            
            console.log('📊 统计数据已从 MySQL 加载');
            console.log(`   总调用: ${apiStats.totalCalls}, 今日: ${apiStats.todayCalls}, 本周: ${apiStats.weekCalls}, 本月: ${apiStats.monthCalls}`);
            return true;
        }
    } catch (error) {
        console.error('❌ 从 MySQL 加载统计数据失败:', error.message);
    }
    return false;
}

/**
 * 加载统计数据（主函数）
 */
export async function loadStats() {
    if (isVercel) {
        console.log('☁️ Vercel环境，跳过统计加载');
        return;
    }
    
    // 首先尝试初始化 MySQL
    const mysqlInitialized = await initMySQL();
    
    if (mysqlInitialized && isUsingMySQL()) {
        const loaded = await loadStatsFromMySQL();
        if (loaded) {
            // 加载后立即检查是否需要重置（基于日期变化）
            await checkAndResetStats();
            return;
        }
    }
    
    // 回退到本地文件
    if (!loadStatsFromFile()) {
        await saveStats();
        console.log('📊 创建新的统计数据');
    } else {
        // 加载后立即检查是否需要重置
        await checkAndResetStats();
    }
}

/**
 * 保存统计数据到本地文件
 */
function saveStatsToFile() {
    try {
        const saveData = {
            totalCalls: apiStats.totalCalls || 0,
            todayCalls: apiStats.todayCalls || 0,
            weekCalls: apiStats.weekCalls || 0,
            monthCalls: apiStats.monthCalls || 0,
            lastResetDate: apiStats.lastResetDate || getBeijingDateString(),
            lastWeeklyReset: apiStats.lastWeeklyReset || getBeijingWeekString(),
            lastMonthlyReset: apiStats.lastMonthlyReset || getBeijingMonthString(),
            lastUpdated: new Date().toISOString(),
            dailyCalls: apiStats.dailyCalls || {},
            weeklyCalls: apiStats.weeklyCalls || {},
            monthlyCalls: apiStats.monthlyCalls || {},
            hourlyCalls: apiStats.hourlyCalls || {}
        };
        fs.writeFileSync(STATS_FILE, JSON.stringify(saveData, null, 2));
        return true;
    } catch (error) {
        console.error('❌ 保存统计数据到本地文件失败:', error.message);
        return false;
    }
}

/**
 * 保存统计数据到MySQL
 */
async function saveStatsToMySQL() {
    try {
        const today = getBeijingDateString();
        const currentWeek = getBeijingWeekString();
        const currentMonth = getBeijingMonthString();
        
        // 更新当前时段的数据
        const dailyCalls = { ...(apiStats.dailyCalls || {}) };
        dailyCalls[today] = apiStats.todayCalls || 0;
        
        const weeklyCalls = { ...(apiStats.weeklyCalls || {}) };
        weeklyCalls[currentWeek] = apiStats.weekCalls || 0;
        
        const monthlyCalls = { ...(apiStats.monthlyCalls || {}) };
        monthlyCalls[currentMonth] = apiStats.monthCalls || 0;
        
        // 构建数据库格式的数据，确保没有 undefined
        const dbData = {
            totalCalls: apiStats.totalCalls || 0,
            dailyCalls: dailyCalls,
            hourlyCalls: apiStats.hourlyCalls || {},
            weeklyCalls: weeklyCalls,
            monthlyCalls: monthlyCalls,
            lastResetDate: apiStats.lastResetDate || today,
            lastWeeklyReset: apiStats.lastWeeklyReset || currentWeek,
            lastMonthlyReset: apiStats.lastMonthlyReset || currentMonth
        };
        
        return await dbOperations.saveStats(dbData);
    } catch (error) {
        console.error('❌ 保存统计数据到 MySQL 失败:', error.message);
        return false;
    }
}

/**
 * 保存统计数据（主函数）
 */
export async function saveStats() {
    if (isVercel) {
        return;
    }
    
    apiStats.lastUpdated = new Date().toISOString();
    
    if (isUsingMySQL()) {
        await saveStatsToMySQL();
    }
    
    // 同时保存到本地文件作为备份
    saveStatsToFile();
}

/**
 * 检查周标识格式是否为旧格式 (YYYY-WXX)
 */
function isOldWeekFormat(weekStr) {
    return weekStr && /^\d{4}-W\d{2}$/.test(weekStr);
}

/**
 * 检查两个周标识是否表示同一周
 * 兼容旧格式 (YYYY-WXX) 和新格式 (YYYY-MM-DD)
 */
function isSameWeek(week1, week2) {
    // 如果格式相同，直接比较
    if (week1 === week2) {
        return true;
    }
    
    // 如果都是新格式，直接比较
    if (!isOldWeekFormat(week1) && !isOldWeekFormat(week2)) {
        return week1 === week2;
    }
    
    // 如果有旧格式，需要转换后比较
    // 由于旧格式无法精确转换为新格式，我们认为格式不同就是不同周
    // 但为了避免数据丢失，在格式升级时不重置数据
    return false;
}

/**
 * 检查并重置统计（基于日期变化）
 */
export async function checkAndResetStats() {
    if (isVercel) {
        return;
    }
    
    const today = getBeijingDateString();
    const currentWeek = getBeijingWeekString();
    const currentMonth = getBeijingMonthString();
    
    let needSave = false;
    
    // 检查日重置 - 只有日期变化时才重置
    if (apiStats.lastResetDate !== today) {
        console.log(`🔄 检测到日期变化 (${apiStats.lastResetDate} -> ${today})，重置今日统计`);
        
        // 保存昨天的数据到历史记录
        if (apiStats.lastResetDate && apiStats.todayCalls > 0) {
            if (!apiStats.dailyCalls) apiStats.dailyCalls = {};
            apiStats.dailyCalls[apiStats.lastResetDate] = apiStats.todayCalls;
        }
        
        apiStats.todayCalls = 0;
        apiStats.lastResetDate = today;
        needSave = true;
    }
    
    // 检查周重置 - 需要兼容格式变化
    if (apiStats.lastWeeklyReset !== currentWeek) {
        // 检查是否是格式升级（从旧格式到新格式）
        const isFormatUpgrade = isOldWeekFormat(apiStats.lastWeeklyReset) && !isOldWeekFormat(currentWeek);
        
        if (isFormatUpgrade) {
            // 格式升级：只更新格式，不重置数据，不保存到历史
            console.log(`📝 周标识格式升级 (${apiStats.lastWeeklyReset} -> ${currentWeek})，保留本周统计数据`);
            apiStats.lastWeeklyReset = currentWeek;
            needSave = true;
        } else if (!isSameWeek(apiStats.lastWeeklyReset, currentWeek)) {
            // 真正的周变化：重置统计
            console.log(`🔄 检测到周变化 (${apiStats.lastWeeklyReset} -> ${currentWeek})，重置本周统计`);
            
            // 保存上周的数据到历史记录
            if (apiStats.lastWeeklyReset && apiStats.weekCalls > 0) {
                if (!apiStats.weeklyCalls) apiStats.weeklyCalls = {};
                apiStats.weeklyCalls[apiStats.lastWeeklyReset] = apiStats.weekCalls;
            }
            
            apiStats.weekCalls = 0;
            apiStats.lastWeeklyReset = currentWeek;
            needSave = true;
        }
    }
    
    // 检查月重置 - 只有月变化时才重置
    if (apiStats.lastMonthlyReset !== currentMonth) {
        console.log(`🔄 检测到月变化 (${apiStats.lastMonthlyReset} -> ${currentMonth})，重置本月统计`);
        
        // 保存上月的数据到历史记录
        if (apiStats.lastMonthlyReset && apiStats.monthCalls > 0) {
            if (!apiStats.monthlyCalls) apiStats.monthlyCalls = {};
            apiStats.monthlyCalls[apiStats.lastMonthlyReset] = apiStats.monthCalls;
        }
        
        apiStats.monthCalls = 0;
        apiStats.lastMonthlyReset = currentMonth;
        needSave = true;
    }
    
    if (needSave) {
        await saveStats();
    }
}

/**
 * 更新统计数据（增加调用次数）
 */
export async function updateStats() {
    if (isVercel) {
        return;
    }
    
    // 先检查是否需要重置
    await checkAndResetStats();
    
    apiStats.totalCalls++;
    apiStats.todayCalls++;
    apiStats.weekCalls++;
    apiStats.monthCalls++;
    
    // 不在每次请求时保存，由定时器处理
}

/**
 * 增加API调用计数（updateStats的别名）
 */
export async function incrementApiCalls() {
    await updateStats();
}

/**
 * 获取今日调用次数
 */
export function getTodayCalls() {
    return apiStats.todayCalls || 0;
}

/**
 * 获取本周调用次数
 */
export function getWeekCalls() {
    return apiStats.weekCalls || 0;
}

/**
 * 获取本月调用次数
 */
export function getMonthCalls() {
    return apiStats.monthCalls || 0;
}

/**
 * 获取下次重置时间（每日）
 */
export function getNextResetTime() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const hoursLeft = Math.floor((tomorrow - now) / 3600000);
    
    return {
        time: tomorrow.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        formatted: `${hoursLeft}小时后`
    };
}

/**
 * 获取下次周重置时间
 */
export function getNextWeeklyReset() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const day = now.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    
    return {
        time: nextMonday.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        formatted: `${daysUntilMonday}天后`
    };
}

/**
 * 获取下次月重置时间
 */
export function getNextMonthlyReset() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntil = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
    
    return {
        time: nextMonth.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        formatted: `${daysUntil}天后`
    };
}

/**
 * 获取所有统计数据
 */
export function getAllStats() {
    return {
        totalCalls: apiStats.totalCalls || 0,
        todayCalls: apiStats.todayCalls || 0,
        weekCalls: apiStats.weekCalls || 0,
        monthCalls: apiStats.monthCalls || 0,
        lastUpdated: apiStats.lastUpdated,
        nextReset: getNextResetTime(),
        nextWeeklyReset: getNextWeeklyReset(),
        nextMonthlyReset: getNextMonthlyReset(),
        storageType: isUsingMySQL() ? 'MySQL' : '本地文件'
    };
}

/**
 * 获取API统计数据（getAllStats的别名）
 */
export function getApiStats() {
    return getAllStats();
}

/**
 * 异步获取API统计数据
 */
export async function getApiStatsAsync() {
    await checkAndResetStats();
    return getAllStats();
}

export default {
    apiStats,
    loadStats,
    saveStats,
    checkAndResetStats,
    updateStats,
    incrementApiCalls,
    getTodayCalls,
    getWeekCalls,
    getMonthCalls,
    getNextResetTime,
    getNextWeeklyReset,
    getNextMonthlyReset,
    getAllStats,
    getApiStats,
    getApiStatsAsync
};
