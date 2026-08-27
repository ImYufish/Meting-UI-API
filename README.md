# 初叶🍂Meting API
使用教程：https://www.chuyel.top/472

此教程Cookie填写仅适合<=1.5.8版本，>=1.6.0版本音乐Cookie需填入/setting文件夹下的各个相符的音源即可

更新日志：https://www.chuyel.cn/%E4%BA%8C%E6%94%B9%E7%A8%8B%E5%BA%8F/%E5%88%9D%E5%8F%B6%F0%9F%8D%82Meting%20API/

运行之前先修改 `setting/` 文件夹下对应的音源 Cookie 文件（`netease.cookie` / `tencent.cookie` / `kugou.cookie`），分别对应网易云、QQ音乐、酷狗音乐，请看上面的使用教程填写

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.6.2-orange.svg)](package.json)

一个强大的音乐 API 服务，支持多个音乐平台的数据获取，包括网易云音乐、QQ音乐和酷狗音乐。

## ✨ 特性

- 🎵 **多平台支持**：网易云音乐、QQ音乐、酷狗音乐
- 🚀 **多种部署方式**：支持 Node.js、Deno 和 Vercel 部署
- 📊 **API 统计**：内置请求统计和监控功能
- 🔄 **自动重置**：支持每日/每周/每月自动重置统计数据
- 💾 **数据持久化**：支持文件存储和 MySQL 数据库
- 🌐 **CORS 支持**：跨域请求友好
- 📝 **完整文档**：提供详细的 API 文档和使用示例

## 📋 支持的功能

### 网易云音乐 (netease)
- ✅ 歌曲信息 (`song`)
- ✅ 歌曲 URL (`url`)
- ✅ 歌词 (`lrc`)
- ✅ 歌曲封面 (`pic`)
- ✅ 歌单 (`playlist`)
- ✅ 歌手歌曲 (`artist`)
- ✅ 搜索 (`search`)

### QQ音乐 (tencent)
- ✅ 歌曲信息 (`song`)
- ✅ 歌曲 URL (`url`)
- ✅ 歌词 (`lrc`)
- ✅ 歌单 (`playlist`)
- ✅ 搜索 (`search`)

### 酷狗音乐 (kugou)
- ✅ 歌曲信息 (`song`)
- ✅ 歌曲 URL (`url`)
- ✅ 歌词 (`lrc`)
- ✅ 歌曲封面 (`pic`)
- ✅ 搜索 (`search`)

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm 或 pnpm

### 安装

```bash
# 克隆项目
git clone https://github.com/chuyegzs/Meting-UI-API.git
cd Meting-UI-API

# 安装依赖
npm install
# 或使用 pnpm
pnpm install
```

### 运行

#### Node.js 部署

```bash
# 启动服务
node node.js
```

服务将在 `http://localhost:2500` 启动

#### Deno 部署

```bash
# 构建项目
npm run build:all

# 使用 Deno 运行
npm run start:deno
```

#### Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. Vercel 会自动检测配置并部署

## 📖 API 使用

### 基础请求格式

```
GET /api?server={平台}&type={类型}&id={ID}
```

### 参数说明

| 参数 | 说明 | 必填 | 可选值 |
|------|------|------|--------|
| server | 音乐平台 | 是 | `netease`, `tencent`, `kugou` |
| type | 请求类型 | 是 | `song`, `url`, `lrc`, `pic`, `playlist`, `artist`, `search` |
| id | 资源ID | 是 | 歌曲ID、歌单ID、歌手ID或搜索关键词 |

### 使用示例

#### 获取歌曲信息

```bash
# 网易云音乐
curl "http://localhost:2500/api?server=netease&type=song&id=1901371647"

# QQ音乐
curl "http://localhost:2500/api?server=tencent&type=song&id=001OyHbk2MSIi4"

# 酷狗音乐
curl "http://localhost:2500/api?server=kugou&type=song&id=b3a52a7a958bf0aed0ebfba2e9a818b7"
```

#### 获取歌曲播放地址

```bash
curl "http://localhost:2500/api?server=netease&type=url&id=1901371647"
```

#### 获取歌词

```bash
curl "http://localhost:2500/api?server=netease&type=lrc&id=1901371647"
```

#### 获取歌单

```bash
curl "http://localhost:2500/api?server=netease&type=playlist&id=7512726744"
```

#### 搜索歌曲

```bash
# 网易云音乐
curl "http://localhost:2500/api?server=netease&type=search&id=起风了"

# 酷狗音乐
curl "http://localhost:2500/api?server=kugou&type=search&id=周杰伦"
```

### 响应格式

成功响应：
```json
{
  "error": false,
  "data": [
    {
      "id": "1901371647",
      "name": "歌曲名称",
      "artist": ["歌手名"],
      "album": "专辑名",
      "pic": "封面URL",
      "url": "播放URL",
      "lrc": "歌词内容"
    }
  ]
}
```

错误响应：
```json
{
  "error": true,
  "message": "错误信息"
}
```

# 🔧 配置

## HMAC 鉴权配置（可选）

