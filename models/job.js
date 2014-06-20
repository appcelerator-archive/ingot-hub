module.exports = function (sequelize, DataTypes) {
	var Job = sequelize.define('job', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		// priority of job: <0 low, >0 high
		priority: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},

		// type of job: test, build, etc
		type: {
			type: DataTypes.STRING(32)
		},

		// current state: 0 (queued), 1 (running), 2 (completed), 3 (failed)
		state: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},

		// the id of the spoke that this job is assigned to
		spoke_id: {
			type: DataTypes.INTEGER
		},

		// a blob, usually a serialized JSON object
		payload: {
			type: DataTypes.TEXT
		}
	});

	Job.hasMany(require('./job_meta')(sequelize, DataTypes));

	return Job;
};