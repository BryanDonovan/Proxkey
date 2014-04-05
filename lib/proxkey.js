'use strict';

var Proxkey = {},
	http = require('http'),
	Hapi = require('hapi'),
	Errors = require('./error.js'),
	_ = require('lodash'),
	fs = require('fs');

Proxkey.Config = {};
Proxkey.Routes = [];
Proxkey.Responses = {}; // key is the requested url
Proxkey.Global = { Response: false };

/*
	Path should have:

	Required:
		- (String) URL to listen on
		- (Object) response
			- (String) respoonse_type : application/xml, application/json, text/html, text/xml, ...
			- (String) data : could be a file or string for ex: ./ for a file or {data: 'Success'} for json or <xml>hi</xml> for xml
	Optional
		- (String) Method : POST, GET, PUT, DEL (defult value will be GET)
		- (Object) params
			- (Object) failure : [{"key": "phone_num", "value": "123123123"}] - "key" the param name, "value" the param value

	Example: Check out the example directory
*/


/*
	Set Proxy Configuration
*/
Proxkey.setConfiguration = function(args) {

	Proxkey.Config.PORT = args.port ? args.port : 9191;
	Proxkey.Config.HOST = args.host ? args.host : 'localhost';
	Proxkey.Config.LOG = args.log ? args.log : true;
};