项目支持 HMAC 签名鉴权，用于保护 `/api` 接口中的 `url`、`pic`、`lrc` 类型请求。

### 配置文件

在 `setting/hmac.js` 中配置：

```javascript
export const HMAC_SECRET = 'meting';  // 签名密钥
export const ENABLE_AUTH = false;     // 是否启用鉴权（true=启用，false=禁用）
```

### 使用方式

当 `ENABLE_AUTH` 设置为 `true` 时，请求需要携带签名参数 `token`。

签名计算方式：
```javascript
import crypto from 'crypto';

function generateToken(server, type, id, secret) {
    const str = `${server}${type}${id}`;
    return crypto.createHmac('sha256', secret).update(str).digest('hex');
}

const token = generateToken('netease', 'url', '1901371647', 'meting');
```

请求示例：
```bash
curl "http://localhost:2500/api?server=netease&type=url&id=1901371647&token=${token}"
```

## 数据库配置（可选）

### Node.js 环境

如果需要使用 MySQL 存储统计数据，请编辑项目根目录`/setting/mysql.js` 文件：

```javascript
export default {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',
    database: 'meting_api'
};
```

**注意**：Node.js 环境不支持 `.env` 文件配置数据库，必须使用 `mysql.js` 文件。

### Vercel 环境

在 Vercel 环境中，可以通过环境变量配置 MySQL 数据库：

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `CHUYE_MYSQL_HOST` | 数据库主机 | - |
| `CHUYE_MYSQL_PORT` | 数据库端口 | 3306 |
| `CHUYE_MYSQL_USER` | 数据库用户 | meting |
| `CHUYE_MYSQL_PASSWD` | 数据库密码 | - |
| `CHUYE_MYSQL_DB` | 数据库名称 | meting |

**重要**：
- 只有同时配置了 `CHUYE_MYSQL_HOST` 和 `CHUYE_MYSQL_PASSWD` 时，才会启用 MySQL 统计功能
- 未配置这两个环境变量时，将不使用统计功能
- Vercel 环境不支持 `mysql.js` 文件配置

### 文件存储（默认）

如果不配置数据库，系统将使用文件存储统计数据（`data/api_stats.json`）。

## 📊 统计功能

### 查看统计

访问 `/stats` 查看可视化统计页面，或访问 `/stats/json` 获取 JSON 格式数据。

统计信息包括：
- 总请求数
- 成功/失败次数
- 各平台请求分布
- 各类型请求分布
- 最后更新时间

### 自动重置

支持配置自动重置统计数据：
- 每日重置
- 每周重置
- 每月重置

## 🛠️ 开发

### 项目结构

```
Meting-UI-API/
├── api/                    # Vercel API 入口
│   └── index.js
├── data/                   # 数据存储目录
│   └── api_stats.json
├── set/                    # 核心代码
│   ├── config/            # 配置文件
│   │   └── database.js
│   ├── routes/            # 路由处理
│   │   ├── api.js
│   │   ├── docs.js
│   │   ├── home.js
│   │   └── stats.js
│   ├── services/          # 服务层
│   │   ├── database.js
│   │   ├── file.js
│   │   └── stats.js
│   ├── templates/         # 模板
│   │   └── home.js
│   ├── utils/             # 工具函数
│   │   ├── cleanup.js
│   │   ├── cookie.js
│   │   └── time.js
│   └── ziti/             # 字体文件
│       └── moren.woff2
├── setting/                # 配置文件
│   ├── hmac.js            # HMAC鉴权配置
│   ├── mysql.js           # MySQL配置
│   ├── netease.cookie     # 网易云Cookie
│   ├── tencent.cookie     # QQ音乐Cookie
│   └── kugou.cookie      # 酷狗Cookie
├── src/                    # 公共工具与模板
│   ├── config.js
│   ├── example.js
│   ├── template.js
│   └── util.js
├── test/                   # 测试文件
│   └── providers.test.js
├── app.js                  # 主应用
├── node.js                 # Node.js 入口
├── deno.js                 # Deno 入口
├── esbuild.config.js       # 构建配置
├── vercel.json             # Vercel 配置
└── package.json           # 项目配置
```

### 构建

无需构建，安装好依赖启动即可

## 📝 可用端点

| 端点 | 说明 |
|------|------|
| `/` | 首页 |
| `/api` | 核心 API 端点 |
| `/stats` | 统计页面 |
| `/stats/json` | 统计数据 |
| `/health` | 健康检查 |
| `/docs` | API 文档 |
| `/test` | 测试端点 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

本项目基于 [xizeyoupan/Meting](https://github.com/xizeyoupan/Meting-API)与[@meting/core](https://www.npmjs.com/package/@meting/core) 项目，使用 JavaScript 重写并增强。

## ⚠️ 免责声明

本项目仅供学习交流使用，请勿用于商业用途。

## 📮 联系方式

如有问题或建议，请通过 Issue/Q群 联系。

<img width="1672" height="1002" alt="9ab2d69381576467e8f6348eed8870c3" src="https://cloud.chuyel.top/f/qx9kFl/05f5930cd2175434f52a66354d494c5c.png" />
交流群：1048889481（记得点Star）