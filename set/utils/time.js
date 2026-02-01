/**
 * 时间工具函数模块
 * 提供北京时间相关的工具函数
 */

// 获取北京时间 Date 对象
export const getBeijingDate = () => {
    const now = new Date();
    return new Date(now.getTime() + 8 * 60 * 60 * 1000);
};

// 获取北京时间日期字符串 (YYYY-MM-DD)
export const getBeijingDateString = () => {
    return getBeijingDate().toISOString().split('T')[0];
};

// 获取北京时间小时
export const getBeijingHour = () => {
    return getBeijingDate().getUTCHours();
};

// 获取周数
export const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

// 获取周键值 (YYYY-Www)
export const getWeekKey = () => {
    const beijingDate = getBeijingDate();
    const year = beijingDate.getFullYear();
    const week = getWeekNumber(beijingDate);
    return `${year}-W${week.toString().padStart(2, '0')}`;
};

// 获取月键值 (YYYY-MM)
export const getMonthKey = () => {
    const beijingDate = getBeijingDate();
    const year = beijingDate.getFullYear();
    const month = beijingDate.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}`;
};

// 获取下次日重置时间
export const getNextResetTime = () => {
    const now = getBeijingDate();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeDiff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    const timeStr = tomorrow.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    return {
        time: timeStr,
        hours,
        minutes,
        seconds,
        formatted: `${hours}小时${minutes}分${seconds}秒后`
    };
};

// 获取下次周重置时间
export const getNextWeeklyReset = () => {
    const now = getBeijingDate();
    const nextMonday = new Date(now);
    const currentDay = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    
    // 计算到下周一的天数
    // 如果今天是周日(0)，则下周一是1天后
    // 如果今天是周一(1)，则下周一是7天后
    // 如果今天是周二(2)，则下周一是6天后
    const daysUntilMonday = currentDay === 0 ? 1 : (8 - currentDay);
    
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    
    const timeDiff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return {
        time: nextMonday.toLocaleString('zh-CN', { 
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }),
        days,
        hours,
        formatted: days > 0 ? `${days}天${hours}小时后` : `${hours}小时后`
    };
};

// 获取下次月重置时间
export const getNextMonthlyReset = () => {
    const now = getBeijingDate();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);
    
    const timeDiff = nextMonth.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return {
        time: nextMonth.toLocaleString('zh-CN', { 
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        days,
        hours,
        formatted: `${days}天${hours}小时后`
    };
};

// 格式化当前时间
export const formatCurrentTime = () => {
    return new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};
