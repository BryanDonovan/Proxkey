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

		Proxkey.Responses[args.route_path].response.data_production.code = res.statusCode;
		Proxkey.Responses[args.route_path].response.data_production.type = res.headers['content-type'];

  		res.setEncoding('utf8');
	  	res.on('data', function (chunk) {
	    	Proxkey.Responses[args.route_path].response.data_production.data += chunk;
	  	});

	  	res.on('end', function() {
	  		cb({code: 'OK'});
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
	    }else {
	    	cb(true,null);
	    }
	});

}

function setHandlerForRoute(args, cb) {

	if (!args.response || !args.response.data) {
		throw new Error(Errors.RouteMustHaveResponseData);
	}

	//check for response file or string
	var str_data = args.response.data;
	if (str_data.substr(str_data.length - 3) == 'xml' || str_data.substr(str_data.length - 4) == 'json' ) {
		checkIfFileExsist({ path: args.response.data}, function(err, result) {
			if (err) {
				throw new Error(Errors.FileDoesntExistDataSuccess);
			}

			Proxkey.Responses[args.request_url].response.data = fs.readFileSync(result,'utf8');
		});

	}

	//Check for data to return on failure
	str_data = args.response.data_failure ? args.response.data_failure : false;
	if (str_data && (str_data.substr(str_data.length - 3) == 'xml' || str_data.substr(str_data.length - 4) == 'json')) {
		checkIfFileExsist({ path: args.response.data_failure}, function(err, result) {
			if (err) {
				throw new Error(Errors.FileDoesntExistDataFailure);
			}
			Proxkey.Responses[args.request_url].response.data_failure = fs.readFileSync(result,'utf8');
		});

		if (!Proxkey.Responses[args.request_url].response.type_failure) {
			throw new Error(Errors.RouteMustHaveResponseTypeFailure);
		}

	}

	var handler = function (request, reply) {

		console.log("Requested URL: " + request.route.path);
		var query_params = {};

		//Set query params
		if (request && (request.query || request.payload)) {
			query_params = _.isEmpty(request.query) ? request.payload : request.query;
		}

		//Check for response code (defualt is 200)
		if (!Proxkey.Responses[request.route.path] || !Proxkey.Responses[request.route.path].code) {
			Proxkey.Responses[request.route.path].response.code = 200;
		}

		if (!Proxkey.Responses[request.route.path].response.type) {
			throw new Error(Errors.RouteMustHaveResponseType);
		}
		var tmp_failure = _.find(Proxkey.Responses[request.route.path].params.failure, function(fail) {
			if (query_params && query_params[fail.key] && query_params[fail.key] == fail.value){
				return true;
			}
			return false;
		});

		var tmp_prod = _.find(Proxkey.Responses[request.route.path].params.production, function(prod) {
			if (query_params && query_params[prod.key] && query_params[prod.key] == prod.value){
				return true;
			}
			return false;
		});

		if ( !_.isEmpty(query_params) && Proxkey.Responses[request.route.path].params ) {

			//Check for params for failure validation
			if (Proxkey.Responses[request.route.path].params.failure && tmp_failure) {
				if (!Proxkey.Responses[request.route.path].response.type_failure) {
					throw new Error(Errors.RouteMustHaveResponseTypeFailure);
				}

				if (!Proxkey.Responses[request.route.path].response.code_failure) {
					Proxkey.Responses[request.route.path].response.code_failure = 200;
					//throw new Error(Errors.RouteMustHaveResponseCodeFailure);
				}

				return reply(Proxkey.Responses[request.route.path].response.data_failure)
	                .type(Proxkey.Responses[request.route.path].response.type_failure)
	                .code(Proxkey.Responses[request.route.path].response.code_failure);

			}

			//Proxy Route
			if (Proxkey.Responses[request.route.path].params.production && tmp_prod) {

				Proxkey.Responses[request.route.path].response.data_production['data'] = null;
				Proxkey.Responses[request.route.path].response.data_production['code'] = null;
				Proxkey.Responses[request.route.path].response.data_production['type'] = null;

				//Checking for production url
				if (!Proxkey.Responses[request.route.path].response.data_production) {
					throw new Error(Errors.RouteProductionMustHaveURLToProxy);
				}

				if (!Proxkey.Responses[request.route.path].response.data_production.host || !Proxkey.Responses[request.route.path].response.data_production.path || !Proxkey.Responses[request.route.path].response.data_production.port) {
					throw new Error(Errors.RouteProductionMustHaveHostPathPort);
				}

				if (Proxkey.Responses[request.route.path].response.data_production.path != Proxkey.Responses[request.route.path].path) {
					console.log(Proxkey.Responses[request.route.path].response.data_production.path);
					console.log(Proxkey.Responses[request.route.path].request_url);
					console.log('You should defined the proxy path to be the same!');
				}

				//Go and hit Production URL
				var args = {
					route_path: request.route.path,
					host: Proxkey.Responses[request.route.path].response.data_production.host,
					path: Proxkey.Responses[request.route.path].response.data_production.path,
					port: Proxkey.Responses[request.route.path].response.data_production.port,
					method: Proxkey.Responses[request.route.path].response.data_production.method ? Proxkey.Responses[request.route.path].response.data_production.method : Proxkey.Responses[request.route.path].method
				};

				proxyRoute(args,function(ret){
					if (ret.code == 'OK'){
						return reply(Proxkey.Responses[request.route.path].response.data_production.data)
							.type(Proxkey.Responses[request.route.path].response.data_production.type)
			                .code(Proxkey.Responses[request.route.path].response.data_production.code);
					}
				});

			} else {
			return reply(Proxkey.Responses[request.route.path].response.data)
				.type(Proxkey.Responses[request.route.path].response.type)
	            .code(Proxkey.Responses[request.route.path].response.code);
			}
		} else {
			return reply(Proxkey.Responses[request.route.path].response.data)
				.type(Proxkey.Responses[request.route.path].response.type)
	            .code(Proxkey.Responses[request.route.path].response.code);
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


Proxkey.Start = function(args) {


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
			method: args[i].method ? args[i].method : "GET"
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