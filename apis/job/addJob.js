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
	description: 'Adds a job to the job queue',
	path: '/job',
	method: 'POST',
	summary: 'Add a job to the queue',
	notes: 'Add a job to the queue',
	type: 'Job',
	parameters: [
		param('type', 'The job type. A worker will process the payload based on the this type of job.', 'string', null, true),
		param('payload', 'The job payload. Can be serialized JSON.', 'string'),
		param('meta', 'A serialized JSON object containing meta data used in assign the job to a worker.', 'string'),
		param('priority', 'The job priority: <0 low, >0 high', 'integer', 0)
	],
	responseMessages: [
		swe.invalid('input')
	],
	nickname: 'addJob'
};

exports.action = function action(models) {
	var JobModel = models.job,
		JobMetaModel = models.job_meta;

	return function (req, res) {
		var body = req.body;
		if (!body)		throw swe.invalid('request');
		if (!body.type)	throw swe.invalid('type');

		JobModel.create({
			priority: ~~body.priority,
			type: String(body.type).substring(0, 32),
			state: 0,
			payload: body.payload
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