# 技术栈规范文档

## ⚠️ 重要提示（Always 规则）

### 开发前必读
- ✅ **写任何代码前必须完整阅读** `memory-bank/design-document.md`（包含完整数据库结构和业务逻辑）
- ✅ **每完成一个重大功能或里程碑后，必须更新** `memory-bank/design-document.md` 和本文档
- ✅ **禁止自主更新进度文档**：除非得到明确授权，严禁擅自修改 `memory-bank/progress.md`
- ✅ **禁止编写测试用例**：项目目前不需要编写自动化测试代码（如 Jest 等）
- ✅ **严格遵守模块化原则**：禁止单体巨文件（monolith），每个文件不超过 300 行
- ✅ **代码审查**：每个模块完成后必须自我审查，确保符合本文档规范

---

## 1. 项目技术栈

### 1.1 后端技术栈
- **运行环境**：Node.js 18+
- **Web 框架**：Express 4.x
- **ORM**：Sequelize 6.x
- **数据库**：SQLite（单文件部署）
- **进程管理**：PM2
- **反向代理**：Nginx
- **环境变量管理**：dotenv
- **日志**：winston
- **API 文档**：Swagger（可选）

### 1.2 小程序技术栈
- **框架**：微信原生小程序
- **UI 组件库**：Vant Weapp
- **HTTP 请求**：wx.request 封装
- **状态管理**：全局 app.globalData + 页面 data
- **图形渲染**：Canvas 2D API
- **存储**：wx.setStorage / wx.getStorage

### 1.3 PC 管理端技术栈（第二期）
- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **图可视化**：AntV G6
- **HTTP 客户端**：Axios
- **路由**：Vue Router 4
- **状态管理**：Pinia

---

## 2. 代码规范

### 2.1 通用规范

#### 命名规范
- **文件名**：kebab-case（小写短横线）
  - ✅ `customer-controller.js`
  - ❌ `CustomerController.js`
  - ❌ `customer_controller.js`

- **变量/函数名**：camelCase（小驼峰）
  - ✅ `getUserInfo`, `circuitList`
  - ❌ `get_user_info`, `CircuitList`

- **类名**：PascalCase（大驼峰）
  - ✅ `CustomerModel`, `TopologyService`
  - ❌ `customerModel`, `topology_service`

- **常量**：UPPER_SNAKE_CASE（大写下划线）
  - ✅ `API_BASE_URL`, `MAX_DEVICES`
  - ❌ `apiBaseUrl`, `maxDevices`

#### 注释规范
```javascript
/**
 * 获取客户详情
 * @param {number} customerId - 客户ID
 * @returns {Promise<Object>} 客户信息对象
 */
async function getCustomerDetail(customerId) {
  // 实现代码
}
```

### 2.2 后端代码规范

