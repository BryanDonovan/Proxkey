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
					"type_failure": "applicaton/xml"
					"data": "./partners/test/test_doc.json",
					"data_failure": "./partners/test/test_doc.xml"
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
					"data_failure": "{data: 'Fail'}"
				}
			}
		]
	});
