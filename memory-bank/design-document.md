# 电路信息管理系统 - 设计文档

## 1. 项目概述

### 1.1 项目背景
电信维护人员日常需要管理大量电路信息，包括 IPRAN、互联网专线、MSTP、OTN 等类型。传统的记录方式效率低下，查询不便。本系统旨在提供便捷的电路管理和组网拓扑可视化功能。

### 1.2 核心功能
- 客户信息管理
- 组网拓扑管理（设备、端口、连接）
- 电路信息管理
- 拓扑图可视化展示
- 电路链路绑定和高亮显示
- 快速搜索和查询

### 1.3 使用场景
- **主要使用端**：微信小程序（现场查询、录入）
- **辅助管理端**：PC Web 管理后台（第二期）
- **用户规模**：2-3 人使用，管理数百条电路

---

## 2. 技术架构

### 2.1 技术栈
- **小程序端**：微信原生小程序 + Canvas
- **PC 管理端**：Vue 3 + Element Plus + AntV G6（第二期）
- **后端**：Node.js + Express + Sequelize
- **数据库**：SQLite（单文件部署）
- **部署**：云服务器 + Nginx + PM2

### 2.2 系统架构图
```
┌─────────────┐         ┌─────────────┐
│  微信小程序  │ ◄─────► │   后端 API   │
└─────────────┘         └─────────────┘
                              │
┌─────────────┐               │
│  PC 管理端   │ ◄─────────────┤
└─────────────┘               │
                              ▼
                        ┌─────────────┐
                        │  SQLite DB   │
                        └─────────────┘
```

---

## 3. 数据库设计

### 3.1 核心表结构

#### customers (客户信息表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(200) | 单位名称 |
| contact_person | VARCHAR(50) | 联系人 |
| contact_phone | VARCHAR(20) | 联系电话 |
| account_manager | VARCHAR(50) | 客户经理 |
| manager_phone | VARCHAR(20) | 客户经理电话 |

#### network_topologies (组网拓扑表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| customer_id | INT | 客户 ID |
| topology_name | VARCHAR(100) | 拓扑名称 |
| description | TEXT | 描述 |
| layout_data | JSON | 设备位置信息 |

#### network_devices (网络设备表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| topology_id | INT | 拓扑 ID |
| device_name | VARCHAR(100) | 设备名称 |
| device_type | ENUM | 设备类型（router/switch/odf/optical_device/| device_model | VARCHAR(100) | 设备型号 |
| location | VARCHAR(200) | 位置 |
| position_x | FLOAT | X 坐标 |
| position_y | FLOAT | Y 坐标 |

#### device_ports (设备端口表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| device_id | INT | 设备 ID |
| port_name | VARCHAR(50) | 端口名称 |
| port_type | ENUM | 端口类型（optical/electrical/other） |
| port_speed | VARCHAR(20) | 端口速率 |

#### device_connections (设备连接表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| topology_id | INT | 拓扑 ID |
| source_port_id | INT | 源端口 ID |
| target_port_id | INT | 目标端口 ID |
| connection_type | ENU连接类型（fiber/cable） |
| fiber_info | TEXT | 光纤信息 |

#### circuits (电路信息表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| customer_id | INT | 客户 ID |
| topology_id | INT | 拓扑 ID |
| connection_id | INT | 绑定的连接 ID |
| circuit_name | VARCHAR(100) | 电路名称 |
| circuit_number | VARCHAR(100) | 电路编号（唯一） |
| circuit_type | ENUM | 电路类型（IPRAN/Internet/MSTP/OTN/Other） |
| bandwidth | VARCHAR(20) | 带宽 |
| open_date | DATE | 开通日期 |
| internet_ip | VARCHAR(50) | 互联网 IP |
| local_ip | VARCHAR(50) | 本端 IP |
| remote_ip | VARCHAR(50) | 对端 IP |

### 3.2 数据关系
```
customers (1) ──< (N) network_topologies
network_topologies (1) ──< (N) network_devices
network_devices (1) ──< (N) device_ports
device_ports (2) ──< (1) device_connections
network_topologies (1) ──< (N) circuits
device_connections (1) ──< (N) circuits
```

---

## 4. 核心业务流程

### 4.1 创建组网拓扑流程
```
1. 选择客户 → 创建拓扑（输入名称）
2. 添加设备（名称、类型、型号、位置）
3. 为设备添加端口（端口名、类型、速率）
4. 连接端口（选择源/目标端口、连接类型、光纤信息）
5. 系统自动布局 → 用户可拖动调整设备位置
6. 保存拓扑
```

### 4.2 创建电路并绑定链路流程
```
1. 录入电路基本信息（名称、编号、类型、带宽、IP 等）
2. 选择客户的组网拓扑
3. 在拓扑图上点击一条连接线（两设备间的链路）
4. 绑定该链路到电路
5. 保存电路
```

