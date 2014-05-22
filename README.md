# PROXKEY

## RELEASE NOTES
	- Adding replace object with key & value so now we can change the value on the response automatically by the request.

## Mock/Proxy server its your call.
	Proxkey will Mock or Proxy your REST or SOAP request.
	When to use: let's say you need to test an integration to your system.
	- Easy to specify speicific response for specific request.
	- Rest Example:
		- Requset: "bob": [ { "key": "phone_num", "value": "9876543210" } ]
		- Response (JSON): "bob" :{ "type": "applicaton/json", "data": "{data: 'bob'}", "code": 200 }
		- Response (XML): "bob" :{ "type": "applicaton/xml", "data": "<root><data>bob</data></root>", "code": 200}
	- SOAP Example:
		- Requset: "bob": [{ "key": "root->data->name", "value": "bob" }] 
		- Response (JSON): "bob" :{ "type": "applicaton/json", "data": "{data: 'bob'}", "code": 200 }
		- Response (XML): "bob" :{ "type": "applicaton/xml", "data": "<root><data>bob</data></root>", "code": 200}
## Options:
	1. You can mock a successful response
	2. You can mock a failure response
	3. You can proxy the request to any url you want and get back the response.

## Why? or When to use?

	Lets say you have to Mock a response for testing purposes, or you want to hit production but want zero's changes in your code.

## How

### In order to start the proxy (You can always check the example).
<pre><code>
var Proxkey = require("proxkey");
var RoutesConfiguration = {
	"configuration": {
		"host": "localhost",
		"port": "9091",
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
				"request_url": "/xml/a",
				"method": "POST",
				"params": {
					"failure": [
						{
							"key": "xmlFirstChild->xmlSecondChild",
							"value": "9876543210"
						}
					],
					"something": [
						{
							"key": "xmlFirstChild->xmlSecondChild",
							"value": "8888888888"
						}
					]
				},
				"response": {
					"something" :{
						"type": "applicaton/json",
						"data": "{\"data\": \"something\"}",
						"code": 201
					},
					"failure" : {
						"type": "applicaton/json",
						"data": "{\"data\": \"failure\"}",
						"code": 401
					},
					"success" : {
						"type": "application/json",
						"data": "{\"data\": \"success\"}",
						"code": 200
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
</pre></code>

## Good Luck!
