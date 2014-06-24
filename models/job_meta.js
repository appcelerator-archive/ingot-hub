var JobMeta;

module.exports = function (sequelize, DataTypes) {
	if (JobMeta) return JobMeta;

	JobMeta = sequelize.define('job_meta', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		// the job id
		job_id: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},

		// the key
		key: {
			type: DataTypes.STRING(64)
		},

		// the value
		value: {
			type: DataTypes.STRING(8000)
		}
	}, {
		// we don't want these automagic fields
		createdAt: false,
		updatedAt: false
	});

	JobMeta.belongsTo(require('./job')(sequelize, DataTypes));

	return JobMeta;
};