### 4.3 查看电路流程
```
1. 搜索或选择电路
2. 显示电路基本信息
3. 加载关联的组网拓扑图
4. 高亮显示该电路绑定的链路（加粗、变色）
5. 显示链路详细信息（设备、端口、光纤）
```

---

## 5. 小程序页面设计

### 5.1 页面结构
```
首页（搜索 + 快捷入口）
├── 客户列表
│   └── 客户详情
│       ├── 组网拓扑列表
│       │   ├── 拓扑编辑器
│       │   │   ├── 设备管理
│       │   │   ├── 端口管理
│       │   │   └── 连接管理
│       │   └── 拓扑图查看
│       └── 电路列表
├── 电路列表
│   └── 电路详情（含拓扑图）
└── 新增电路
```

### 5.2 核心页面功能

#### 首页
- 搜索框（电路编号、IP 地址）
- 快捷入口（电路列表、客户列表、新增电路）

#### 客户详情页
- 显示客户联系信息
- 组网拓扑列表（可查看、编辑）
- 电路列表（该客户的所有电路）

#### 拓扑编辑器
- **设备管理**：添加/编辑/删除设备
- **端口管理**：为设备添加端口（端口名、类型：光口/电口）
- **连接管理**：连接两个端口，记录光纤信息

#### 拓扑图查看页
- Canvas 绘制拓扑图
- 设备显示：图标 + 名称
- 连接线：光纤（蓝色）、网线（绿色）
- 显示端口名称
- 可拖动设备位置
- 点击设备/连线显示详情

#### 电路详情页
- 显示电路基本信息
- 显示拓扑图（高亮绑定的链路）
- 显示链路详细信息（设备、端口、光纤）

---

## 6. 拓扑图可视化设计

### 6.1 自动布局算法
- 使用简单的层次布局
- 根据设备连接关系计算层级
- 同层设备水平均匀分布
- 用户可手动拖动调整位置

### 6.2 设备图标
| 设备类型 | 图标 |
|---------|------|
| 路由器 | 🔷 |
| 交换机 | 🔶 |
| ODF | 📦 |
| 光端机 | 📡 |
| 其他 | ⚙️ |

### 6.3 连接线样式
- **光纤**：蓝色实线（#1890ff）
- **网线**：绿色实线（#52c41a）
- **高亮链路**：加粗 + 颜色加深

### 能
- 点击设备：显示设备详情弹窗
- 点击连线：显示光纤信息弹窗
- 拖动设备：实时更新位置并保存
- 缩放：双指缩放画布

---

## 7. API 接口设计

### 7.1 客户管理
- `GET /api/customers` - 获取客户列表
- `GET /api/customers/:id` - 获取客户详情
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 7.2 拓扑管理
- `GET /api/topologies?customer_id=:id` - 获取拓扑列表
- `GET /api/topologies/:id` - 获取拓扑详情（含设备、端口、连接）
- `POST /api/topologies` - 创建拓扑
- `PUT /api/topologies/:id` - 更新拓扑
- `DELETE /api/topologies/:id` - 删除拓扑
- `PUT /api/topologies/:id/layout` - 更新设备位置

### 7.3 设备管理
- `POST /api/devices` - 添加设备
- `PUT /api/devices/:id` - 更新设备
- `DELETE /api/devices/:id` - 删除设备

### 7.4 端口管理
- `POST /api/ports` - 添加端口
- `PUT /api/ports/:id` - 更新端口
- `DELETE /api/ports/:id` - 删除端口

### 7.5 连接管理
- `POST /api/connections` - 添加连接
- `PUT /api/connections/:id` - 更新连接
- `DELETE /api/connections/:id` - 删除连接

### 7.6 电路管理
- `GET /api/circuits` - 获取电路列表
- `GET /api/circuits/search?q=:keyword` - 搜索电路
- `GET /api/circuits/:id` - 获取电路详情
- `POST /api/circuits` - 创建电路
- `PUT /api/circuits/:id` - 更新电路
- `DELETE /api/circuits/:id` - 删除电路

---

## 8. 开发计划

### 阶段一：后端 API 开发（2 天）
- 搭建项目框架
- 创建数据库表
- 实现所有 API 接口
- 接口测试

### 阶段二：小程序基础功能（3 天）
- 客户管理页面
- 拓扑管理页面（文本模式）
- 设备、端口、连接管理
- 电路管理页面
- 搜索功能

### 阶段三：拓扑图可视化（2 天）
- Canvas 组件开发
- 自动布局算法
- 设备和连接绘制
- 交互功能（点击、拖动）
- 电路链路高亮

