# SCWIS Fullstack

校园心理与个案相关场景的全栈演示应用：**SCWIS**（Student / Campus Wellness Information System 风格）。前端为 React + Vite，后端为 Express + Prisma（SQLite），支持学生、咨询师、管理员三种角色与 JWT 登录。

## 技术栈

| 部分 | 技术 |
|------|------|
| 前端 | React 18、React Router、Vite 5、Recharts |
| 后端 | Node.js 18+、Express、Prisma、SQLite |
| 认证 | JWT、bcrypt |

## 环境要求

- [Node.js](https://nodejs.org/) **≥ 18**

## 快速开始

在仓库内的 `scwis-fullstack` 目录下执行：

```bash
# 1. 安装根目录依赖（concurrently）以及 client / server
npm install
npm run install:all

# 2. 服务端环境变量（若尚无 .env）
cp server/.env.example server/.env
# 按需编辑 server/.env 中的 DATABASE_URL、JWT_SECRET

# 3. 初始化数据库并写入演示管理员账号
npm run db:push --prefix server
npm run db:seed --prefix server

# 4. 同时启动 API（默认 8788）与前端开发服务器（默认 5173）
npm run dev
```

浏览器访问：<http://localhost:5173>。开发模式下 Vite 会把 `/api` 代理到 `http://127.0.0.1:8788`。

### 演示管理员（Seed）

种子脚本会在不存在时创建一个管理员：

- 邮箱：`admin@demo.edu`
- 密码：`Admin123!`

生产环境请务必修改密码并轮换 `JWT_SECRET`。

## 常用脚本（根目录 `package.json`）

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 分别安装 `server` 与 `client` 依赖 |
| `npm run dev` | 并行启动服务端 `dev`（`node --watch`）与前端 `vite` |
| `npm run build` | 构建前端静态资源到 `client/dist` |
| `npm run start` | 仅启动生产模式的 API（需已构建前端则由你自行托管或通过其它方式访问） |

### 服务端（`server/`）

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发：监听源码变更重启 |
| `npm start` | 生产：直接运行入口 |
| `npm run db:push` | 根据 `schema.prisma` 同步 SQLite 结构 |
| `npm run db:seed` | 运行 `prisma/seed.js`（演示管理员） |

### 前端（`client/`）

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite 开发服务器，端口 **5173** |
| `npm run build` | `vite build` |
| `npm run preview` | 预览构建结果，端口 **4173**（已配置 `/api` 代理） |

## 目录结构（简要）

```
scwis-fullstack/
├── client/          # React 应用（入口见 src/main.jsx、路由见 src/App.jsx）
├── server/          # Express API（入口 src/index.js）
│   ├── prisma/      # schema、seed
│   └── .env.example # 环境变量模板
└── package.json     # 根脚本与 concurrently
```

## API 与健康检查

- 健康检查：`GET /api/health` → `{ "ok": true }`
- 默认 API 端口：**8788**（可通过环境变量 `PORT` 覆盖）

## 生产部署注意

1. 将 `JWT_SECRET` 设为足够长的随机字符串，不要使用仓库示例值。  
2. `DATABASE_URL` 指向你有权访问的数据库文件或连接串；部署前执行 `prisma db push` 或迁移策略你自行选择。  
3. 前端构建后，需将静态资源置于 CDN / 静态托管，或让同一 Node 进程提供静态文件（当前仓库以开发代理为主，生产组合请按你的基础设施调整）。

## 许可

若未在仓库中另行声明，以项目作者约定为准。
