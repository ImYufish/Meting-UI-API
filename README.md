# 初叶🍂Meting API
使用教程：https://www.chuyel.top/472

运行之前先修改/src/providers/你的所属账号（网易云，QQ......）（netease为网易云，tencent为QQ音乐，请看上面的使用教程修改）

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.5.0-orange.svg)](package.json)

一个强大的音乐 API 服务，支持多个音乐平台的数据获取，包括网易云音乐、QQ音乐、Spotify 和 YouTube Music。

## ✨ 特性

- 🎵 **多平台支持**：网易云音乐、QQ音乐、Spotify、YouTube Music
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

### Spotify
- ✅ 歌曲信息 (`song`)
- ✅ 歌曲 URL (`url`)

### YouTube Music (ytmusic)
- ✅ 歌曲信息 (`song`)
- ✅ 歌曲 URL (`url`)

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
# 构建项目
npm run build:all

# 启动服务
npm run start:node
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
| server | 音乐平台 | 是 | `netease`, `tencent`, `spotify`, `ytmusic` |
| type | 请求类型 | 是 | `song`, `url`, `lrc`, `pic`, `playlist`, `artist`, `search` |
| id | 资源ID | 是 | 歌曲ID、歌单ID、歌手ID或搜索关键词 |

### 使用示例

#### 获取歌曲信息

```bash
# 网易云音乐
curl "http://localhost:2500/api?server=netease&type=song&id=1901371647"

# QQ音乐
curl "http://localhost:2500/api?server=tencent&type=song&id=001OyHbk2MSIi4"
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
curl "http://localhost:2500/api?server=netease&type=search&id=起风了"
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

## 🔧 配置

### 环境变量

创建 `.env` 文件（可选）：

```env
# 服务端口
PORT=2500

# 数据库配置（可选，不配置则使用文件存储）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=meting_api

# 运行环境
RUNTIME=node  # node, deno, vercel
```

### 数据库配置

如果需要使用 MySQL 存储统计数据，请配置数据库连接信息。不配置则默认使用文件存储（`data/api_stats.json`）。

数据库表会自动创建，包含以下字段：
- 总请求数
- 成功/失败次数
- 各平台请求统计
- 最后更新时间

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
meting-backend-js/
├── api/                    # Vercel API 入口
├── data/                   # 数据存储目录
├── set/                    # 核心代码
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── routes/            # 路由处理
│   ├── services/          # 服务层
│   ├── templates/         # 模板
│   └── utils/             # 工具函数
├── src/                    # 音乐平台适配器
│   └── providers/         # 各平台实现
│       ├── netease/       # 网易云音乐
│       ├── tencent/       # QQ音乐
│       ├── spotify/       # Spotify
│       └── ytmusic/       # YouTube Music
├── test/                   # 测试文件
├── app.js                  # 主应用
├── node.js                 # Node.js 入口
├── deno.js                 # Deno 入口
└── package.json           # 项目配置
```

### 运行测试

```bash
npm test
```

### 构建

```bash
npm run build:all
```

## 📝 可用端点

| 端点 | 说明 |
|------|------|
| `/` | 首页，显示 API 文档 |
| `/api` | 核心 API 端点 |
| `/stats` | 统计页面（HTML） |
| `/stats/json` | 统计数据（JSON） |
| `/health` | 健康检查 |
| `/docs` | API 文档 |
| `/test` | 测试端点 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

本项目基于 [Meting](https://github.com/xizeyoupan/Meting-API) 项目，使用 JavaScript 重写并增强。

## ⚠️ 免责声明

本项目仅供学习交流使用，请勿用于商业用途。使用本项目获取的音乐资源版权归音乐平台所有，请支持正版音乐。

## 📮 联系方式

如有问题或建议，请通过 Issue/Q群 联系。

有时间我再写完，我是懒人，不知道啥时候会更新，目前还在更新中
<img width="1672" height="1002" alt="9ab2d69381576467e8f6348eed8870c3" src="https://cloud.chuyel.top/f/qx9kFl/05f5930cd2175434f52a66354d494c5c.png" />
交流群：1048889481（记得点Star）
