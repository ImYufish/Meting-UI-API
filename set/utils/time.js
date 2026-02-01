export const getBeijingDate = () => {
    const now = new Date();
    return new Date(now.getTime() + 8 * 60 * 60 * 1000);
};

export const getBeijingDateString = () => {
    return getBeijingDate().toISOString().split('T')[0];
};

export const getBeijingHour = () => {
    return getBeijingDate().getUTCHours();
};

export const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 +1) / 7);
};

export const getWeekKey = () => {
    const beijingDate = getBeijingDate();
    const year = beijingDate.getFullYear();
    const week = getWeekNumber(beijingDate);
    return `${year}-W${week.toString().padStart(2, '0')}`;
};

export const getMonthKey = () => {
    const beijingDate = getBeijingDate();
    const year = beijingDate.getFullYear();
    const month = beijingDate.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}`;
};

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

export const getNextWeeklyReset = () => {
    const now = getBeijingDate();
    const nextMonday = new Date(now);
    const currentDay = now.getDay();
    
    const daysUntilMonday = currentDay === 0 ?1 : (8 - currentDay);
    
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
