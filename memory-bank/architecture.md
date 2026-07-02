# 项目架构说明

用于记录系统中每个关键文件和模块的作用及关系。

## 后端架构 (backend/)

### 核心目录
- **src/models/**: 数据库实体定义及多表关联关系。
  - `customer.js`: 客户信息模型，存储单位名称、联系人及客户经理信息。
  - `topology.js`: 组网拓扑模型，关联客户并存储拓扑的基础信息及布局 JSON。
  - `device.js`: 网络设备模型，存储设备类型（Router/Switch等）、型号、位置及 Canvas 坐标。
  - `port.js`: 设备端口模型，定义端口类型（光/电）及速率。
  - `connection.js`: 设备间物理连接模型，记录源/目标端口及光纤详细信息。
  - `circuit.js`: 电路业务模型，记录电路编号、类型、带宽及 IP 地址，并绑定到具体的物理连接。
  - `index.js`: 模型关联汇总文件，定义了 Customer -> Topology -> Device -> Port -> Connection <- Circuit 的完整关联链路。
- **src/services/**: 业务逻辑层，处理复杂的计算和业务规则。
  - `customer-service.js`: 处理客户数据的增删改查逻辑。
  - `topology-service.js`: 处理组网拓扑数据的增删改查及设备布局坐标的更新。
  - `device-service.js`: 处理网络设备及其关联端口的查询。
  - `connection-service.js`: 处理端口和物理连接的新增与维护。
  - `circuit-service.js`: 处理电路业务逻辑，包括按代码搜索和初步的路径追踪架构。
  - `layout-service.js`: 拓扑图自动布局算法，使用 BFS 层次布局计算设备坐标。
- **src/controllers/**: 控制器层，解析请求并调用 Service，返回格式化响应。
  - `customer-controller.js`: 解析客户相关的 HTTP 请求。
  - `topology-controller.js`: 处理拓扑相关操作，包括详情获取、布局更新及自动布局计算（新增 `/api/topologies/:id/auto-layout` 端点）。
  - `device-controller.js`: 处理设备的增删改查。
  - `port-controller.js` & `connection-controller.js`: 处理端口及物理链路的 API 请求。
  - `circuit-controller.js`: 提供电路搜索、详情查询及路径追踪接口。
- **src/routes/**: 路由定义，将 HTTP 端点映射到控制器。
  - `index.js`: 汇总所有业务路由，挂载到 `/api`。
  - 各模块路由文件 (`customer-routes.js`, `topology-routes.js` 等) 分别定义其路径规则。
- **src/middlewares/**: 中间件，包含错误处理、日志记录和参数验证。
- **src/utils/**: 通用工具函数和响应格式封装。

## 小程序架构 (miniprogram/)

### 核心目录
- **pages/**: 各功能模块的页面文件（.js, .wxml, .wxss, .json）。
  - `index/`: 首页，提供快捷入口和搜索功能。
  - `customer/`: 客户管理模块。
    - `list/`: 客户列表页，展示所有客户并支持搜索。
      - 使用本地缓存优化加载性能（5分钟有效期）
      - 本地过滤实现实时搜索
    - `detail/`: 客户详情页，展示客户信息、关联拓扑和电路。
    - `form/`: 客户表单页，用于新增和编辑客户信息。
      - 新增成功后自动清除客户列表缓存
  - `circuit/`: 电路管理模块。
    - `list/`: 电路列表页，支持按编号/IP/名称搜索电路。
      - 使用防抖优化搜索性能（500ms）
      - 调用后端接口实现模糊搜索
    - `form/`: 电路表单页，用于录入和编辑电路信息。
    - `detail/`: 电路详情页，展示电路信息、IP 地址、拓扑图及绑定的物理链路（高亮显示）。
  - `topology/`: 拓扑管理模块（待实现）。
- **components/**: 高复用的 UI 组件及核心的拓扑图 Canvas 组件。
  - `topology-canvas/`: 拓扑图可视化组件，使用 Canvas 2D API 绘制设备和连接线。
    - `index.js`: 组件逻辑，包含 Canvas 初始化、绘制、拖动、点击检测等核心功能。
      - 使用防抖优化拖动保存性能（500ms）
      - 支持高亮显示指定连接（用于电路详情页）
      - 实现点到线段距离计算的几何算法
    - `index.wxml`: 组件模板，包含 Canvas 元素及设备/连接详情弹窗。
    - `index.wxss`: 组件样式。
    - `index.json`: 组件配置。
  - **核心功能**：
    - 设备绘制：根据设备类型显示不同颜色（路由器蓝色、交换机绿色、ODF 橙色等）。
    - 连接线绘制：光纤显示蓝色，网线显示绿色，支持高亮显示指定连接（用于电路详情页）。
    - 拖动功能：可编辑模式下支持拖动设备，实时更新坐标并使用防抖保存到后端。
    - 点击交互：点击设备显示详情弹窗，点击连接线显示光纤信息，使用几何算法计算点到线段距离。
- **api/**: 后端接口的封装调用模块。
  - `customer-api.js`: 客户管理相关接口，包括增删改查及列表获取。
  - `topology-api.js`: 拓扑管理相关接口，包括拓扑详情获取、设备布局更新及自动布局计算（新增 `getAutoLayout` 方法）。
  - `circuit-api.js`: 电路管理相关接口，包括基于编号/IP的搜索及初步的路径追踪。
  - `device-api.js`: 设备及端口管理相关接口，支持设备CRUD及获取特定设备的端口列表。
- **utils/**: 网络请求封装、表单验证及布局算法。
  - `request.js`: HTTP 请求封装工具，基于 wx.request 实现 Promise 风格的网络请求。
    - 统一处理请求/响应格式
    - 自动显示/隐藏 loading 提示
    - 统一错误处理和友好提示（支持 hideToast 选项）
    - 支持自定义 header 和请求参数
  - `storage.js`: 本地存储工具，封装 wx.setStorage/getStorage。
    - 支持设置缓存有效期（默认 5 分钟）
    - 自动管理缓存时间戳
    - 提供清除单个/全部缓存的方法
    - 用于客户列表等不常变动数据的缓存
  - `debounce.js`: 防抖和节流工具函数。
    - `debounce`: 防抖函数，用于延迟执行（默认 300ms）
    - `throttle`: 节流函数，用于限制执行频率
    - 应用场景：Canvas 拖动保存、搜索输入等
- **config/**: 全局配置（如 BaseURL）。
  - `config.js`: 全局配置文件，定义 API 基础地址等常量。

## 拓扑可视化技术细节

### Canvas 组件属性
- `topologyId`: 拓扑 ID，用于加载拓扑数据。
- `highlightConnectionId`: 高亮的连接 ID，用于电路详情页高亮显示绑定的链路。
- `editable`: 是否可编辑（拖动设备），默认 false。

### 自动布局算法（BFS 层次布局）
1. **构建邻接表**：根据设备和连接关系构建图的邻接表。
2. **BFS 分层**：从第一个设备开始，使用广度优先搜索计算每个设备的层级。
3. **坐标分配**：
   - 垂直方向：根据层级数量均匀分布。
   - 水平方向：同层设备水平均匀分布。
4. **孤立节点处理**：未连接的设备放在最后一层。

### 点击检测算法
- **设备检测**：判断点击坐标是否在设备的矩形边界内。
- **连接线检测**：计算点到线段的最短距离，距离小于阈值（10px）则认为点击了连接线。
- **点到线段距离公式**：使用向量投影计算点到线段的垂直距离。

### 数据流
1. 小程序调用 `getTopologyDetail(id)` 获取拓扑数据（包含设备、端口、连接）。
2. Canvas 组件根据设备坐标（position_x, position_y）绘制设备和连接线。
3. 用户拖动设备时，实时更新坐标并调用 `updateLayout` 保存到数据库。
4. 新建拓扑时，可调用 `getAutoLayout(id)` 获取自动计算的坐标，然后批量更新。

## 电路链路绑定与高亮功能

### 功能概述
电路详情页通过 topology-canvas 组件展示组网拓扑图，并高亮显示该电路绑定的物理链路，实现电路业务与物理连接的可视化关联。

### 实现细节

#### 1. 电路详情页 (pages/circuit/detail/)
- **index.js**:
  - 通过 `getCircuitDetail(id)` 获取电路完整信息（包含关联的 Connection、Topology 等）。
  - 解析 Connection 数据，提取源/目标设备、端口、光纤信息。
  - 将 `topology_id` 和 `connection_id` 传递给 topology-canvas 组件。
- **index.wxml**:
  - 展示电路基本信息（名称、编号、类型、带宽、开通日期）。
  - 展示 IP 地址信息（互联网 IP、本端 IP、对端 IP）。
  - 嵌入 topology-canvas 组件，传入 `topologyId` 和 `highlightConnectionId` 属性。
  - 展示绑定链路的详细信息（源/目标设备、端口、连接类型、光纤信息）。

#### 2. 链路高亮逻辑 (components/topology-canvas/)
- **属性传递**:
  - `highlightConnectionId`: 需要高亮的连接 ID（从电路详情页传入）。
- **绘制逻辑** (index.js:169-205):
  - `drawConnection` 方法接收 `isHighlight` 参数。
  - 在 `draw` 方法中，遍历所有连接时判断 `conn.id === highlightConnectionId`。
  - 高亮连接使用红色（#ff4d4f）和 4px 线宽，普通连接使用蓝色/绿色和 2px 线宽。
- **视觉效果**:
  - 高亮链路在拓扑图中以红色加粗线条显示，与其他连接形成明显对比。

#### 3. 数据关联链路
```
Circuit (电路)
  ↓ connection_id
Connection (物理连接)
  ↓ source_port_id / target_port_id
Port (端口)
  ↓ device_id
Device (设备)
  ↓ position_x, position_y
Canvas 绘制
```

### 用户交互流程
1. 用户在电路列表页点击某条电路。
2. 跳转到电路详情页，展示电路基本信息。
3. 页面加载该电路关联的拓扑图。
4. Canvas 组件自动高亮显示该电路绑定的物理链路（红色加粗）。
5. 用户可点击设备或连接线查看详细信息。
6. 页面底部展示绑定链路的完整信息（设备、端口、光纤）。

## 性能优化策略 (2026-03-09)

### 1. 数据缓存优化
- **客户列表缓存**：使用 `wx.setStorage` 缓存客户列表数据，有效期 5 分钟。
  - 首次加载从服务器获取，后续访问直接从缓存读取。
  - 新增/编辑客户后自动清除缓存，保证数据一致性。
  - 实现文件：[storage.js](miniprogram/utils/storage.js:1-80)

### 2. 防抖优化
- **Canvas 拖动保存**：设备拖动结束后使用 500ms 防抖保存坐标。
  - 避免拖动过程中频繁调用后端接口。
  - 实现文件：[topology-canvas/index.js](miniprogram/components/topology-canvas/index.js:46-272)
- **电路搜索**：搜索输入使用 500ms 防抖触发接口请求。
  - 减少用户输入过程中的无效请求。
  - 实现文件：[circuit/list/index.js](miniprogram/pages/circuit/list/index.js:15-48)

### 3. 错误处理优化
- **统一错误提示**：request.js 统一处理错误信息。
  - 网络错误提示更友好（"网络请求失败，请检查网络连接"）。
  - 错误提示显示时长统一为 2 秒。
  - 支持 `hideToast` 选项控制是否显示错误提示。
  - 实现文件：[request.js](miniprogram/utils/request.js:31-60)

### 4. 本地过滤 vs 接口搜索
- **客户列表**：使用本地过滤，数据量小，实时响应。
- **电路列表**：使用接口搜索，数据量大，支持模糊匹配。


