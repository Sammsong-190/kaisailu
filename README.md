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

## 使用 Vercel 部署前端

仓库根目录已有 `vercel.json`：只在 **`client/`** 里执行 `npm ci` 与 `npm run build`，输出 **`client/dist`**。

在 **Vercel → Project → Settings → Environment Variables**（Production / Preview 按需）中添加：

| 变量名 | 说明 |
|--------|------|
| `VITE_API_BASE_URL` | 你已部署好的 **Express 根地址**，**不要**尾斜杠。例：`https://scwis-api.onrender.com` |

保存后重新 **Deploy**（该变量会在 `vite build` 时写入前端）。

若不留此变量，浏览器仍会请求本站 `/api`，在纯静态托管上会得到 HTML，`Unexpected token '<'` 即为该现象。

参考 `client/.env.example`。本地开发不要设置（或删掉），继续用根目录 **`npm run dev`** 自带的 `/api` 代理。

**注意**：仓库里的 **Express + Prisma 需单独托管**（如 [Render](https://render.com/)、Railway）；服务端已启用 `cors({ origin: true })`，允许跨域前端调用。

### 报错：Backend returned HTML, not JSON…

含义：前端把 **API** 的请求当成了静态页，或对端根本没有跑 Express。

| 场景 | 处理 |
|------|------|
| 本地只在 **`client/`** 里执行了 **`npm run dev`** | 在**仓库根目录**执行 **`npm run dev`**，让 Vite（5173）和 Express（8788）一起启动。 |
| `npm run preview` / 访问 **4173** 查看构建结果 | **另开终端**先运行 **`npm run dev --prefix server`**（API 先有），再预览。 |
| 部署在 **Vercel / 纯静态托管** | 必须部署可用的 **HTTPS Express**；在项目环境变量里设 **`VITE_API_BASE_URL`**（无尾斜杠），保存后 **重新 Deploy**。 |

自检：后端正常时，`GET /api/health` 应返回 JSON，例如：`{"ok":true}`。（本地常为 `http://127.0.0.1:8788/api/health`。）

## 生产部署注意

1. 将 `JWT_SECRET` 设为足够长的随机字符串，不要使用仓库示例值。  
2. `DATABASE_URL` 指向你有权访问的数据库文件或连接串；部署前执行 `prisma db push` 或迁移策略你自行选择。  
3. 前端构建后，需将静态资源置于 CDN / 静态托管，或让同一 Node 进程提供静态文件（当前仓库以开发代理为主，生产组合请按你的基础设施调整）。  
4. 若 Docker / 部分 CI 在 **`NODE_ENV=production`** 下执行 `npm ci` 且不安装 devDependencies，`vite` 会被跳过并报 **`vite: not found`**；本仓库已将 **Vite 与 `@vitejs/plugin-react` 放在 `client` 的 `dependencies`**，避免该问题。

## 许可

若未在仓库中另行声明，以项目作者约定为准。
