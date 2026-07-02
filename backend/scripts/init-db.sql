-- 创建数据库
CREATE DATABASE IF NOT EXISTS circuit_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE circuit_management;

-- 客户信息表
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL COMMENT '单位名称',
  contact_person VARCHAR(50) COMMENT '联系人',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  account_manager VARCHAR(50) COMMENT '客户经理',
  manager_phone VARCHAR(20) COMMENT '客户经理电话',
  latest_check_date DATE COMMENT '最近核查日期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 组网拓扑表
CREATE TABLE IF NOT EXISTS network_topologies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL COMMENT '客户 ID',
  topology_name VARCHAR(100) NOT NULL COMMENT '拓扑名称',
  description TEXT COMMENT '描述',
  layout_data JSON COMMENT '设备位置信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 网络设备表
CREATE TABLE IF NOT EXISTS network_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topology_id INT NOT NULL COMMENT '拓扑 ID',
  device_name VARCHAR(100) NOT NULL COMMENT '设备名称',
  device_type ENUM('router', 'switch', 'odf', 'optical_device', 'other') DEFAULT 'other' COMMENT '设备类型',
  device_model VARCHAR(100) COMMENT '设备型号',
  location VARCHAR(200) COMMENT '位置',
  position_x FLOAT DEFAULT 0 COMMENT 'X 坐标',
  position_y FLOAT DEFAULT 0 COMMENT 'Y 坐标',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topology_id) REFERENCES network_topologies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 设备端口表
CREATE TABLE IF NOT EXISTS device_ports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL COMMENT '设备 ID',
  port_name VARCHAR(50) NOT NULL COMMENT '端口名称',
  port_type ENUM('optical', 'electrical', 'other') DEFAULT 'other' COMMENT '端口类型',
  port_speed VARCHAR(20) COMMENT '端口速率',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES network_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 设备连接表
CREATE TABLE IF NOT EXISTS device_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topology_id INT NOT NULL COMMENT '拓扑 ID',
  source_port_id INT NOT NULL COMMENT '源端口 ID',
  target_port_id INT NOT NULL COMMENT '目标端口 ID',
  connection_type ENUM('fiber', 'cable', 'other') DEFAULT 'fiber' COMMENT '连接类型',
  fiber_info TEXT COMMENT '线缆信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topology_id) REFERENCES network_topologies(id) ON DELETE CASCADE,
  FOREIGN KEY (source_port_id) REFERENCES device_ports(id) ON DELETE CASCADE,
  FOREIGN KEY (target_port_id) REFERENCES device_ports(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 电路信息表
CREATE TABLE IF NOT EXISTS circuits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT COMMENT '客户 ID',
  topology_id INT COMMENT '拓扑 ID',
  connection_id INT COMMENT '绑定的连接 ID',
  circuit_name VARCHAR(100) NOT NULL COMMENT '电路名称',
  circuit_number VARCHAR(100) UNIQUE COMMENT '电路编号',
  circuit_type ENUM('IPRAN', 'STN', '互联网专线', '裸纤', 'SDH', 'MSTP', 'OTN', '语音中继', 'FTTH', '其他') COMMENT '电路类型',
  bandwidth VARCHAR(20) COMMENT '带宽',
  open_date DATE COMMENT '开通日期',
  local_ip VARCHAR(50) COMMENT '本端 IP',
  remote_ip VARCHAR(50) COMMENT '对端 IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (topology_id) REFERENCES network_topologies(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES device_connections(id) ON DELETE SET NULL
) ENGINE=InnoDB;
