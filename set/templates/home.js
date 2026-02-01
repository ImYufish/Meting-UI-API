/**
 * 主页模板
 * 生成主页HTML内容
 */

import { isVercel } from '../config/database.js';
import config from '../../src/config.js';

/**
 * 生成主页HTML
 * @param {Object} data - 页面数据
 * @returns {string} HTML字符串
 */
export const generateHomePage = (data) => {
    const {
        currentTime,
        runtime,
        apiUrl,
        testUrl,
        healthUrl,
        correctBaseUrl,
        requestUrl,
        totalCalls,
        todayCalls,
        weekCalls,
        monthCalls,
        lastUpdated,
        nextReset,
        nextWeeklyReset,
        nextMonthlyReset,
        storageType,
        storageIcon
    } = data;

    const baseUrl = requestUrl.replace(/\/+$/, '');
    const docsUrl = isVercel ? `${baseUrl}/docs` : `${baseUrl}/meting/docs`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>初叶🍂Meting API 服务</title>
    <meta name="description" content="初叶Meting API服务 - 提供稳定可靠的音乐API接口">
    <link rel="icon" href="https://cloud.chuyel.top/f/PkZsP/tu%E5%B7%B2%E5%8E%BB%E5%BA%95.png" type="image/jpeg">
    <meta name="theme-color" content="#50B7FE">
    
    <style>
        /* 基础样式 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        
        /* 深色主题变量 */
        :root {
            --bg-primary: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
                          url('https://img.chuyel.top/api') no-repeat center center fixed;
            --bg-overlay: rgba(0, 0, 0, 0.4);
            --card-bg: rgba(255, 255, 255, 0.15);
            --card-bg-hover: rgba(255, 255, 255, 0.2);
            --text-primary: #ffffff;
            --text-secondary: rgba(255, 255, 255, 0.9);
            --text-muted: rgba(255, 255, 255, 0.5);
            --border-color: rgba(255, 255, 255, 0.2);
            --shadow-color: rgba(0, 0, 0, 0.3);
            --accent-color: #50B7FE;
            --accent-hover: #3AA7FE;
            --success-color: #2ecc71;
            --warning-color: #f39c12;
            --danger-color: #e74c3c;
            --btn-primary: linear-gradient(45deg, #50B7FE, #3AA7FE);
            --btn-success: linear-gradient(45deg, #2ecc71, #27ae60);
            --btn-purple: linear-gradient(45deg, #9b59b6, #8e44ad);
            --btn-orange: linear-gradient(45deg, #ff7e5f, #feb47b);
            --stat-total: #50B7FE;
            --stat-today: #FFE92C;
            --stat-week: #FF9C00;
            --stat-month: #10FBDF;
            --time-color: #FFE92C;
            --development-color: #50B7FE;
            --version-gradient: linear-gradient(90deg, #50B7FE, #FFE92C);
        }
        
        /* 浅色主题变量 */
        [data-theme="light"] {
            --bg-primary: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
                          url('https://img.chuyel.top/api') no-repeat center center fixed;
            --bg-overlay: rgba(255, 255, 255, 0.4);
            --card-bg: rgba(255, 255, 255, 0.5);
            --card-bg-hover: rgba(255, 255, 255, 0.9);
            --text-primary: #333333;
            --text-secondary: #555555;
            --text-muted: #777777;
            --border-color: rgba(0, 0, 0, 0.1);
            --shadow-color: rgba(0, 0, 0, 0.1);
            --accent-color: #50B7FE;
            --accent-hover: #3AA7FE;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --danger-color: #e74c3c;
            --btn-primary: linear-gradient(45deg, #50B7FE, #3AA7FE);
            --btn-success: linear-gradient(45deg, #28a745, #218838);
            --btn-purple: linear-gradient(45deg, #6f42c1, #5a32a3);
            --btn-orange: linear-gradient(45deg, #fd7e14, #e8590c);
            --stat-total: #50B7FE;
            --stat-today: #FFE92C;
            --stat-week: #FF9C00;
            --stat-month: #10FBDF;
            --time-color: #FFE92C;
            --development-color: #50B7FE;
            --version-gradient: linear-gradient(90deg, #50B7FE, #FFE92C);
        }
        
        body {
            font-family: 'JingNanYuanTi', 'Segoe UI', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            background-size: cover;
            min-height: 100vh;
            color: var(--text-primary);
            line-height: 1.6;
            position: relative;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-overlay);
            z-index: -1;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        /* 主题切换按钮 */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 50px;
            padding: 8px 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px var(--shadow-color);
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .theme-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px var(--shadow-color);
        }
        
        .theme-toggle span {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .theme-icon {
            font-size: 1.2rem;
            transition: transform 0.3s ease;
        }
        
        [data-theme="light"] .theme-icon.sun {
            display: none;
        }
        
        [data-theme="light"] .theme-icon.moon {
            display: inline;
        }
        
        [data-theme="dark"] .theme-icon.sun {
            display: inline;
        }
        
        [data-theme="dark"] .theme-icon.moon {
            display: none;
        }
        
        header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: var(--card-bg);
            border-radius: 20px;
            box-shadow: 0 10px 30px var(--shadow-color);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-color);
        }
        
        .logo {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            animation: float 3s ease-in-out infinite;
        }
        
        h1 {
            font-size: 2.5rem;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 10px var(--shadow-color);
        }
        
        .tagline {
            font-size: 1.2rem;
            color: var(--text-secondary);
            margin-bottom: 1rem;
            text-shadow: 0 1px 5px var(--shadow-color);
        }
        
        .version-badge {
            display: inline-block;
            background: var(--version-gradient);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-size: 0.9rem;
            font-weight: bold;
            margin-bottom: 1rem;
            box-shadow: 0 4px 15px var(--shadow-color);
            animation: versionPulse 3s infinite alternate;
        }
        
        @keyframes versionPulse {
            0% {
                background: linear-gradient(90deg, #50B7FE, #FFE92C);
                box-shadow: 0 4px 15px rgba(80, 183, 254, 0.5);
            }
            100% {
                background: linear-gradient(90deg, #3AA7FE, #FFD700);
                box-shadow: 0 6px 20px rgba(80, 183, 254, 0.7), 0 0 30px rgba(255, 233, 44, 0.3);
            }
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .info-card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 15px;
            box-shadow: 0 5px 15px var(--shadow-color);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px var(--shadow-color);
            background: var(--card-bg-hover);
        }
        
        .info-card h3 {
            color: var(--text-primary);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-shadow: 0 1px 5px var(--shadow-color);
        }
        
        .info-card h3::before {
            content: '📋';
            font-size: 1.2rem;
        }
        
        .info-item {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .info-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .label {
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
            text-shadow: 0 1px 3px var(--shadow-color);
        }
        
        .value {
            color: var(--text-primary);
            word-break: break-all;
            text-shadow: 0 1px 3px var(--shadow-color);
        }
        
        .value a {
            color: var(--accent-color);
            text-decoration: none;
        }
        
        .value a:hover {
            color: var(--accent-hover);
            text-decoration: underline;
        }
        
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-left: 0.5rem;
            box-shadow: 0 2px 8px var(--shadow-color);
        }
        
        .status-online {
            background: var(--btn-success);
            color: white;
        }
        
        .status-local {
            background: var(--development-color);
            color: white;
        }
        
        .status-warning {
            background: var(--warning-color);
            color: white;
        }
        
        .actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .action-card {
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 15px var(--shadow-color);
            transition: all 0.3s ease;
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
        }
        
        .action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px var(--shadow-color);
            background: var(--card-bg-hover);
        }
        
        .action-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            filter: drop-shadow(0 2px 5px var(--shadow-color));
        }
        
        .action-card h3 {
            color: var(--text-primary);
            margin-bottom: 1rem;
            text-shadow: 0 1px 5px var(--shadow-color);
        }
        
        .action-card p {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
            text-shadow: 0 1px 3px var(--shadow-color);
        }
        
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: var(--btn-primary);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            box-shadow: 0 4px 15px var(--shadow-color);
        }
        
        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(80, 183, 254, 0.4);
        }
        
        .btn-api {
            background: var(--btn-purple);
        }
        
        .btn-api:hover {
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
        }
        
        .btn-test {
            background: var(--btn-success);
        }
        
        .btn-test:hover {
            box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
        }
        
        footer {
            text-align: center;
            margin-top: 3rem;
            padding: 2rem;
            color: var(--text-muted);
            font-size: 0.9rem;
            background: var(--card-bg);
            border-radius: 15px;
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
        }
        
        .time-display {
            font-size: 1.1rem;
            color: var(--time-color);
            font-weight: 600;
            margin-top: 0.5rem;
            text-shadow: 0 1px 5px var(--shadow-color);
        }
        
        .stats-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 10px;
        }
        
        /* 横屏显示优化 - 将统计改为2行 */
        @media (min-width: 769px) and (orientation: landscape) {
            .stats-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        /* 一言样式 */
        .hitokoto-box {
            margin-top: 10px;
            padding: 15px;
            font-size: 0.9rem;
            line-height: 1.6;
            font-style: italic;
            text-align: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            border: 1px solid var(--border-color);
            backdrop-filter: blur(5px);
        }
        
        .hitokoto-text {
            color: var(--text-primary);
            margin-bottom: 5px;
        }
        
        .hitokoto-from {
            color: var(--text-muted);
            font-size: 0.8rem;
            text-align: right;
        }
        
        .stat-item {
            text-align: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border: 1px solid var(--border-color);
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 5px;
            text-shadow: 0 2px 8px var(--shadow-color);
        }
        
        .stat-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
            text-shadow: 0 1px 3px var(--shadow-color);
        }
        
        .stat-total {
            color: var(--stat-total);
        }
        
        .stat-today {
            color: var(--stat-today);
        }
        
        .stat-week {
            color: var(--stat-week);
        }
        
        .stat-month {
            color: var(--stat-month);
        }
        
        .vercel-notice {
            margin-top: 10px;
            padding: 10px;
            background: rgba(255, 193, 7, 0.1);
            border-radius: 8px;
            border-left: 3px solid var(--warning-color);
            font-size: 0.9rem;
        }
        
        .vercel-notice strong {
            color: var(--warning-color);
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .spinning {
            animation: spin 2s linear infinite;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .logo {
                font-size: 2.5rem;
            }
            
            .theme-toggle {
                top: 10px;
                right: 10px;
                padding: 6px 12px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .actions {
                grid-template-columns: 1fr;
            }
            
            .stats-container {
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
        }
        
        @media (max-width: 480px) {
            .stats-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- 主题切换按钮 -->
    <div class="theme-toggle" id="themeToggle" title="切换深色/浅色模式">
        <span class="theme-icon sun">🌞</span>
        <span class="theme-icon moon">🌙</span>
        <span id="themeText">深色模式</span>
    </div>
    
    <div class="container">
        <header>
            <div class="logo">
                <img src="https://cloud.chuyel.top/f/PkZsP/tu%E5%B7%B2%E5%8E%BB%E5%BA%95.png" 
                     alt="初叶" 
                     style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 4px solid var(--border-color); box-shadow: 0 8px 25px var(--shadow-color); background: var(--card-bg); padding: 3px; animation: float 3s ease-in-out infinite;">
            </div>
            <h1>初叶🍂竹叶 Furry Meting API 服务</h1>
            <p class="tagline">初叶🍂超不稳定的音乐API服务，欸嘿开玩笑的~，公益QQ/网易音乐API，可解析QQ的VIP音乐哦~~~（网易暂不支持：没钱~~~~）</p>
            <div class="version-badge">版本 v1.6.0</div>
            ${isVercel ? `
            <div class="vercel-notice">
                <strong>Vercel环境说明：</strong> 当前运行在Vercel环境中，未配置数据库统计数据无法保存。如需API调用统计，请配置环境变量或部署到本地或自有服务器。
            </div>` : ''}
        </header>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>系统信息</h3>
                <div class="info-item">
                    <div class="label">运行环境</div>
                    <div class="value">
                        ${runtime}
                        <span class="status-badge ${runtime.includes('Node') ? 'status-online' : 'status-local'}">
                            ${runtime.includes('Node') ? '生产环境' : '开发环境'}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="label">存储方式</div>
                    <div class="value">
                        ${storageIcon} ${storageType}
                        ${isVercel ? '<span style="color: var(--warning-color); margin-left: 10px;">(无法统计)</span>' : ''}
                    </div>
                </div>
                <div class="info-item">
                    <div class="label">服务端口</div>
                    <div class="value">${config.PORT}</div>
                </div>
                <div class="info-item">
                    <div class="label">部署地区</div>
                    <div class="value">
                        ${config.OVERSEAS ? '海外服务器' : '中国大陆服务器'}
                        <span class="status-badge ${config.OVERSEAS ? 'status-local' : 'status-online'}">
                            ${config.OVERSEAS ? '海外' : '大陆'}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="label">参数文档</div>
                    <div class="value">
                        <a href="${docsUrl}" style="color: var(--accent-color);">${docsUrl}</a>
                    </div>
                </div>
                ${!isVercel ? `
                <div class="info-item">
                    <div class="label">API 调用统计</div>
                    <div class="value">
                        <div class="stats-container">
                            <div class="stat-item">
                                <div class="stat-number stat-total">${totalCalls.toLocaleString()}</div>
                                <div class="stat-label">总调用次数</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number stat-today">${todayCalls.toLocaleString()}</div>
                                <div class="stat-label">今日调用</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number stat-week">${weekCalls.toLocaleString()}</div>
                                <div class="stat-label">本周调用</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number stat-month">${monthCalls.toLocaleString()}</div>
                                <div class="stat-label">本月调用</div>
                            </div>
                        </div>
                    </div>
                </div>` : ''}
            </div>
            
            <div class="info-card">
                <h3>服务状态</h3>
                <div class="info-item">
                    <div class="label">当前时间</div>
                    <div class="value time-display">${currentTime}</div>
                </div>
                <div class="info-item">
                    <div class="label">API 状态</div>
                    <div class="value">
                        <span class="status-badge status-online">运行正常</span>
                        ${isVercel ? '<span class="status-badge" style="background: linear-gradient(45deg, #000000, #484848); color: white; margin-left: 5px;">Vercel</span>' : ''}
                    </div>
                </div>
                ${!isVercel ? `
                <div class="info-item">
                    <div class="label">下次重置</div>
                    <div class="value">
                        今日：${nextReset.time}<br>
                        本周：${nextWeeklyReset.time}<br>
                        本月：${nextMonthlyReset.time}
                    </div>
                </div>` : ''}
                <div class="info-item">
                    <div class="label">访问地址</div>
                    <div class="value">
                        <a href="${requestUrl}" style="color: var(--accent-color);">${requestUrl}</a>
                    </div>
                </div>
                ${!isVercel ? `
                <div class="info-item">
                    <div class="label">实际地址</div>
                    <div class="value">
                        <a href="${correctBaseUrl}" style="color: var(--accent-color);">${correctBaseUrl}</a>
                    </div>
                    <div class="hitokoto-box" id="hitokoto">
                        <div class="hitokoto-text">加载中...</div>
                        <div class="hitokoto-from"></div>
                    </div>
                </div>` : ''}
            </div>
        </div>
        
        <div class="actions">
            <div class="action-card">
                <div class="action-icon">🔧</div>
                <h3>测试接口</h3>
                <p>验证服务是否正常运行，查看基本响应信息</p>
                <a href="${testUrl}" class="btn btn-test">前往测试</a>
            </div>
            
            <div class="action-card">
                <div class="action-icon">
                    <img src="https://cloud.chuyel.top/f/PkZsP/tu%E5%B7%B2%E5%8E%BB%E5%BA%95.png" 
                         alt="初叶图标"
                         style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color); box-shadow: 0 4px 15px var(--shadow-color);">
                </div>
                <h3>初叶🍂网站</h3>
                <p>该项目作者的官方网站</p>
                <a href="https://qiu.chuyel.top" class="btn btn-api" target="_blank">点击访问</a>
            </div>
            
            <div class="action-card">
                <div class="action-icon">📚</div>
                <h3>文档</h3>
                <p>查看 API 使用文档</p>
                <a href="https://www.chuyel.top/472" class="btn" target="_blank">查看文档</a>
            </div>
        </div>
        
        <footer>
            <p>© 2024-2025 初叶🍂Meting API 服务 | 提供稳定可靠的API支持</p>
            ${!isVercel ? `<p>API调用统计：总 <span style="color: var(--accent-color); font-weight: bold;">${totalCalls.toLocaleString()}</span> 次 | 今日 <span style="color: var(--stat-today); font-weight: bold;">${todayCalls.toLocaleString()}</span> 次 | 本周 <span style="color: var(--stat-week); font-weight: bold;">${weekCalls.toLocaleString()}</span> 次 | 本月 <span style="color: var(--stat-month); font-weight: bold;">${monthCalls.toLocaleString()}</span> 次</p>` : ''}
            <p>最后更新：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} | 如有问题，请查看文档或联系技术支持</p>
            <p style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
                <span>主题：<span id="currentTheme">深色模式</span> | </span>
                <span>背景图片：<a href="https://img.chuyel.top" target="_blank" style="color: var(--accent-color);">初叶🍂随机二次元壁纸API</a></span>
            </p>
        </footer>
    </div>
    
    <script>
        // 主题切换功能
        const themeToggle = document.getElementById('themeToggle');
        const themeText = document.getElementById('themeText');
        const currentThemeSpan = document.getElementById('currentTheme');
        const html = document.documentElement;
        
        // 从localStorage获取保存的主题，或者根据系统偏好设置
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 初始化主题
        function initTheme() {
            let theme = 'dark'; // 默认深色
            
            if (savedTheme) {
                theme = savedTheme;
            } else if (systemPrefersDark) {
                theme = 'dark';
            } else {
                theme = 'light';
            }
            
            applyTheme(theme);
        }
        
        // 应用主题
        function applyTheme(theme) {
            html.setAttribute('data-theme', theme);
            
            if (theme === 'light') {
                themeText.textContent = '浅色模式';
                currentThemeSpan.textContent = '浅色模式';
                themeToggle.querySelector('.theme-icon').classList.remove('spinning');
            } else {
                themeText.textContent = '深色模式';
                currentThemeSpan.textContent = '深色模式';
            }
            
            localStorage.setItem('theme', theme);
            
            const icon = themeToggle.querySelector('.theme-icon');
            icon.classList.add('spinning');
            setTimeout(() => {
                icon.classList.remove('spinning');
            }, 600);
        }
        
        // 切换主题
        function toggleTheme() {
            const currentTheme = html.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        }
        
        // 事件监听
        themeToggle.addEventListener('click', toggleTheme);
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!savedTheme) {
                const newTheme = e.matches ? 'dark' : 'light';
                applyTheme(newTheme);
            }
        });
        
        // 实时更新时间
        function updateTime() {
            const now = new Date();
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Shanghai'
            };
            const timeStr = now.toLocaleString('zh-CN', options);
            const timeElement = document.querySelector('.time-display');
            if (timeElement) {
                timeElement.textContent = timeStr;
            }
        }
        
        // 每秒更新一次时间
        setInterval(
updateTime, 1000);
        
        // 添加简单的页面加载动画
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化主题
            initTheme();
            
            const cards = document.querySelectorAll('.info-card, .action-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            // 初始化时间显示
            updateTime();
        });
        
        // 背景图片加载
        window.addEventListener('load', function() {
            const bgImage = new Image();
            bgImage.src = 'https://img.chuyel.top/api';
            bgImage.onload = function() {
                console.log('🎨 背景图片加载完成');
                const currentTheme = html.getAttribute('data-theme') || 'dark';
                const bgOverlay = currentTheme === 'dark' 
                    ? 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))' 
                    : 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))';
                
                document.body.style.background = bgOverlay + ', url("' + this.src + '") no-repeat center center fixed';
                document.body.style.backgroundSize = 'cover';
            };
            bgImage.onerror = function() {
                console.log('⚠️ 背景图片加载失败，使用备用背景');
                const currentTheme = html.getAttribute('data-theme') || 'dark';
                if (currentTheme === 'dark') {
                    document.body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                } else {
                    document.body.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                }
            };
        });
        
        // 添加键盘快捷键 (Ctrl+Shift+T 切换主题)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                toggleTheme();
            }
        });
        
        // 加载一言
        function loadHitokoto() {
            const hitokotoBox = document.getElementById('hitokoto');
            if (!hitokotoBox) return;
            
            fetch('https://v1.hitokoto.cn/?c=a&c=b&c=d&c=i&c=k')
                .then(response => response.json())
                .then(data => {
                    const textElement = hitokotoBox.querySelector('.hitokoto-text');
                    const fromElement = hitokotoBox.querySelector('.hitokoto-from');
                    
                    if (textElement && fromElement) {
                        textElement.textContent = data.hitokoto;
                        fromElement.textContent = data.from ? '—— ' + data.from : '';
                    }
                })
                .catch(error => {
                    console.log('一言加载失败，使用备用内容');
                    const textElement = hitokotoBox.querySelector('.hitokoto-text');
                    const fromElement = hitokotoBox.querySelector('.hitokoto-from');
                    
                    if (textElement && fromElement) {
                        const jokes = [
                            { text: '代码写得好，要饭要到老。', from: '程序员的自我修养' },
                            { text: '世界上最遥远的距离，是我在if里你在else里。', from: '程序员情话' },
                            { text: '人生苦短，我用Python。', from: 'Python之禅' },
                            { text: '从前有座山，山里有座庙，庙里有个老和尚在讲故事...', from: '递归的艺术' },
                            { text: '不要相信任何人，包括我。', from: '悖论' }
                        ];
                        const joke = jokes[Math.floor(Math.random() * jokes.length)];
                        textElement.textContent = joke.text;
                        fromElement.textContent = '—— ' + joke.from;
                    }
                });
        }
        
        // 页面加载完成后加载一言
        window.addEventListener('load', loadHitokoto);
        
        // 动态加载本地自定义字体
        function loadCustomFont() {
            const mainFonts = [
                '/set/ziti/moren.woff2',
                '/set/ziti/moren.ttf'
            ];
            
            const fallbackFonts = [
                '/set/ziti/backup.woff2',
                '/set/ziti/backup.ttf',
                '/set/ziti/fallback.woff2',
                '/set/ziti/fallback.ttf'
            ];
            
            let fontLoaded = false;
            let attemptedFonts = new Set();
            
            function tryLoadFont(fontUrl) {
                if (attemptedFonts.has(fontUrl)) {
                    return Promise.reject(new Error('已尝试过此字体'));
                }
                
                attemptedFonts.add(fontUrl);
                
                return fetch(fontUrl, { method: 'HEAD' })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('字体文件不存在');
                        }
                        return fetch(fontUrl);
                    })
                    .then(response => response.blob())
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        const font = new FontFace('JingNanYuanTi', 'url(' + blobUrl + ')', {
                            weight: 'normal',
                            style: 'normal',
                            display: 'swap'
                        });
                        return font.load();
                    })
                    .then(loadedFont => {
                        document.fonts.add(loadedFont);
                        document.body.style.fontFamily = "'JingNanYuanTi', 'Segoe UI', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif";
                        fontLoaded = true;
                        console.log('✅ 自定义字体加载成功: ' + fontUrl);
                        return true;
                    });
            }
            
            async function tryFontList(fontList) {
                for (const fontUrl of fontList) {
                    if (fontLoaded) break;
                    
                    try {
                        await tryLoadFont(fontUrl);
                        break;
                    } catch (error) {
                        console.log('⚠️ 字体加载失败: ' + fontUrl);
                    }
                }
            }
            
            async function tryRandomFallback() {
                const exts = ['.woff2', '.ttf'];
                const availableFonts = [];
                
                for (const ext of exts) {
                    for (let i = 1; i <= 10; i++) {
                        const fontUrl = '/set/ziti/fallback' + i + ext;
                        try {
                            const response = await fetch(fontUrl, { method: 'HEAD' });
                            if (response.ok) {
                                availableFonts.push(fontUrl);
                            }
                        } catch (e) {
                            break;
                        }
                    }
                }
                
                if (availableFonts.length > 0) {
                    const randomFont = availableFonts[Math.floor(Math.random() * availableFonts.length)];
                    console.log('ℹ️ 检测到 ' + availableFonts.length + ' 个备用字体，随机选择: ' + randomFont);
                    try {
                        await tryLoadFont(randomFont);
                    } catch (error) {
                        console.log('⚠️ 备用字体加载失败: ' + randomFont);
                    }
                }
            }
            
            async function startLoading() {
                await tryFontList(mainFonts);
                
                if (!fontLoaded) {
                    await tryFontList(fallbackFonts);
                }
                
                if (!fontLoaded) {
                    console.log('ℹ️ 备用字体加载失败，尝试随机备用字体...');
                    await tryRandomFallback();
                }
                
                if (!fontLoaded) {
                    console.log('ℹ️ 所有自定义字体加载失败，使用系统默认字体');
                    document.body.style.fontFamily = "'Segoe UI', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif";
                }
            }
            
            startLoading();
        }
        
        if (window.FontFace && document.fonts) {
            loadCustomFont();
        } else {
            document.body.style.fontFamily = "'Segoe UI', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif";
        }
    </script>
</body>
</html>`;
};

export default generateHomePage;
