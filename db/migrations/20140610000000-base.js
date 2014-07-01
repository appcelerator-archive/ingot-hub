var async = require('async');

exports.up = function(migration, DataTypes, done) {
	async.series([
		function (next) {
			migration.createTable(
				'jobs',
				{
					// unique identifier
					id: {
						type: DataTypes.INTEGER,
						primaryKey: true,
						autoIncrement: true
					},

					// unique identifier
					parent_id: {
						type: DataTypes.INTEGER
					},

					// priority of job: <0 low, >0 high
					priority: {
						type: DataTypes.INTEGER,
						defaultValue: 0
					},

					// type of job: test, build, etc
					type: {
						type: DataTypes.STRING(32),
						allowNull: false
					},

					// current state: 0 (queued), 1 (running), 2 (completed), 3 (failed)
					state: {
						type: DataTypes.INTEGER,
						defaultValue: 0,
						allowNull: false
					},

					// the id of the spoke that this job is assigned to
					spoke_id: {
						type: DataTypes.INTEGER
					},

					// a blob, usually a serialized JSON object
					payload: {
						type: DataTypes.TEXT
					},

					// the json result from the job
					result: {
						type: DataTypes.TEXT
					},

					// timestamp of when the job was created
					createdAt: {
						type: DataTypes.DATE,
						allowNull: false
					},

					// timestamp of when the job was last updated
					updatedAt: {
						type: DataTypes.DATE,
						allowNull: false
					}
				}
			).complete(next).error(next);
		},

		function (next) {
			migration.createTable(
				'job_meta',
				{
					// unique identifier
					id: {
						type: DataTypes.INTEGER,
						primaryKey: true,
						autoIncrement: true
					},

					// the job id
					job_id: {
						type: DataTypes.INTEGER,
						allowNull: false
					},

					// the key
					key: {
						type: DataTypes.STRING(64),
						allowNull: false
					},

					// the value
					value: {
						type: DataTypes.STRING(8000)
					}
				}
			).complete(next).error(next);
		},

		function (next) {
			migration.createTable(
				'job_log',
				{
					// unique identifier
					id: {
						type: DataTypes.INTEGER,
						primaryKey: true,
						autoIncrement: true
					},

					// the job id
					job_id: {
						type: DataTypes.INTEGER,
						allowNull: false
					},

					// the type of log message
					type: {
						type: DataTypes.STRING(32)
					},

					// the log message
					message: {
						type: DataTypes.STRING(8000)
					},

					// timestamp of when the log entry was created
					createdAt: {
						type: DataTypes.DATE,
						allowNull: false
					}
				}
			).complete(next).error(next);
		},

		function (next) {
			migration.createTable(
				'spokes',
				{
					// unique identifier
					id: {
						type: DataTypes.INTEGER,
						primaryKey: true,
						autoIncrement: true
					},

					// a machine specific token
					machineId: {
						type: DataTypes.STRING(64)
					},

					// the spoke's hostname
					ipaddress: {
						type: DataTypes.STRING(32),
						allowNull: false
					},

					// the spoke's hostname
					hostname: {
						type: DataTypes.STRING(128),
						allowNull: false
					},

					// the spoke version
					version: {
						type: DataTypes.STRING(32),
						allowNull: false
					},

					// timestamp of when the job was created
					createdAt: {
						type: DataTypes.DATE,
						allowNull: false
					},

					// timestamp of when the job was last updated
					updatedAt: {
						type: DataTypes.DATE,
						allowNull: false
					}
				}
			).complete(next).error(next);
		}
	], done);
};