# PROXKEY

## Mock/Proxy server its your call.

## Initilize the server

var Proxkey = require('proxkey');

//Set host name, port number, options
Proxkey.setConfiguration();

//set an object that contains the routes and business logic
Proxkey.setRoutes();

//Start can get Routes and config
Proxkey.Start(Args);