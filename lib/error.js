var Errors = {
	"RoutesNotDefined": "Routes are not defined, I dont know what to mock or proxy to :(",
	"HostOrPortNotDefined": "Host or/and Port are not defined can't run the server.",
	"RoutesMustBeArray": "Routes must be an array, even if there's only one route",
	"RequestURLMustBeDefined": "Reqiest url must be deifined server can't response to an unknown url",
	"RouteMustHaveResponseData": "Routes must have response object which contains data to return",
	"RouteMustHaveResponseType": "Route Must have a response type!! for example application/xml or application/json etc...",
	"RouteMustHaveResponseTypeFailure": "Route Must have response type on failure as well, response.type_failure",
	"RouteMustHaveResponseCodeFailure": "Route Must have reponse code for failure, response.code_failure"
};

module.exports = Errors;
