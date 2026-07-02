# 电路台账管理平台

这是一个自用的局域网电路信息管理系统，用于维护客户资料、电路台账、组网拓扑、设备端口、连接关系和本地数据备份。系统面向小规模单机部署，默认使用 SQLite 单文件数据库，适合在内网服务器或办公电脑上长期运行。

## 系统结构

- `backend/`：Express + Sequelize 后端服务，默认端口 `6100`。
- `pc-web/`：PC 管理端，Vue + Element Plus，默认端口 `6102`。
- `mobile-uni/`：移动端 H5/uni-app 工程，默认端口规划为 `6101`。
- `miniprogram/`：小程序端工程。
- `backend/data/`：运行时数据目录，不提交到 Git。内部按 `database/` 和 `backups/` 分开保存。
- `version.json`：版本号和更新说明，关于页面和检查更新功能会读取这里的版本信息。

## 本地运行

后端：

```bash
cd backend
npm install
npm run init-db
HOST=0.0.0.0 PORT=6100 npm start
```

PC 端：

```bash
cd pc-web
npm install
npm run dev -- --host 0.0.0.0 --port 6102
```

访问：

```text
http://127.0.0.1:6102
```

## Docker 部署

项目根目录执行：

```bash
docker compose up -d --build
```

默认端口：

- 后端 API：`6100`
- PC 页面：`6102`

数据持久化：

```text
./backend/data:/app/data
```

SQLite 数据库和备份文件会保存在宿主机 `backend/data/` 下。该目录已加入 `.gitignore`，避免真实业务数据上传到代码仓库。
重建 Docker 镜像或重建容器不会删除该宿主机目录里的数据。

## 数据与备份

- 默认数据库文件：`backend/data/database/circuit_management.sqlite`
- 默认备份目录：`backend/data/backups/`
- 数据目录为空时，后端启动会自动创建 SQLite 文件和业务表。
- 备份文件只保存在服务器目录中，不会进入 Git。

## 上传前注意

已默认排除以下内容：

- `.env`
- `node_modules`
- `dist`
- `backend/data`
- SQLite 数据库文件
- 数据备份文件
- 临时安装残留文件
