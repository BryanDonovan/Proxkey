var Proxkey = require("proxkey");
var RoutesConfiguration = {
	"configuration": {
		"host": "localhost",
		"port": "9191",
		"log": true
	},
	"routes" : [
			{
				"request_url": "/a/b",
				"method": "POST",
				"params": {
					"failure": [
						{
							"key": "phone_num",
							"value": "9876543210"
						}
					],
					"something": [
						{
							"key": "phone_num",
							"value": "8888888888"
						}
					],
					"production": [
						{
							"key": "phone_num",
							"value": "5105105555"
						}
					]
				},
				"response": {
					"something" :{
						"type": "applicaton/xml",
						"data": "/partners/test/test_some_doc.xml",
						"code": 200
					},
					"failure" : {
						"type": "applicaton/xml",
						"data": "/partners/test/test_doc.xml",
						"code": 200
					},
					"success" : {
						"type": "application/json",
						"data": "/partners/test/test_doc.json",
						"code": 200
					},
					"production": {
						"host": "httpbin.org",
						"path": "/post",
						"port": 80
					}
				}
			},{
				"request_url": "/a/c",
				"method": "POST",
				"params": {
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
				"response": {
					"success" : {
						"type": "application/json",
						"data": "/partners/test/test_doc.json",
						"code": 200
					},
					"failure" : {
						"type": "applicaton/xml",
						"data": "/partners/test/test_doc.xml",
						"code": 404
					}
				}
			},{
				"request_url": "/say/hi",
				"method": "POST",
				"params": {
					"failure": [
						{
							"key": "name",
							"value": "ben"
						}
					]
				},
				"response": {
					"success": {
						"type": "application/json",
						"data": "{ hi: 'ben'}",
						"code": 200
					},
					"failure": {
						"type": "application/json",
						"data": "{ hi: 'Doron' }",
						"code": 409
					}
				}
			}
		]
	};
Proxkey.start(RoutesConfiguration);
