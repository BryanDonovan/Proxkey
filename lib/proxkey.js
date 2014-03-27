'use strict';

var Proxkey = {},
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

	Example:
	{
		"request_url": "/Services/com/cingular/csi/cam/InquireAccountProfile",
		"method": "POST",
		"params": {
			"failure": [{"key": "phone_num", "value": "123123123"}]
		},
		"response": {
			"type": "application/xml",
			"header": ["header-key","some-header-value"],
			"data": "./att/csi_iap_prod.xml",
			"data_fail": "./att/csi_iap_non_success_result.xml"
		}
	}
*/

/*
	Set Proxy Configuration
*/
Proxkey.setConfiguration = function(args) {

	Proxkey.Config.PORT = args.port ? args.port : 9191;
	Proxkey.Config.HOST = args.host ? args.host : 'localhost';
};



function setHandlerForRoute(args, cb) {

	if (!args.response || !args.response.data) {
		throw new Error(Errors.RouteMustHaveResponseData);
	}

	//check for response file or string
	if (args.response.data.charAt(0) === '.' && args.response.data.charAt(1) === '/') {
		Proxkey.Responses[request_url].data = fs.readFileSync(args.response.data,'utf8');
	}

	//Check for data to return on failure
	if (args.response.data_failure && args.response.data_failure.charAt(0) === '.' && args.response.data_failure.charAt(0) === '/' ) {
		Proxkey.Responses[request_url].data_failure = fs.readFileSync(args.response.data_failure,'utf8');
	}

	var handler = function (request, reply) {

		console.log("Requested URL: " + request.route.path);

		var query_params = {};

		//Set query params
		if (request && (request.query || request.payload)) {
			query_params = request.query ? request.query : request.payload;
		}

		console.log(Proxkey.Responses[request.route.path]);
		//Check for response code (defualt is 200)
		if (!Proxkey.Responses[request.route.path] || !Proxkey.Responses[request.route.path].code) {
			console.log('code is not defined');
			Proxkey.Responses[request.route.path].response.code = 200;
			console.log(Proxkey.Responses[request.route.path].response.code);
		}

		if (!Proxkey.Responses[request.route.path].response.type) {
			throw new Error(Errors.RouteMustHaveResponseType);
		}


		//Check for params for failure validation
		if ( !_.isEmpty(query_params) && Proxkey.Responses[request.route.path].params && Proxkey.Responses[request.route.path].params.failure) {

			if (!Proxkey.Responses[request.route.path].response.type_failure) {
				throw new Error(Errors.RouteMustHaveResponseTypeFailure);
			}

			var tmp = _.find(Proxkey.Responses[request.route.path].params.failure, function(fail) {
				return fail.value;
			});

			if (!_.isEmpty(tmp)) {
				return reply(Proxkey.Responses[request.route.path].data_fail)
                           	.type(Proxkey.Responses[request.route.path].response.type_failure)
                            .code(Proxkey.Responses[request.route.path].response.code);
			}
		}
		return reply(Proxkey.Responses[request.route.path].response.data)
				.type(Proxkey.Responses[request.route.path].response.type)
                .code(Proxkey.Responses[request.route.path].response.code);

	};

	cb(handler);
}

function startServer(){

	var options = {
        cors: true
    };

	//Start Server
	var server = Hapi.createServer(Proxkey.Config.HOST, Proxkey.Config.PORT,options);
	console.log(Proxkey.Responses);
    server.route(Proxkey.Routes);
    server.start();
    console.log('Proxkey is running on ' + 'http://' + Proxkey.Config.HOST + ':' + Proxkey.Config.PORT);
}

/*
	args = {
		configuration: {
			host: 'localhost',
			port: 9090
		},
		routes : [
			{
				request_url: "/a/b",
				method: "POST",
				params: {
					"failure": [
						{
							"key": "SOME KEY, phone_num",
							"value": "SOME VALUE, 9876543210"
						}
					]
				},
				response: {
					"type": "application/xml",
					"data": "./partners/att/some_file.xml",
					"data_faile": "./partners/att/some_other_file.xml"
				}
			}
		]
	}
*/
Proxkey.Start = function(args) {

	// if args.configuration is defined
	if (!args.configuration.port || !args.configuration.host) {
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
				console.log(Proxkey.Routes);
				startServer();
			}
		});

	} //eo for loop

};


module.exports = Proxkey;