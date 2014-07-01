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
	description: 'Adds a job log message',
	path: '/job/{job_id}',
	method: 'POST',
	summary: 'Add a job log message',
	notes: 'Add a job log message',
	type: 'Job',
	parameters: [
		param('type', 'The type of log message such as "info", "warning", "error"', 'string'),
		param('message', 'The log message', 'string'),
		param('timestamp', 'The timestamp of the log message. If not specified, it will automatically be set to the current time.', 'date')
	],
	responseMessages: [
		swe.invalid('input')
	],
	nickname: 'addJobLog'
};

exports.action = function action(models) {
	var JobModel = models.job,
		JobLogModel = models.job_log;

	return function (req, res) {
		if (!req.params.jobId) throw swe.invalid('jobId');
		var body = req.body;
		if (!body)			throw swe.invalid('request');
		if (!body.message)	throw swe.invalid('message');

		JobLogModel.create({
			job_id: req.params.jobId,
			type: body.type ? String(body.type).substring(0, 32) : null,
			message: String(body.message).substring(0, 8000),
			timestamp: body.timestamp ? new Date(body.timestamp) : new Date
		}).success(function (result) {
			if (body.meta) {
				try {
					var meta = JSON.parse(body.meta);
					if (meta !== null && typeof meta === 'object') {
						Object.keys(meta).forEach(function (key) {
							// if the value is an array, then we insert multiple meta entries for the same key
							var value = Array.isArray(meta[key]) ? meta[key] : [meta[key]];
							value.forEach(function (val) {
								JobMetaModel.create({
									job_id: result.id,
									key: key,
									value: String(val)
								});
							});
						});
					}
				} catch (ex) {
					res.send(400, JSON.stringify({ success: false, error: 'Invalid "meta" param: ' + ex.toString() }));
					return;
				}
			}

			res.send(201, JSON.stringify({ success: true, result: result }));
		}).error(function (err) {
			res.send(400, JSON.stringify({ success: false, error: err }));
		});
	};
};