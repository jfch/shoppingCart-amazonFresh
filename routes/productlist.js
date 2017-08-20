var express = require('express');
var router = express.Router();

var productList = [
             	                 {"id":"1","name":"veg1", "price":"11"},
            	                 {"id":"2","name":"veg1", "price":"12"},
            	                 {"id":"3","name":"veg1","price": "13"},
            	                 {"id":"4","name":"veg1", "price":"14"},
            	                 {"id":"5","name":"veg1", "price":"15"},
            	                 {"id":"6","name":"veg1","price": "16"},
            	                 {"id":"7","name":"veg1", "price":"17"},
            	                 {"id":"8","name":"veg1", "price":"18"},
            	                 {"id":"9","name":"veg1","price": "19"}
            	             ]; 

router.get('/', function(req, res, next) {
	console.log("------");
	res.send(productList);
});

module.exports = router;