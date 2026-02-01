export const createDocsHandler = (buildUrl) => {
    return (c) => {
        const baseUrl = buildUrl(c, '/api');
        const displayUrl = baseUrl.replace(/^https?:\/\//, '');

        const platforms = [
            { name: 'tencent', displayName: 'QQ音乐', types: 'song, playlist, artist, album, lrc, url, pic, search' },
            { name: 'netease', displayName: '网易云', types: 'song, playlist, artist, album, lrc, url, pic, search' },
            { name: 'kugou', displayName: '酷狗音乐', types: 'song, playlist, artist, album, lrc, url, pic, search' },
            { name: 'spotify', displayName: 'Spotify', types: 'song, url' },
            { name: 'ytmusic', displayName: 'YouTube Music', types: 'song, url' }
        ];

        const serverRows = platforms.map(platform => {
            return `<tr><td>${platform.displayName}</td><td>${platform.types}</td></tr>`;
        }).join('');

        const exampleList = [
            { label: '获取歌曲', url: `${baseUrl}?server=tencent&type=song&id=001s7VHs4KJR5f` },
            { label: '获取歌单', url: `${baseUrl}?server=tencent&type=playlist&id=8664505249` },
            { label: '搜索歌曲', url: `${baseUrl}?server=netease&type=search&id=周杰伦` },
            { label: '获取歌词', url: `${baseUrl}?server=netease&type=lrc&id=1901371647` },
            { label: '获取歌手', url: `${baseUrl}?server=netease&type=artist&id=6452` }
        ];

        const examplesHtml = exampleList.map(item => {
            return `<li><span class="tag">${item.label}</span><a href="${item.url}" target="_blank" rel="noreferrer">${item.url}</a></li>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>初叶🍂 Meting API 文档</title>
    <style>
        :root {
            --bg: #f6f3ef;
            --ink: #1f1f24;
            --muted: #5d5d6a;
            --accent: #ff6b3d;
            --accent-2: #1f7a8c;
            --card: #ffffff;
            --line: #e4ded7;
            --shadow: 0 18px 40px rgba(20, 20, 30, 0.08);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            color: var(--ink);
            background:
                radial-gradient(1200px 500px at 10% -10%, #ffe7d6 0%, transparent 60%),
                radial-gradient(1200px 500px at 90% -10%, #e0f0f2 0%, transparent 60%),
                var(--bg);
            font-family: "CustomFont", "Segoe UI", "Microsoft YaHei", sans-serif;
        }

        .wrap {
            max-width: 980px;
            margin: 0 auto;
            padding: 40px 20px 80px;
            animation: rise 0.6s ease both;
        }

        header {
            display: grid;
            gap: 10px;
            margin-bottom: 24px;
        }

        h1 {
            font-size: 32px;
            margin: 0;
            letter-spacing: 0.4px;
        }

        .subtitle {
            color: var(--muted);
            font-size: 16px;
            margin: 0;
        }

        .hero {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 22px 24px;
            box-shadow: var(--shadow);
            display: grid;
            gap: 12px;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 999px;
            background: #fff1ea;
            color: var(--accent);
            font-weight: 600;
            font-size: 12px;
        }

        .url {
            font-family: "CustomFont", "Segoe UI", "Microsoft YaHei", serif;
            font-size: 18px;
            word-break: break-all;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 20px;
        }

        .card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 18px;
            box-shadow: var(--shadow);
        }

        .card h2 {
            margin: 0 0 10px;
            font-size: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid var(--line);
        }

        th {
            color: var(--muted);
            font-weight: 600;
        }

        .tag {
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 999px;
            background: #f1f1f1;
            color: #4a4a55;
            margin-right: 8px;
        }

        ul {
            margin: 0;
            padding-left: 18px;
            display: grid;
            gap: 10px;
        }

        a {
            color: var(--accent-2);
            text-decoration: none;
            word-break: break-all;
        }

        a:hover { text-decoration: underline; }

        .note {
            color: var(--muted);
            font-size: 13px;
        }

        @keyframes rise {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 860px) {
            .grid { grid-template-columns: 1fr 1fr; }
        }
    </style>
</head>
<body>
    <div class="wrap">
        <header>
            <span class="badge">初叶🍂 Meting API 文档</span>
            <h1>音乐元数据服务</h1>
            <p class="subtitle">用于获取歌曲/歌单/歌词/图片等信息的统一接口</p>
        </header>

        <section class="hero">
            <div class="note">Base URL</div>
            <div class="url">${displayUrl}</div>
        </section>

        <section class="grid">
            <div class="card">
                <h2>参数说明</h2>
                <table>
                    <thead>
                        <tr><th>参数</th><th>说明</th><th>默认值</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>server</td><td>音乐平台</td><td>tencent</td></tr>
                        <tr><td>type</td><td>请求类型</td><td>playlist</td></tr>
                        <tr><td>id</td><td>音乐ID/搜索关键词</td><td>8664505249</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2>示例</h2>
                <ul>${examplesHtml}</ul>
            </div>

            <div class="card">
                <h2>支持平台与类型</h2>
                <table>
                    <thead>
                        <tr><th>平台</th><th>支持类型</th></tr>
                    </thead>
                    <tbody>
                        ${serverRows}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2>快速提示</h2>
                <p class="note">当 type 为 url / pic / lrc 时，接口会返回重定向或文本内容。</p>
                <p class="note">你可以用 /test 页面快速验证播放器效果。</p>
            </div>
        </section>
    </div>
    
    <script>
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
                        const font = new FontFace('CustomFont', \`url(\${blobUrl})\`, {
                            weight: 'normal',
                            style: 'normal',
                            display: 'swap'
                        });
                        return font.load();
                    })
                    .then(loadedFont => {
                        document.fonts.add(loadedFont);
                        document.body.style.fontFamily = "'CustomFont', 'Segoe UI', 'Microsoft YaHei', sans-serif";
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
            
            async function startLoading() {
                await tryFontList(mainFonts);
                
                if (!fontLoaded) {
                    console.log('ℹ️ 主字体加载失败，尝试备用字体...');
                    await tryFontList(fallbackFonts);
                }
                
                if (!fontLoaded) {
                    console.log('ℹ️ 所有自定义字体加载失败，使用系统默认字体');
                    document.body.style.fontFamily = "'Segoe UI', 'Microsoft YaHei', sans-serif";
                }
            }
            
            startLoading();
        }
        
        if (window.FontFace && document.fonts) {
            loadCustomFont();
        } else {
            document.body.style.fontFamily = "'Segoe UI', 'Microsoft YaHei', sans-serif";
        }
    </script>
</body>
</html>`;

        return c.html(html);
    };
};
