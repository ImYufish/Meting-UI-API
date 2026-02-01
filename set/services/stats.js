import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isVercel } from '../config/database.js';
import { initMySQL, isUsingMySQL, dbOperations } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATS_FILE = path.join(__dirname, '../../data/api_stats.json');

const dataDir = path.dirname(STATS_FILE);
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
        console.log('⚠️ 无法创建data目录:', e.message);
    }
}

function getBeijingDateString() {
    return new Date().toLocaleDateString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
}

function getBeijingWeekString() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    
    const dayOfWeek = now.getDay();
    
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function getBeijingMonthString() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export let apiStats = {
    totalCalls: 0,
    todayCalls: 0,
    weekCalls: 0,
    monthCalls: 0,
    lastResetDate: getBeijingDateString(),
    lastWeeklyReset: getBeijingWeekString(),
    lastMonthlyReset: getBeijingMonthString(),
    lastUpdated: new Date().toISOString(),
    dailyCalls: {},
    weeklyCalls: {},
    monthlyCalls: {},
    hourlyCalls: {}
};

function loadStatsFromFile() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = fs.readFileSync(STATS_FILE, 'utf8');
            const loaded = JSON.parse(data);
            
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

export async function loadStats() {
    if (isVercel) {
        console.log('☁️ Vercel环境，跳过统计加载');
        return;
    }
    
    const mysqlInitialized = await initMySQL();
    
    if (mysqlInitialized && isUsingMySQL()) {
        const loaded = await loadStatsFromMySQL();
        if (loaded) {
            await checkAndResetStats();
            return;
        }
    }
    
    if (!loadStatsFromFile()) {
        await saveStats();
        console.log('📊 创建新的统计数据');
    } else {
        await checkAndResetStats();
    }
}

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

async function saveStatsToMySQL() {
    try {
        const today = getBeijingDateString();
        const currentWeek = getBeijingWeekString();
        const currentMonth = getBeijingMonthString();
        
        const dailyCalls = { ...(apiStats.dailyCalls || {}) };
        dailyCalls[today] = apiStats.todayCalls || 0;
        
        const weeklyCalls = { ...(apiStats.weeklyCalls || {}) };
        weeklyCalls[currentWeek] = apiStats.weekCalls || 0;
        
        const monthlyCalls = { ...(apiStats.monthlyCalls || {}) };
        monthlyCalls[currentMonth] = apiStats.monthCalls || 0;
        
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

export async function saveStats() {
    if (isVercel) {
        return;
    }
    
    apiStats.lastUpdated = new Date().toISOString();
    
    if (isUsingMySQL()) {
        await saveStatsToMySQL();
    }
    
    saveStatsToFile();
}

function isOldWeekFormat(weekStr) {
    return weekStr && /^\d{4}-W\d{2}$/.test(weekStr);
}

function isSameWeek(week1, week2) {
    if (week1 === week2) {
        return true;
    }
    
    if (!isOldWeekFormat(week1) && !isOldWeekFormat(week2)) {
        return week1 === week2;
    }
    
    return false;
}

export async function checkAndResetStats() {
    if (isVercel) {
        return;
    }
    
    const today = getBeijingDateString();
    const currentWeek = getBeijingWeekString();
    const currentMonth = getBeijingMonthString();
    
    let needSave = false;
    
    if (apiStats.lastResetDate !== today) {
        console.log(`🔄 检测到日期变化 (${apiStats.lastResetDate} -> ${today})，重置今日统计`);
        
        if (apiStats.lastResetDate && apiStats.todayCalls > 0) {
            if (!apiStats.dailyCalls) apiStats.dailyCalls = {};
            apiStats.dailyCalls[apiStats.lastResetDate] = apiStats.todayCalls;
        }
        
        apiStats.todayCalls = 0;
        apiStats.lastResetDate = today;
        needSave = true;
    }
    
    if (apiStats.lastWeeklyReset !== currentWeek) {
        const isFormatUpgrade = isOldWeekFormat(apiStats.lastWeeklyReset) && !isOldWeekFormat(currentWeek);
        
        if (isFormatUpgrade) {
            console.log(`📝 周标识格式升级 (${apiStats.lastWeeklyReset} -> ${currentWeek})，保留本周统计数据`);
            apiStats.lastWeeklyReset = currentWeek;
            needSave = true;
        } else if (!isSameWeek(apiStats.lastWeeklyReset, currentWeek)) {
            console.log(`🔄 检测到周变化 (${apiStats.lastWeeklyReset} -> ${currentWeek})，重置本周统计`);
            
            if (apiStats.lastWeeklyReset && apiStats.weekCalls > 0) {
                if (!apiStats.weeklyCalls) apiStats.weeklyCalls = {};
                apiStats.weeklyCalls[apiStats.lastWeeklyReset] = apiStats.weekCalls;
            }
            
            apiStats.weekCalls = 0;
            apiStats.lastWeeklyReset = currentWeek;
            needSave = true;
        }
    }
    
    if (apiStats.lastMonthlyReset !== currentMonth) {
        console.log(`🔄 检测到月变化 (${apiStats.lastMonthlyReset} -> ${currentMonth})，重置本月统计`);
        
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

export async function updateStats() {
    if (isVercel) {
        return;
    }
    
    await checkAndResetStats();
    
    apiStats.totalCalls++;
    apiStats.todayCalls++;
    apiStats.weekCalls++;
    apiStats.monthCalls++;
}

export async function incrementApiCalls() {
    await updateStats();
}

export function getTodayCalls() {
    return apiStats.todayCalls || 0;
}

export function getWeekCalls() {
    return apiStats.weekCalls || 0;
}

export function getMonthCalls() {
    return apiStats.monthCalls || 0;
}

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

export function getNextMonthlyReset() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntil = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
    
    return {
        time: nextMonth.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        formatted: `${daysUntil}天后`
    };
}

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

export function getApiStats() {
    return getAllStats();
}

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