/*
	args.route_path - route requested
	args.host - host to proxy
	args.port - port to proxy
	args.path - path to proxy
	args.method - method to proxy
*/
function proxyRoute(args, cb) {

	var options = {
		host: args.host,
		port: args.port,
		path: args.path,
		method: args.method
	};

	var req = http.request(options, function(res) {

		Proxkey.Responses[args.route_path].response.production.code = res.statusCode;
		Proxkey.Responses[args.route_path].response.production.type = res.headers['content-type'];

		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			Proxkey.Responses[args.route_path].response.production.data += chunk;
		});

		res.on('end', function() {
			return cb({code: 'OK'});
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.end();
}

function checkIfFileExsist(args, cb) {
	var path = './../' + args.path;
	fs.exists(path, function(exists) {
	    if (exists) {
	        cb(null, path);
	    } else {
			cb(true,null);
	    }
	});

}

function setHandlerForRoute(args, cb) {

	if (!args.response || !args.response.success.data) {
		throw new Error(Errors.RouteMustHaveResponseData);
	}

	//Get different mode
	args.params.success = {};
	_.forIn(args.params, function(value, key) {

		//Check if the data is a file or not
		if (args.response[key] && args.response[key].data) {
			if (args.response[key].data.substr(args.response[key].data.length - 3) == 'xml' || args.response[key].data.substr(args.response[key].data.length - 4) == 'json' ) {
				if (Proxkey.Config.LOG) {
					console.log('Loading data from file: ', args.response[key].data);
				}
				setTimeout(function(){
					checkIfFileExsist({ path: args.response[key].data}, function(err, result) {
						if (err) {
							throw new Error(Errors.FileDoesntExistDataSuccess);
						}
						Proxkey.Responses[args.request_url].response[key].data = fs.readFileSync(result,'utf8');
					});
				}, 100);
			}
		}
	});

	var handler = function (request, reply) {
		if (Proxkey.Config.LOG) {
			console.log('************************************************');
			console.log('Requested URL: ' + request.route.path);
		}
		var query_params = {};
		var response_mode = [];
		Proxkey.Global.Response = false;
		//Set query params
		if (request && (request.query || request.payload)) {
			query_params = _.isEmpty(request.query) ? request.payload : request.query;
		}

		if (Proxkey.Config.LOG) {
			console.log('Requested Params: ', query_params);
		}
		//Check for response code (defualt is 200)
		if (!Proxkey.Responses[request.route.path] || !Proxkey.Responses[request.route.path].code) {
			Proxkey.Responses[request.route.path].response.code = 200;
		}

		if (_.isEmpty(query_params)) {

			return reply(Proxkey.Responses[request.route.path].response.success.data)
				.type(Proxkey.Responses[request.route.path].response.success.type)
		        .code(Proxkey.Responses[request.route.path].response.success.code);
		} else {
			if (Proxkey.Responses[request.route.path].params) {
				//Get different mode
				_.forIn(Proxkey.Responses[request.route.path].params,function(val1, key1) {
					response_mode.push(key1);
				});
				//remove success from response_mode
				_.remove(response_mode, function(mode) { return mode == 'success'; });

				var tmp_args = {};
				tmp_args.query_params = query_params;
				tmp_args.mode = response_mode;
				checkIfParamInMode(tmp_args, request, function(err, result) {
					if (err) {
						return reply(Proxkey.Responses[request.route.path].response.success.data)
							.type(Proxkey.Responses[request.route.path].response.success.type)
							.code(Proxkey.Responses[request.route.path].response.success.code);
					}
					else if (result.code == 'OK' && result.mode == 'production') {

						if (!Proxkey.Responses[request.route.path].response.production) {
							throw new Error(Errors.RouteProductionMustHaveURLToProxy);
						}

						if (!Proxkey.Responses[request.route.path].response.production.host || !Proxkey.Responses[request.route.path].response.production.path || !Proxkey.Responses[request.route.path].response.production.port) {
							throw new Error(Errors.RouteProductionMustHaveHostPathPort);
						}

						//Go and hit Production URL
						var args = {
							route_path: request.route.path,
							host: Proxkey.Responses[request.route.path].response.production.host,
							path: Proxkey.Responses[request.route.path].response.production.path,
							port: Proxkey.Responses[request.route.path].response.production.port,
							method: Proxkey.Responses[request.route.path].response.production.method ? Proxkey.Responses[request.route.path].response.production.method : Proxkey.Responses[request.route.path].method
						};
						proxyRoute(args,function(ret){

							if (ret.code == 'OK'){
								return reply(Proxkey.Responses[request.route.path].response.production.data)
									.type(Proxkey.Responses[request.route.path].response.production.type)
						            .code(Proxkey.Responses[request.route.path].response.production.code);
							}
						});
					}
					else if (result.code == 'OK') {
						reply(Proxkey.Responses[request.route.path].response[result.mode].data)
							.type(Proxkey.Responses[request.route.path].response[result.mode].type)
							.code(Proxkey.Responses[request.route.path].response[result.mode].code);
					}
				});
			}
		}
	};

	cb(handler);
}

function startServer(){

	var options = {
        cors: true
    };

	//Start Server
	var server = Hapi.createServer(Proxkey.Config.HOST, Proxkey.Config.PORT,options);
    server.route(Proxkey.Routes);
    server.start();
    console.log('Proxkey is running on ' + 'http://' + Proxkey.Config.HOST + ':' + Proxkey.Config.PORT);
}

function checkIfParamInMode (args, request, cb) {

	args.mode.forEach(function(val){

		_.findKey(Proxkey.Responses[request.route.path].params[val], function(params) {

			var tmp_params = {};
				tmp_params[params.key] = params.value;
			if (_.isEqual(args.query_params,tmp_params)) {
				if (Proxkey.Config.LOG) {
					console.log('Requested Found: response.' + val);
				}
				Proxkey.Global.Response = true;
		  		return cb(null, {code: 'OK', mode: val});
		  	}
		});
	});
	if (!Proxkey.Global.Response) {
		if (Proxkey.Config.LOG) {
			console.log('Requested Not Found: return response.success');
		}

		return cb({Error: 'Coludnt find the params, return defualt'}, null);
	}
};

Proxkey.start = function(args) {

	// if args.configuration is defined
	if (!args.configuration || !args.configuration.port || !args.configuration.host) {
		throw new Error(Errors.HostOrPortNotDefined);
	}

	Proxkey.setConfiguration(args.configuration);

	if (!args.routes) {
		throw new Error(Errors.RoutesNotDefined);
	}

	Proxkey.setRoutes(args.routes);

};

/*
	Set Routes
	(array) args
*/
Proxkey.setRoutes = function(args) {

	if (!_.isArray(args)) {
		throw new Error(Errors.RoutesMustBeArray);
	}

	for (var i = 0; i < args.length; i++) {

		if (!args[i].request_url) {
			throw new Error(Errors.RequestURLMustBeDefined);
		}

		var tmp_obj = {
			path: args[i].request_url,
			method: args[i].method ? args[i].method : 'GET'
		};
		Proxkey.Responses[tmp_obj.path] = args[i];
		Proxkey.Responses[tmp_obj.path].params = args[i].params ? args[i].params : {};

		setHandlerForRoute(args[i], function(handler) {
			tmp_obj.handler = handler;
			Proxkey.Routes.push(tmp_obj);
			if ( (i+1) == args.length ) {
				startServer();
			}
		});
	} //eo for loop

};

module.exports = Proxkey;