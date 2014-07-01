module.exports = function (sequelize, DataTypes) {
	return sequelize.define('spoke', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		// a machine specific token
		machineId: {
			type: DataTypes.STRING(64)
		},

		// the spoke's ipaddress
		ipaddress: {
			type: DataTypes.STRING(32)
		},

		// the spoke's hostname
		hostname: {
			type: DataTypes.STRING(128)
		},

		// the spoke version
		version: {
			type: DataTypes.STRING(32)
		}
	});
};