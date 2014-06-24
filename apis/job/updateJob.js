var swagger = require('swagger-node-express'),
	swe = swagger.errors;

function param(name, desc, type, defaultValue, required) {
	return {
		'name': name,
		'description': desc,
		'type': type,
		'required': !!required,
		'paramType': 'form',
		'defaultValue': defaultValue
	};
}

exports.spec = {
	description: 'Updates a job by id',
	path: '/job/{jobId}',
	method: 'PUT',
	summary: 'Updates a job by id',
	notes: 'Updates a job by id',
	type: 'Job',
	parameters: [
		swagger.pathParam('jobId', 'The job\'s unique identifier.', 'integer'),
		param('success', 'A flag indicating if the job ran successfully', 'boolean', false, true),
		param('result', 'A serialized JSON object with the result of the job', 'string', undefined, true)
	],
	responseMessages: [
		swe.invalid('input')
	],
	nickname: 'updateJob'
};

exports.action = function action(models) {
	var JobModel = models.job;

	return function (req, res) {
		if (!req.params.jobId) throw swe.invalid('jobId');
		var body = req.body;
		if (!body)			throw swe.invalid('request');
		if (!body.success)	throw swe.invalid('success');
		if (!body.result)	throw swe.invalid('result');

		JobModel.find(req.params.jobId).success(function (job) {
			if (job === null) {
				// error, unknown job
				res.send(400, JSON.stringify({ success: false, error: 'unknown job "' + req.params.jobId + '"' }));
				return;
			}

			job.success = !!body.success;
			job.result = body.result || null;

			job.save().success(function () {
				res.send(200, JSON.stringify({ success: true, result: job }));
			}).error(function (err) {
				res.send(400, JSON.stringify({ success: false, error: err }));
			});
		}).error(function (err) {
			res.send(400, JSON.stringify({ success: false, error: err }));
		});
	};
};