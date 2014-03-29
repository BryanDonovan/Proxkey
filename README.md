# PROXKEY

## Mock/Proxy server its your call.
## Options:
	1. You can mock a successful response
	2. You can mock a failure response
	3. You can proxy the request to any url you want and get back the response.

## Why? or When to use?

	Lets say you have to Mock a response for testing purposes, or you want to hit production but want zero's changes in your code.

## How

### In order to start the proxy (You can always check the example).

	var Proxkey = require('proxkey');
	var ConfigJson = {
		configuration: {
			host: 'localhost',
			port: '9191'
		},
		routes : [
				{
					request_url: "/a/b",
					method: "POST",
					params: {
						"failure": [
							{
								"key": "phone_num",
								"value": "9876543210"
							}
						]
					},
					response: {
						"type": "application/json",
						"type_failure": "applicaton/xml",
						"data": "./partners/test/test_doc.json",
						"data_failure": "./partners/test/test_doc.xml",
						"code": 200,
						"code_failure": 404
					}
				},{
					request_url: "/a/c",
					method: "POST",
					params: {
						"failure": [
							{
								"key": "phone_num",
								"value": "9876543210"
							},{
								"key": "phone_num",
								"value": "123123123"
							}
						]
					},
					response: {
						"type": "application/json",
						"type_failure": "applicaton/xml",
						"data": "./partners/test/test_doc.json",
						"data_failure": "./partners/test/test_doc.xml",
						"code": 200,
						"code_failure": 404
					}
				}
			]
		}
	};
	Proxkey.Start(ConfigJson);

	** You can always have a json file ready and than just use `require('ProxyConfig.json');

## Good Luck!
