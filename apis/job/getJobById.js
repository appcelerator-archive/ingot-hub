var swagger = require('swagger-node-express'),
	swe = swagger.errors;

exports.spec = {
	description: 'Gets a job by id',
	path: '/job/{jobId}',
	method: 'GET',
	summary: 'Gets a job by id',
	notes: 'Gets a job by id',
	type: 'Job',
	parameters: [
		swagger.pathParam('jobId', 'The job\'s unique identifier.', 'integer')
	],
	responseMessages: [
		swe.invalid('input')
	],
	nickname: 'getJobById'
};

exports.action = function action(models) {
	var JobModel = models.job;

	return function (req, res) {
		if (!req.params.jobId) throw swe.invalid('jobId');

		JobModel.find(req.params.jobId).success(function (job) {
			if (job === null) {
				// error, unknown job
				res.send(400, JSON.stringify({ success: false, error: 'unknown job "' + req.params.jobId + '"' }));
				return;
			}

			res.send(200, JSON.stringify({ success: true, result: job }));
		}).error(function (err) {
			res.send(400, JSON.stringify({ success: false, error: err }));
		});
	};
};