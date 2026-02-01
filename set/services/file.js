import fs from 'fs/promises';
import { existsSync } from 'fs';
import { STATS_FILE } from '../config/database.js';
import { getBeijingDateString } from '../utils/time.js';

export const fileOperations = {
    loadStats: async () => {
        if (!existsSync(STATS_FILE)) return null;
        
        try {
            const data = await fs.readFile(STATS_FILE, 'utf8');
            const savedStats = JSON.parse(data);
            return {
                totalCalls: savedStats.totalCalls || 0,
                dailyCalls: savedStats.dailyCalls || {},
                hourlyCalls: savedStats.hourlyCalls || {},
                weeklyCalls: savedStats.weeklyCalls || {},
                monthlyCalls: savedStats.monthlyCalls || {},
                lastUpdated: savedStats.lastUpdated || new Date().toISOString(),
                lastResetDate: savedStats.lastResetDate || getBeijingDateString(),
                lastWeeklyReset: savedStats.lastWeeklyReset || getBeijingDateString(),
                lastMonthlyReset: savedStats.lastMonthlyReset || getBeijingDateString().slice(0, 7)
            };
        } catch (error) {
            console.error('❌ 从本地文件加载统计数据失败:', error);
            return null;
        }
    },

    saveStats: async (apiStats) => {
        try {
            await fs.writeFile(STATS_FILE, JSON.stringify(apiStats, null, 2), 'utf8');
            console.log('💾 统计数据已保存到本地文件');
            return true;
        } catch (error) {
            console.error('❌ 保存统计数据到本地文件失败:', error);
            return false;
        }
    },

    exists: () => existsSync(STATS_FILE)
};