#### 目录结构（强制模块化）
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # 数据库配置（< 50 行）
│   │   └── app-config.js        # 应用配置（< 50 行）
│   ├── models/
│   │   ├── customer.js          # 客户模型（< 100 行）
│   │   ├── topology.js          # 拓扑模型（< 100 行）
│   │   ├── device.js            # 设备模型（< 100 行）
│   │   ├── port.js              # 端口模型（< 100 行）
│   │   ├── connection.js        # 连接模型（< 100 行）
│   │   ├── circuit.js           # 电路模型（< 100 行）
│   │   └── index.js             # 模型关联（< 100 行）
│   ├── controllers/
│   │   ├── customer-controller.js    # 客户控制器（< 200 行）
│   │   ├── topology-controller.js    # 拓扑控制器（< 200 行）
│   │   ├── device-controller.js      # 设备控制器（< 200 行）
│   │   ├── port-controller.js        # 端口控制器（< 150 行）
│   │   ├── connection-controller.js  # 连接控制器（< 150 行）
│   │   └── circuit-controller.js     # 电路控制器（< 200 行）
│   ├── services/
│   │   ├── customer-service.js       # 客户业务逻辑（< 200 行）
│   │   ├── topology-service.js       # 拓扑业务逻辑（< 250 行）
│   │   ├── circuit-service.js        # 电路业务逻辑（< 200 行）
│   │   └── layout-service.js         # 布局算法（< 150 行）
│   ├── routes/
│   │   ├── customer-routes.js        # 客户路由（< 50 行）
│   │   ├── topology-routes.js        # 拓扑路由（< 80 行）
│   │   ├── device-routes.js          # 设备路由（< 50 行）
│   │   ├── circuit-routes.js         # 电路路由（< 60 行）
│   │   └── index.js                  # 路由汇总（< 50 行）
│   ├── middlewares/
│   │   ├── error-handler.js          # 错误处理（< 100 行）
│   │   ├── validator.js              # 参数验证（< 150 行）
│   │   └── logger.js                 # 日志中间件（< 80 行）
│   ├── utils/
│   │   ├── response.js               # 响应格式化（< 50 行）
│   │   └── helpers.js                # 工具函数（< 100 行）
│   └── app.js                        # 应用入口（< 100 行）
├── scripts/
│   ├── init-db.js                    # SQLite 初始化脚本
│   ├── migrate-mysql-to-sqlite.js    # MySQL 到 SQLite 一次性迁移脚本
│   └── init-db.sql                   # MySQL 初始化脚本（历史参考）
├── package.json
├── .env.example
└── README.md
```

#### 文件大小限制（强制）
- ❌ **禁止单文件超过 300 行**
- ✅ 如果超过，必须拆分为多个模块
- ✅ Controller 最多 200 行
- ✅ Service 最多 250 行
- ✅ Model 最多 100 行
- ✅ Route 最多 80 行

#### API 响应格式（统一）
```javascript
// 成功响应
{
  "success": true,
  "data": { /* 数据 */ },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  }
}
```

#### 错误处理（统一）
```javascript
// 使用自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// 在 controller 中使用
if (!customer) {
  throw new AppError('客户不存在', 404);
}
```

#### 数据库查询规范
```javascript
// ✅ 使用 Sequelize 查询
const customer = await Customer.findByPk(id, {
  include: [
    {
      model: Topology,
      include: [Device, Connection]
    }
  ]
});

// ❌ 避免 N+1 查询
// 错误示例：
const customers = await Customer.findAll();
for (let customer of customers) {
  customer.topologies = await Topology.findAll({ where: { customer_id: customer.id } });
}
```

### 2.3 小程序代码规范

#### 目录结构（强制模块化）
```
miniprogram/
├── pages/
│   ├── index/
│   │   ├── index.js             # 首页逻辑（< 200 行）
│   │   ├── index.wxml           # 首页模板（< 150 行）
│   │   ├── index.wxss           # 首页样式（< 100 行）
│   │   └── index.json
│   ├── customer/
│   │   ├── list/                # 客户列表（< 200 行）
│   │   ├── detail/              # 客户详情（< 250 行）
│   │   └── form/                # 客户表单（< 200 行）
│   ├── topology/
│   │   ├── list/                # 拓扑列表（< 150 行）
│   │   ├── editor/              # 拓扑编辑器（< 300 行，可拆分）
│   │   └── viewer/              # 拓扑查看器（< 250 行）
│   ├── device/
│   │   ├── list/                # 设备列表（< 200 行）
│   │   ├── form/                # 设备表单（< 150 行）
│   │   └── port-manager/        # 端口管理（< 200 行）
│   ├── connection/
│   │   ├── list/                # 连接列表（< 200 行）
│   │   └── form/                # 连接表单（< 200 行）
│   └── circuit/
│       ├── list/                # 电路列表（< 200 行）
│       ├── detail/              # 电路详情（< 250 行）
│       └── form/                # 电路表单（< 200 行）
├── components/
│   ├── topology-canvas/
│   │   ├── index.js             # Canvas 组件（< 300 行，核心组件可适当放宽）
│   │   ├── index.wxml           # 模板（< 100 行）
│   │   ├── index.wxss           # 样式（< 80 行）
│   │   └── index.json
│   ├── device-card/             # 设备卡片（< 150 行）
│   ├── connection-item/         # 连接项（< 100 行）
│   └── search-bar/              # 搜索栏（< 100 行）
├── utils/
│   ├── request.js               # HTTP 请求封装（< 150 行）
│   ├── storage.js               # 存储封装（< 100 行）
│   ├── validator.js             # 表单验证（< 150 行）
│   └── layout-algorithm.js      # 布局算法（< 200 行）
├── api/
│   ├── customer-api.js          # 客户 API（< 100 行）
│   ├── topology-api.js          # 拓扑 API（< 150 行）
│   ├── device-api.js            # 设备 API（< 100 行）
│   └── circuit-api.js           # 电路 API（< 100 行）
├── config/
│   └── config.js                # 配置文件（< 50 行）
├── app.js                       # 应用入口（< 100 行）
├── app.json
└── app.wxss
```

#### 文件大小限制（强制）
- ❌ **禁止单文件超过 300 行**（Canvas 组件除外，但也不超过 400 行）
- ✅ 页面 JS 最多 250 行
- ✅ 组件 JS 最多 200 行
- ✅ WXML 最多 150 行
- ✅ API 文件最多 150 行

#### 页面生命周期规范
```javascript
Page({
  data: {
    // 页面数据
  },

  // 生命周期函数
  onLoad(options) {},
  onShow() {},
  onReady() {},
  onHide() {},
  onUnload() {},

  // 事件处理函数（按功能分组）
  // --- 数据加载 ---
  loadData() {},
  refreshData() {},

  // --- 用户交互 ---
  handleTap() {},
  handleInput() {},

  // --- 业务逻辑 ---
  saveData() {},
  deleteData() {}
});
```

#### API 调用规范
```javascript
// ✅ 使用封装的 API 模块
import { getCustomerList, getCustomerDetail } from '../../api/customer-api';

