var express = require('express');
var client = require('../rpc/client');
var router = express.Router();

var _id_pro = 3; //database

var productList = [
    {
        "_id": "1",
        //"ProductID":"10", "FarmerID":"11",
        "name": "apple",
        "price": "5", "description": "organic",
        //"Review":"Good", "Rating":"2"
    },
    {
        "_id": "2",
        // "ProductID":"20", "FarmerID":"21",
        "name": "peach",
        "price": "8", "description": "organic",
        //"Review":"Perfect", "Rating":"5"
    },
];

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('productManage', {req: client.extract(req)});
});
//
// router.get('/getProductList', function (req, res, next) {
//     console.log("------");
//     res.send(productList);
// });
//
//
// router.post('/postproduct', function (req, res, next) {
//
//
//     //console.log(req.body.data);
//     var newProduct = req.body.data;
//
//     //var productID = newProduct.ProductID;
//     //var farmerID = newProduct.FarmerID;
//     var name = newProduct.Name;
//     var price = newProduct.Price;
//     var description = newProduct.Description;
//     //var review = newProduct.Review;
//     //var rating = newProduct.Ratings;
//
//     //////////////////////save new product to the database
//     newProduct._id = _id_pro++;
//     //send back the saved record
//     console.log(newProduct);
//     res.send(newProduct);
//     //res.sendJSON(newProduct);
//     //res.render('admin/admin', {newProduct: newProduct, status: status});
//
// });
//
//
// router.post('/modifyproduct', function (req, res, next) {
//
//     //console.log(req.body.data);
//     var newProduct = req.body.data;
//
//     //var productID = newProduct.ProductID;
//     //var farmerID = newProduct.FarmerID;
//     var name = newProduct.Name;
//     var price = newProduct.Price;
//     var description = newProduct.Description;
//     //var review = newProduct.Review;
//     //var rating = newProduct.Rating;
//     //////////////////////save the modified product information to the database
//
//     //send back the saved record
//     console.log(newProduct);
//     res.send(newProduct);
//     //res.sendJSON(newProduct);
//     //res.render('admin/admin', {newProduct: newProduct, status: status});
//
// });
//
// router.post('/deleteproduct', function (req, res, next) {
//     //console.log(req.body.data);
//     var toDeleteId = req.body.data;
//     console.log(toDeleteId)
//     //////////////////////delete the product in the database
//
//     //send back the saved record
//     res.send("ok");
//     //res.sendJSON(newProduct);
//     //res.render('admin/admin', {newProduct: newProduct, status: status});
// });


module.exports = router;