### 阶段四：测试和优化（1 天）
- 功能测试
- 性能优化
- 用户体验优化

### 阶段五：部署上线（0.5 天）
- 服务器部署
- 小程序发布

**总计：8.5 天**

---

## 9. 技术难点和解决方案

### 9.1 拓扑图自动布局
**难点**：设备数量和连接关系不固定，需要自动计算合理的布局。
**解决方案**：使用简单的层次布局算法，根据连接关系计算层级，同层设备水平分布。

### 9.2 Canvas 交互
**难点**：Canvas 不支持 DOM 事件，需要手动实现点击和拖动。
**解决方案**：记录每个设备和连接的绘制区域，点击时判断坐标是否在区域内。

### 9.3 电路绑定链路
**难点**：如何让用户方便地选择拓扑图中的链路。
**解决方案**：拓扑图进入"选择模式"，点击连接线时高亮显示，底部显示链路信息供确认。

### 9.4 数据同步
**难点**：小程序和服务器数据同步，避免频繁请求。
**解决方案**：使用 wx.setStorage 缓存常用数据，拓扑图数据每次从服务器获取。

---

## 10. 后续扩展功能

### 第二期功能
- PC 管理端（使用 AntV G6）
- 批量导入设备和电路
- 导出拓扑图为图片
- 数据统计报表

### 第三期功能
- 故障记录和维护日志
- 电路到期提醒
- 权限管理（多角色）
- 操作日志审计

---

## 11. 项目目录结构

```
circuit-management-system/
├── backend/                 # Node.js 后端
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── models/         # 数据库模型
│   │   ├── controllers/    # 控制器
│   │   ├── routes/         # 路由
│   │   ├── middlewares/    # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── app.js          # 入口文件
│   ├── package.json
│   └── .env
│
├── miniprogram/            # 微信小程序
│   ├── pages/              # 页面
│   │   ├── index/          # 首页
│   │   ├── customer/       # 客户管理
│   │   ├── topology/       # 拓扑管理
│   │   ├── circuit/        # 电路管理
│   │   └── device/         # 设备管理
│   ├── components/         # 组件
│   │   └── topology-canvas/  # 拓扑图组件
│   ├── utils/              # 工具函数
│   ├── api/                # API 封装
│   ├── app.js
│   ├── app.json
│   └── app.wxss
│
└── memory-bank/            # 开发文档
    └── design-document.md  # 设计文档
```

---

## 12. 部署方案

### 12.1 后端部署
- 云服务器（Linux）
- Node.js + PM2（进程管理）
- SQLite 数据库文件（`backend/data/circuit_management.sqlite`）
- Nginx（反向代理）

### 12.2 小程序部署
- 微信开发者工具上传代码
- 提交审核
- 发布

---

## 13. 关键设计决策

### 13.1 为什么电路只绑定单条链路？
**原因**：电路本质上是两个设备之间的连接，不需要记录整条路径。这样设计更简洁，也更符合实际使用场景。

### 13.2 为什么组网拓扑按客户独立管理？
**原因**：不同客户的组网是独立的，不存在跨客户共享设备的情况。独立管理更清晰，避免数据混乱。

### 13.3 为什么使用 Canvas 而不是 SVG？
**原因**：小程序环境下 Canvas 性能更好，且设备数量不多（5 台以内），Canvas 足够满足需求。

### 13.4 为什么不做权限管理？
**原因**：前期只有 2-3 人使用，权限管理会增加复杂度。后期如果需要可以扩展。

---

## 14. 数据示例

### 14.1 拓扑数据示例
```json
{
  "topology": {
    "id": 1,
    "topology_name": "政府专网"
  },
  "devices": [
    {
      "id": 1,
      "device_name": "路由器A",
      "device_type": "router",
      "device_model": "华为 OSN9600",
      "location": "4楼干线机房",
      "ports": [
        {"id": 1, "port_name": "GE1", "port_type": "optical"}
      ]
    }
  ],
  "connections": [
    {
      "id": 1,
      "source_port_id": 1,
      "target_port_id": 2,
      "connection_type": "fiber",
      "fiber_info": "ODF8-13柜 4框 E盘 1、2芯"
    }
  ]
}
```

### 14.2 电路数据示例
```json
{
  "circuit": {
    "id": 1,
    "circuit_number": "CX202401001",
    "circuit_type": "IPRAN",
    "bandwidth": "1000M",
    "connection_id": 1
  },
  "bound_connection": {
    "source_device": "路由器A",
    "source_port": "GE1",
    "target_device": "ODF-A",
    "target_port": "端口1",
    "fiber_info": "ODF8-13柜 4框 E盘 1、2芯"
  }
}
```

---

**文档版本**：v1.0
**创建日期**：2026-03-08
**最后更新**：2026-03-08