// 在页面中调用
async loadCustomers() {
  try {
    const res = await getCustomerList();
    this.setData({ customers: res.data });
  } catch (error) {
    wx.showToast({ title: '加载失败', icon: 'none' });
  }
}

// ❌ 避免直接使用 wx.request
```

#### Canvas 组件规范
```javascript
Component({
  properties: {
    topologyId: Number,
    highlightConnectionId: Number,
    editable: Boolean
  },

  data: {
    devices: [],
    connections: [],
    canvasWidth: 0,
    canvasHeight: 0
  },

  lifetimes: {
    attached() {
      this.initCanvas();
    }
  },

  methods: {
    // --- 初始化 ---
    initCanvas() {},

    // --- 数据加载 ---
    loadTopology() {},

    // --- 布局计算 ---
    autoLayout() {},

    // --- 绘制 ---
    draw() {},
    drawDevice() {},
    drawConnection() {},

    // --- 交互 ---
    handleTap() {},
    handleTouchMove() {},

    // --- 工具函数 ---
    getDeviceAtPoint() {},
    getConnectionAtPoint() {}
  }
});
```

---

## 3. 模块化原则（Always 规则）

### 3.1 单一职责原则
- ✅ 每个文件只负责一个功能模块
- ✅ Controller 只处理请求和响应
- ✅ Service 只处理业务逻辑
- ✅ Model 只定义数据结构和关联
- ❌ 禁止在 Controller 中写复杂业务逻辑
- ❌ 禁止在 Model 中写业务逻辑

### 3.2 文件拆分规则
当文件超过以下行数时，必须拆分：
- Controller > 200 行 → 拆分为多个 Controller 或提取 Service
- Service > 250 行 → 拆分为多个 Service
- 页面 JS > 250 行 → 提取组件或工具函数
- 组件 JS > 200 行 → 拆分为多个子组件

### 3.3 代码复用
- ✅ 相同逻辑提取为工具函数（utils）
- ✅ 相同 UI 提取为组件（components）
- ✅ 相同业务逻辑提取为 Service
- ❌ 禁止复制粘贴代码

### 3.4 依赖管理
- ✅ 使用相对路径导入本地模块
- ✅ 使用 npm 包管理第三方依赖
- ❌ 禁止循环依赖

---

## 4. Git 提交规范

### 4.1 分支管理
- `main` - 生产环境分支
- `develop` - 开发分支
- `feature/xxx` - 功能分支
- `bugfix/xxx` - 修复分支

### 4.2 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：
- `feat` - 新功能
- `fix` - 修复 bug
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 重构
- `test` - 测试
- `chore` - 构建/工具变动

**示例**：
```
feat(customer): 添加客户管理功能

- 实现客户列表查询
- 实现客户详情查询
- 实现客户新增和编辑

