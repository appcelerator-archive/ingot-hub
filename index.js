var appc = require('node-appc'),
	express = require('express'),
	fs = require('fs'),
	path = require('path'),
	Sequelize = require('sequelize'),
	sequelize,
	swagger = require('swagger-node-express');

/**
 * Dependent services that must load before we're loaded
 */
exports.dependencies = [ 'ingot-web-server' ];

/**
 * Initialize the hub
 * @param {Object} [cfg] - Configuration object
 * @param {Function} [callback] - A function to call after the hub has been initialized
 */
exports.load = function load(cfg, callback) {
	cfg || (cfg = {});

	var db = cfg.hub && cfg.hub.db || {};

	if (['mysql', 'postgres', 'mariadb'].indexOf(db.dialect) === -1) {
		db.dialect = 'sqlite';
	}

	switch (db.dialect) {
		case 'sqlite':
			if (!db.storage) {
				db.storage = '~/.appcelerator/ingot-hub.sqlite';
			}
			db.storage = appc.fs.resolvePath(db.storage);
			break;

		default: // mariadb, mysql, postgres
			db.host || (db.host = 'localhost');
			db.port || (db.port = 3306);
			db.username || (db.username = null);
			db.password || (db.password = null);
	}

	function logger() {
		var args = ['hub: sequelize:'].concat(Array.prototype.slice.call(arguments));
		console.info.apply(null, args);
	}
	db.logging = logger;

	// connect to the database
	console.info('hub: connecting to %s (%s)', db.dialect, db.dialect === 'sqlite' ? db.storage : (db.host + ':' + db.port));
	sequelize = new Sequelize('ingot-hub', db.username, db.password, db);

	// initialize the database
	var migrator = sequelize.getMigrator({
		logging: logger,
		path: path.join(__dirname, 'db', 'migrations')
	});

	migrator.migrate().success(function () {
		sequelize.query('SELECT * FROM sqlite_master').success(function(myTableRows) {
			console.log(myTableRows);
			typeof callback === 'function' && callback();
		});
	});
};

/**
 * Wire up REST API routes
 * @param {Object} deps - Map of dependency modules
 * @param {Object} [cfg] - Configuration object
 */
exports.start = function start(deps, cfg) {
	cfg || (cfg = {});

	console.info('hub: initializing routes');
	var apirouter = express.Router();
	swagger.setAppHandler(apirouter);

	var models = {},
		jsRegex = /\.js$/;

	function walk(dir, fn) {
		fs.readdirSync(dir).forEach(function (name) {
			var file = path.join(dir, name);
			if (!fs.existsSync(file)) return;
			if (fs.statSync(file).isDirectory()) {
				walk(file, fn);
			} else if (jsRegex.test(name)) {
				fn(file);
			}
		});
	}

	// load models
	walk(path.join(__dirname, 'models'), function (file) {
		models[path.basename(file).replace(jsRegex, '')] = sequelize.import(file);
	});

	// load apis
	walk(path.join(__dirname, 'apis'), function (file) {
		var api = require(file);
		if (api.spec && typeof api.action === 'function') {
			swagger['add' + api.spec.method.substring(0, 1).toUpperCase() + api.spec.method.substring(1).toLowerCase()]({
				spec: api.spec,
				action: api.action(models)
			});
		}
	});

	swagger.configureSwaggerPaths('', '/api-docs', '');
	swagger.configure('http://localhost:8080/api', require('./package.json').version);
	swagger.setHeaders = function setHeaders(res) {
		res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
		res.header('Content-Type', 'application/json; charset=utf-8');
	};

	var router = deps['ingot-web-server'].router;
	router.use('/api', apirouter);

	router.use('/api-docs', function (req, res) {
		res.locals.title = 'Swagger UI • Ingot Hub';
		if ((req.method === 'GET' || req.method === 'HEAD') && req.url === '/') {
			res.render(path.join(__dirname, 'views', 'swagger-ui.hjs'), {
				url: 'http://localhost:8080/api/api-docs',
				layout: ''
			});
			return;
		}
		express.static(path.join(__dirname, 'public', 'lib', 'swagger-ui', 'dist')).apply(null, arguments);
	});
};

exports.stop = function stop() {
	//
};

exports.unload = function unload() {
	//
};