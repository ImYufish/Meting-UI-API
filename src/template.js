import example from "./example.js";

let html = `
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>初叶🍂Meting 测试页面</title>
    <link rel="stylesheet" href="https://unpkg.com/aplayer/dist/APlayer.min.css">
    <style>
        @font-face {
            font-family: 'JingNanYuanTi';
            src: url('/set/ziti/moren.woff2') format('woff2'),
                 url('/set/ziti/moren.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }

        :root {
            --bg-1: #f5f1ea;
            --bg-2: #fef7e7;
            --ink: #1b1b1f;
            --ink-soft: rgba(27, 27, 31, 0.7);
            --card: rgba(255, 255, 255, 0.72);
            --card-border: rgba(27, 27, 31, 0.08);
            --accent: #ff7a59;
            --accent-2: #00a7a7;
            --accent-3: #ffb703;
            --shadow: rgba(8, 8, 16, 0.15);
            --glow: rgba(255, 122, 89, 0.18);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            color: var(--ink);
            font-family: "JingNanYuanTi", "Rubik", "ZCOOL XiaoWei", "PingFang SC", "Microsoft YaHei", sans-serif;
            background:
                radial-gradient(520px 320px at 10% 10%, rgba(255, 122, 89, 0.25), transparent 60%),
                radial-gradient(520px 320px at 90% 15%, rgba(0, 167, 167, 0.22), transparent 55%),
                radial-gradient(520px 320px at 50% 100%, rgba(255, 183, 3, 0.22), transparent 60%),
                linear-gradient(180deg, var(--bg-1), var(--bg-2));
            min-height: 100vh;
        }

        .page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px 20px 56px;
        }

        .hero {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 20px;
            padding: 24px;
            border-radius: 20px;
            background: var(--card);
            border: 1px solid var(--card-border);
            box-shadow: 0 10px 30px var(--shadow);
            position: relative;
            overflow: hidden;
        }

        .hero::after {
            content: "";
            position: absolute;
            inset: -50% auto auto -30%;
            width: 420px;
            height: 420px;
            background: radial-gradient(circle, var(--glow), transparent 60%);
            filter: blur(6px);
            z-index: 0;
        }

        .hero-left, .hero-right {
            position: relative;
            z-index: 1;
        }

        .hero-title {
            margin: 0 0 8px 0;
            font-size: 34px;
            letter-spacing: 0.5px;
        }

        .hero-sub {
            margin: 0;
            color: var(--ink-soft);
            font-size: 15px;
        }

        .tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 999px;
            background: rgba(255, 122, 89, 0.12);
            border: 1px solid rgba(255, 122, 89, 0.3);
            font-size: 12px;
            margin-bottom: 12px;
        }

        .tag img {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            object-fit: cover;
        }

        .hero-right {
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
            justify-content: center;
        }

        .hero-pill {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border-radius: 12px;
            background: rgba(0, 167, 167, 0.12);
            border: 1px solid rgba(0, 167, 167, 0.3);
            font-size: 13px;
        }

        .grid {
            margin-top: 22px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
        }

        .col {
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .card {
            background: var(--card);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 8px 22px var(--shadow);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 14px 28px var(--shadow);
        }

        .card-head {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }

        .chip {
            display: inline-flex;
            align-items: center;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(0, 167, 167, 0.14);
            border: 1px solid rgba(0, 167, 167, 0.3);
        }

        .chip-alt {
            background: rgba(255, 183, 3, 0.15);
            border-color: rgba(255, 183, 3, 0.35);
        }

        .meta {
            font-size: 12px;
            color: var(--ink-soft);
        }

        .player {
            background: rgba(0, 0, 0, 0.03);
            border-radius: 12px;
            padding: 10px;
            border: 1px dashed rgba(0, 0, 0, 0.08);
        }

        .footer {
            margin-top: 28px;
            color: var(--ink-soft);
            font-size: 12px;
            text-align: center;
        }

        @media (max-width: 900px) {
            .hero {
                grid-template-columns: 1fr;
            }
            .grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 640px) {
            .hero-title {
                font-size: 26px;
            }
        }
    </style>
</head>

<body>
    <script src="https://unpkg.com/aplayer/dist/APlayer.min.js"></script>
    <script>
        var meting_api = 'api?server=:server&type=:type&id=:id&auth=:auth&r=:r';
    </script>
    <script src="https://unpkg.com/@xizeyoupan/meting@latest/dist/Meting.min.js"></script>

    <div class="page">
        <header class="hero">
            <div class="hero-left">
                <div class="tag">
                    <img src="https://cloud.chuyel.top/f/PkZsP/tu%E5%B7%B2%E5%8E%BB%E5%BA%95.png" alt="初叶">
                    初叶🍂Meting API测试页面
                </div>
                <h1 class="hero-title">初叶🍂Meting 测试页面</h1>
                <p class="hero-sub">快速检验各平台与类型的接口可用性</p>
            </div>
            <div class="hero-right">
                <div class="hero-pill">✅ 支持QQ音乐/网易云音乐/酷狗音乐</div>
                <div class="hero-pill">⚡ 直接调用当前 API 地址</div>
            </div>
        </header>
`;

const providerLabel = {
    tencent: "QQ音乐",
    netease: "网易云",
    kugou: "酷狗音乐",
    migu: "咪咕音乐",
    xiami: "虾米音乐"
};

const typeLabel = {
    playlist: "歌单",
    song: "单曲",
    artist: "艺术家",
    search: "搜索"
};

let left = "";
let right = "";
let index = 0;

Object.keys(example).map(provider => {
    Object.keys(example[provider]).map(type => {
        if (!example[provider][type].show) return;

        const card = `
            <section class="card">
                <div class="card-head">
                    <span class="chip">${providerLabel[provider] || provider}</span>
                    <span class="chip chip-alt">${typeLabel[type] || type}</span>
                    <span class="meta">ID: ${example[provider][type].value}</span>
                </div>
                <div class="player">
                    <meting-js server="${provider}" type="${type}" id="${example[provider][type].value}" list-folded=true />
                </div>
            </section>
`;

        if (index % 2 === 0) {
            left += card;
        } else {
            right += card;
        }
        index += 1;
    });
});

html += `
        <main class="grid">
            <div class="col">
${left}            </div>
            <div class="col">
${right}            </div>
        </main>

        <div class="footer">© 初叶🍂Meting API | 测试页仅供接口验证使用</div>
    </div>
</body>

</html>
`;

export const handler = (c) => {
    return c.html(html);
};
