const sequelize = require('../config/database');
const Customer = require('./customer');
const Topology = require('./topology');
const Device = require('./device');
const Port = require('./port');
const Connection = require('./connection');
const Circuit = require('./circuit');

// 1. Customer <-> Topology (1:N)
Customer.hasMany(Topology, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
Topology.belongsTo(Customer, { foreignKey: 'customer_id', onDelete: 'CASCADE' });

// 2. Topology <-> Device (1:N)
Topology.hasMany(Device, { foreignKey: 'topology_id', onDelete: 'CASCADE' });
Device.belongsTo(Topology, { foreignKey: 'topology_id', onDelete: 'CASCADE' });

// 3. Device <-> Port (1:N)
Device.hasMany(Port, { foreignKey: 'device_id', onDelete: 'CASCADE' });
Port.belongsTo(Device, { foreignKey: 'device_id', onDelete: 'CASCADE' });

// 4. Topology <-> Connection (1:N)
Topology.hasMany(Connection, { foreignKey: 'topology_id', onDelete: 'CASCADE' });
Connection.belongsTo(Topology, { foreignKey: 'topology_id', onDelete: 'CASCADE' });

// 5. Port <-> Connection (Source and Target)
Port.hasMany(Connection, { as: 'SourceConnections', foreignKey: 'source_port_id', onDelete: 'CASCADE' });
Port.hasMany(Connection, { as: 'TargetConnections', foreignKey: 'target_port_id', onDelete: 'CASCADE' });
Connection.belongsTo(Port, { as: 'SourcePort', foreignKey: 'source_port_id', onDelete: 'CASCADE' });
Connection.belongsTo(Port, { as: 'TargetPort', foreignKey: 'target_port_id', onDelete: 'CASCADE' });

// 6. Customer <-> Circuit (1:N)
Customer.hasMany(Circuit, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
Circuit.belongsTo(Customer, { foreignKey: 'customer_id', onDelete: 'CASCADE' });

// 7. Topology <-> Circuit (1:N)
Topology.hasMany(Circuit, { foreignKey: 'topology_id', onDelete: 'CASCADE' });
Circuit.belongsTo(Topology, { foreignKey: 'topology_id', onDelete: 'CASCADE' });

// 8. Connection <-> Circuit (1:N)
Connection.hasMany(Circuit, { foreignKey: 'connection_id', onDelete: 'SET NULL' });
Circuit.belongsTo(Connection, { foreignKey: 'connection_id', onDelete: 'SET NULL' });

module.exports = {
  sequelize,
  Customer,
  Topology,
  Device,
  Port,
  Connection,
  Circuit
};