Closes #123
```

---

## 5. 测试规范（已简化）

### 5.1 手动验证
- 每个功能点完成后，通过 API 工具（如 Postman）或小程序开发者工具进行手动冒烟测试。
- **严禁编写任何形式的自动化测试脚本或测试代码文件。**

---

## 6. 性能优化规范

### 6.1 后端性能
- ✅ 使用数据库索引（电路编号、客户 ID 等）
- ✅ 避免 N+1 查询，使用 include 预加载
- ✅ 大数据量使用分页
- ✅ 使用 Redis 缓存热点数据（第二期）

### 6.2 小程序性能
- ✅ 列表使用虚拟滚动（数据量大时）
- ✅ 图片使用懒加载
- ✅ Canvas 绘制使用防抖
- ✅ 避免频繁 setData，批量更新

---

## 7. 安全规范

### 7.1 后端安全
- ✅ 使用参数验证（express-validator）
- ✅ SQL 注入防护（使用 ORM）
- ✅ XSS 防护（输入过滤）
- ✅ 敏感信息加密存储
- ✅ 使用 HTTPS

### 7.2 小程序安全
- ✅ 不在代码中硬编码敏感信息
- ✅ 使用 HTTPS 请求
- ✅ 验证服务器返回数据

---

## 8. 文档规范

### 8.1 代码注释
- ✅ 复杂逻辑必须注释
- ✅ 函数必须有 JSDoc 注释
- ✅ 关键算法必须注释

### 8.2 项目文档
- ✅ README.md - 项目说明和快速开始
- ✅ API.md - API 接口文档
- ✅ CHANGELOG.md - 版本更新日志

### 8.3 开发文档（memory-bank）
- ✅ design-document.md - 设计文档
- ✅ tech-stack.md - 技术栈规范（本文档）
- ✅ architecture.md - 架构文档（待创建）
- ✅ 每完成重大功能必须更新文档

---

## 9. 开发工具推荐

### 9.1 IDE
- **后端**：VS Code + ESLint + Prettier
- **小程序**：微信开发者工具

### 9.2 VS Code 插件
- ESLint - 代码检查
- Prettier - 代码格式化
- GitLens - Git 增强
- REST Client - API 测试
- SQLite Viewer - 数据库查看

### 9.3 Chrome 插件
- Vue DevTools（PC 端开发）
- JSON Viewer

---

## 10. 环境配置

### 10.1 开发环境
```env
NODE_ENV=development
PORT=6100
DB_DIALECT=sqlite
DB_STORAGE=./data/circuit_management.sqlite
```

### 10.2 生产环境
```env
NODE_ENV=production
PORT=6100
DB_DIALECT=sqlite
DB_STORAGE=./data/circuit_management.sqlite
```

---

## 11. 部署检查清单

### 11.1 后端部署
- [ ] 环境变量配置正确
- [ ] SQLite 数据库已初始化
- [ ] SQLite 数据库文件已纳入备份
- [ ] PM2 进程正常运行
- [ ] Nginx 配置正确
- [ ] 日志正常输出
- [ ] API 接口测试通过

### 11.2 小程序部署
- [ ] API 地址配置为生产环境
- [ ] 代码审查通过
- [ ] 真机测试通过
- [ ] 提交微信审核
- [ ] 发布成功

---

## 12. 代码审查清单

### 12.1 通用检查
- [ ] 代码符合命名规范
- [ ] 没有单文件超过限制行数
- [ ] 没有重复代码
- [ ] 注释清晰完整
- [ ] 没有 console.log 调试代码
- [ ] 错误处理完善

### 12.2 后端检查
- [ ] API 响应格式统一
- [ ] 数据库查询优化
- [ ] 参数验证完整
- [ ] 错误处理统一
- [ ] 日志记录完整

### 12.3 小程序检查
- [ ] 页面加载性能良好
- [ ] 用户交互流畅
- [ ] 错误提示友好
- [ ] 数据缓存合理
- [ ] 兼容性测试通过

---

## 13. 常见问题和解决方案

### 13.1 后端常见问题
**问题**：数据库连接失败
**解决**：检查 .env 中的 `DB_STORAGE` 路径，确认后端进程有目录读写权限

**问题**：API 响应慢
**解决**：检查是否有 N+1 查询，使用 include 预加载

### 13.2 小程序常见问题
**问题**：Canvas 绘制卡顿
**解决**：使用防抖，减少绘制频率

**问题**：数据加载慢
**解决**：使用缓存，减少不必要的请求

---

## 14. 版本更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-03-08 | 初始版本，定义技术栈和代码规范 |

---

**文档维护者**：开发团队
**最后更新**：2026-03-08
**下次审查**：每个开发阶段结束后
