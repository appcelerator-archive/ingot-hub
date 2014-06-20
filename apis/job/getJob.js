var swagger = require('swagger-node-express'),
	swe = swagger.errors;

exports.spec = {
	description: 'Gets a job from the job queue',
	path: '/job',
	method: 'GET',
	summary: 'Gets a job from the job queue',
	notes: 'Gets a job from the job queue',
	type: 'Job',
	parameters: [
		swagger.queryParam('machineId', 'A token that is machine specific that is passed with each request.', 'string', true),
		swagger.queryParam('types', 'A comma-separated list of supported job types that are used to determine the job to return.', 'string')
	],
	responseMessages: [
		swe.invalid('input')
	],
	nickname: 'getJob'
};

exports.action = function action(models) {
	var JobModel = models.job,
		SpokeModel = models.spoke,
		sequelize = SpokeModel.sequelize;

	return function (req, res) {
		if (!req.query.machineId) throw swe.invalid('machineId');

		SpokeModel.find({
			where: { machineId: req.query.machineId }
		}).success(function (spoke) {
			if (spoke === null) {
				// error, unknown spoke
				res.send(400, JSON.stringify({ success: false, error: 'unknown spoke "' + req.query.machineId + '"' }));
				return;
			}

			var capabilities = JSON.parse(spoke.capabilities),
				osList = [],
				platformList = [],
				sql = [],
				escapeQuotes = function escapeQuotes(s) {
					return String(s).replace(/'/g, "''");
				};

			capabilities.forEach(function (platform) {
				// get the os name
				if (platform.os && platform.os.platform) {
					osList.push(platform.os.platform);
				}

				// if they have at least one Xcode installed, then assume they can do iOS
				if (platform.xcode && Object.keys(platform.xcode).length) {
					platformList.push('ios');
				}
			});

			sql.push('SELECT  j.id, j.type, j.state, j.spoke_id, j.payload');
			sql.push('FROM    jobs j');
			if (osList.length) {
				sql.push("LEFT JOIN job_meta jm_os ON jm_os.job_id = j.id AND jm_os.key = 'os'");
			}
			if (platformList.length) {
				sql.push("LEFT JOIN job_meta jm_platform ON jm_platform.job_id = j.id AND jm_platform.key = 'platform'");
			}
			sql.push('WHERE    j.state = 0');
			if (req.query.types) {
				sql.push('AND j.type IN (' + req.query.types.split(',').map(function (type) {
					return "'" + escapeQuotes(type) + "'"
				}) + ')');
			}
			if (osList.length) {
				sql.push("AND (jm_os.id IS NULL OR (" + osList.map(function (name) { return "jm_os.value = '" + escapeQuotes(name) + "'"; }).join(' OR ') + "))");
			}
			if (platformList.length) {
				sql.push("AND (jm_platform.id IS NULL OR (" + platformList.map(function (name) { return "jm_platform.value = '" + escapeQuotes(name) + "'"; }).join(' OR ') + "))");
			}
			sql.push('GROUP BY j.id, j.type, j.state, j.spoke_id, j.payload');
			sql.push('ORDER BY j.priority DESC, j.createdAt ASC')
			sql.push('LIMIT 1');

			sequelize.transaction(function(t) {
				// find a job that matches this spoke's capabilities
				sequelize.query(sql.join('\n'), JobModel, { transaction: t }).success(function (jobs) {
					if (jobs.length) {
						var job = jobs[0];
						job.state = 1;
						job.spoke_id = spoke.id;
						job.save({ transaction: t }).success(function () {
							t.commit().success(function () {
								res.send(200, JSON.stringify({ success: true, result: job }));
							}).error(function (err) {
								res.send(400, JSON.stringify({ success: false, error: err }));
							});
						}).error(function (err) {
							t.commit();
							res.send(400, JSON.stringify({ success: false, error: err }));
						});
					} else {
						t.commit();
						res.send(204, JSON.stringify({ success: true, result: null }));
					}
				}).error(function (err) {
					t.commit();
					res.send(400, JSON.stringify({ success: false, error: err }));
				});
			});
		}).error(function (err) {
			res.send(400, JSON.stringify({ success: false, error: err }));
		});
	};
};