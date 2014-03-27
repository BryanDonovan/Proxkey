var Proxkey = require('proxkey').proxkey;
Proxkey.Start({
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
					"data": "{data: 'success'}",
					"data_faile": "{data: 'Fail'}"
				}
			},{
				request_url: "/b/c",
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
					"data": "{data: 'success'}",
					"data_faile": "{data: 'Fail'}"
				}
			}
		]
	});
