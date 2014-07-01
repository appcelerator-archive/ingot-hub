var JobLog;

module.exports = function (sequelize, DataTypes) {
	if (JobLog) return JobLog;

	JobLog = sequelize.define('job_log', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		// the job id
		job_id: {
			type: DataTypes.INTEGER
		},

		// the type of log message
		type: {
			type: DataTypes.STRING(32)
		},

		// the log message
		message: {
			type: DataTypes.STRING(8000)
		}
	}, {
		// we don't want these automagic fields
		createdAt: false,
		updatedAt: false
	});

	JobLog.belongsTo(require('./job')(sequelize, DataTypes));

	return JobLog;
};