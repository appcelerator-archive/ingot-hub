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
	description: 'Registers a spoke with the hub',
	path: '/register',
	method: 'POST',
	summary: 'Registers a spoke with the hub',
	notes: 'Registers a spoke with the hub',
	type: 'Spoke',
	parameters: [
		param('hostname', 'The hostname of the spoke.', 'string', null, true),
		param('version', 'The spoke\'s version number.', 'string', null, true),
		param('machineId', 'A token that is machine specific that is passed with each request.', 'string')
	],
	responseMessages: [
		swe.invalid('input')
	],
	nickname: 'registerSpoke'
};

exports.action = function action(models) {
	var SpokeModel = models.spoke;

	return function (req, res) {
		var body = req.body;
		if (!body) 				throw swe.invalid('request');
		if (!body.machineId) 	throw swe.invalid('machineId');
		if (!body.hostname)		throw swe.invalid('hostname');
		if (!body.version)		throw swe.invalid('version');

		// check if the token is valid
		SpokeModel.findOrCreate(
			{
				machineId: body.machineId
			},
			{
				machineId: body.machineId,
				ipaddress: req.connection.remoteAddress,
				hostname: body.hostname,
				version: body.version
			}
		).success(function (result) {
			res.send(201, JSON.stringify({ success: true, result: result }));
		}).error(function (err) {
			res.send(400, JSON.stringify({ success: false, error: err }));
		});
	};
};