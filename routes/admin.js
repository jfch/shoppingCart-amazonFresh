var express = require('express');
var router = express.Router();
var passport = require('passport');
var auth = require('../helpers/auth');
var log = require('../middleware/farm/helpers/log');
var CONST = require('../middleware/farm/values/constants');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('admin/signin');
});

router.get('/admin', auth.ensureAdminSignIn, function (req, res, next) {
    res.render('admin/admin', {req: req});
});


router.post('/', function (req, res, next) {
    passport.authenticate(CONST.LOCAL_STATEGY, function (err, user, info) {
        log.v('sign in, user = ', user, ', err = ', err, ', info = ', info);
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('admin/signin', info);
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('admin/admin');
        });
    })(req, res, next);
});


var _id_pro = 3; //database
var _id_cus = 3; //database
var productList = [
    {
        "_id": "1",
        "ProductID": "10", "FarmerID": "11", "Name": "apple",
        "Price": "5", "Description": "organic", "Review": "Good", "Rating": "2"
    },
    {
        "_id": "2",
        "ProductID": "20", "FarmerID": "21", "Name": "peach",
        "Price": "8", "Description": "organic", "Review": "Perfect", "Rating": "5"
    },
];

var customerList = [
    {
        "_id": "1",
        "CustomerID": "10", "Email": "11",
        "FirstName": "apple", "LastName": "5",
        "Address": "organic", "City": "Good", "State": "2",
        "ZipCode": "10", "PhoneNumber": "11", "CardNumber": "apple"
    },
    {
        "_id": "2",
        "CustomerID": "10", "Email": "11",
        "FirstName": "apple", "LastName": "5",
        "Address": "organic", "City": "Good", "State": "2",
        "ZipCode": "10", "PhoneNumber": "11", "CardNumber": "apple"
    },
];

router.get('/getProductList', function (req, res, next) {
    console.log("------");
    res.send(productList);
});
router.get('/getCustomerList', function (req, res, next) {
    console.log("------");
    res.send(customerList);
});

router.post('/postproduct', function (req, res, next) {


    //console.log(req.body.data);
    var newProduct = req.body.data;

    var productID = newProduct.ProductID;
    var farmerID = newProduct.FarmerID;
    var name = newProduct.Name;
    var price = newProduct.Price;
    var description = newProduct.Description;
    var review = newProduct.Review;
    var rating = newProduct.Ratings;

    //////////////////////save new product to the database
    newProduct._id = _id_pro++;
    //send back the saved record
    console.log(newProduct);
    res.send(newProduct);
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});

});
router.post('/postcustomer', function (req, res, next) {


    //console.log(req.body.data);
    var newCustomer = req.body.data;

    var CustomerID = newCustomer.CustomerID;
    var Email = newCustomer.Email;
    var FirstName = newCustomer.FirstName;
    var LastName = newCustomer.LastName;


    var Address = newCustomer.Address;
    var City = newCustomer.City;
    var State = newCustomer.State;

    var ZipCode = newCustomer.ZipCode;
    var PhoneNumber = newCustomer.PhoneNumber;
    var CardNumber = newCustomer.CardNumber;

    //////////////////////save new customer to the database
    newCustomer._id = _id_cus++;
    //send back the saved record
    console.log(newCustomer);
    res.send(newCustomer);
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});

});

router.post('/modifyproduct', function (req, res, next) {

    //console.log(req.body.data);
    var newProduct = req.body.data;

    var productID = newProduct.ProductID;
    var farmerID = newProduct.FarmerID;
    var name = newProduct.Name;
    var price = newProduct.Price;
    var description = newProduct.Description;
    var review = newProduct.Review;
    var rating = newProduct.Rating;
    //////////////////////save the modified product information to the database

    //send back the saved record
    console.log(newProduct);
    res.send(newProduct);
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});

});

router.post('/modifycustomer', function (req, res, next) {

    //console.log(req.body.data);
    var newCustomer = req.body.data;

    var CustomerID = newCustomer.CustomerID;
    var Email = newCustomer.Email;
    var FirstName = newCustomer.FirstName;
    var LastName = newCustomer.LastName;

    var Address = newCustomer.Address;
    var City = newCustomer.City;
    var State = newCustomer.State;

    var ZipCode = newCustomer.ZipCode;
    var PhoneNumber = newCustomer.PhoneNumber;
    var CardNumber = newCustomer.CardNumber;

    //////////////////////save new customer to the database

    //send back the saved record
    console.log(newCustomer);
    res.send(newCustomer);
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});

});

router.post('/deleteproduct', function (req, res, next) {
    //console.log(req.body.data);
    var toDeleteId = req.body.data;
    console.log(toDeleteId)
    //////////////////////delete the product in the database

    //send back the saved record
    res.send("ok");
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});
});

router.post('/deletecustomer', function (req, res, next) {
    //console.log(req.body.data);
    var toDeleteId = req.body.data;
    console.log(toDeleteId)
    //////////////////////delete the customer in the database

    //send back the saved record
    res.send("ok");
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});
});


var _tid = 3; //database
var tripList = [
    {
        "_tid": "1",
        "TripID": "123",
        "PickupLocation": "San Jose",
        "DropoffLocation": "Davis",
        "Date": "05-01-16",
        "CustomerID": "411",
        "DriverID": "511",
        "TruckID": "611"
    },
    {
        "_tid": "2",
        "TripID": "223",
        "PickupLocation": "New York",
        "DropoffLocation": "Charleston",
        "Date": "05-11-16",
        "CustomerID": "412",
        "DriverID": "512",
        "TruckID": "612"
    },
];

router.get('/getTripList', function (req, res, next) {
    console.log("------");
    res.send(tripList);
});

router.post('/posttrip', function (req, res, next) {


    //console.log(req.body.data);
    var newTrip = req.body.data;

    var tripID = newTrip.TripID;
    var pickupLocation = newTrip.PickupLocation;
    var dropoffLocation = newTrip.DropoffLocation;
    var date = newTrip.Date;
    var customerID = newTrip.CustomerID;
    var driverID = newTrip.DriverID;
    var truckID = newTrip.TruckID;

    //////////////////////save new product to the database
    newTrip._tid = _tid++;
    //send back the saved record
    console.log(newTrip);
    res.send(newTrip);
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});

});

router.post('/modifytrip', function (req, res, next) {


    //console.log(req.body.data);
    var newTrip = req.body.data;

    var tripID = newTrip.TripID;
    var pickupLocation = newTrip.PickupLocation;
    var dropoffLocation = newTrip.DropoffLocation;
    var date = newTrip.Date;
    var customerID = newTrip.CustomerID;
    var DriverID = newTrip.DriverID;
    var TruckID = newTrip.TruckID;

    //////////////////////save the modified product information to the database

    //send back the saved record
    console.log(newTrip);
    res.send(newTrip);
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});

});

router.post('/deletetrip', function (req, res, next) {
    //console.log(req.body.data);
    var toDeleteId = req.body.data;
    console.log(toDeleteId)
    //////////////////////delet the product in the database

    //send back the saved record
    res.send("ok");
    //res.sendJSON(newProduct);
    //res.render('admin/admin', {newProduct: newProduct, status: status});
});

router.post('/searchCustomer', function (req, res, next) {
    var search = req.body.data;

    var myCustomerOption = search.myCustomerOption;
    var searchInput = search.searchInput;
    var sortOption = search.sortOption;
    var pageOption = search.pageOption;

    console.log(search);

    // check if there exists matching records

    var returnValue = {};
    res.send(returnValue);
});

router.post('/searchFarmer', function (req, res, next) {
    var search = req.body.data;

    var myFarmerOption = search.myFarmerOption;
    var searchInput = search.searchInput;
    var sortOption = search.sortOption;
    var pageOption = search.pageOption;

    console.log(search);
    var returnValue = {};
    res.send(returnValue);
});

router.post('/searchProduct', function (req, res, next) {
    var search = req.body.data;

    var myProductOption = search.myProductOption;
    var searchInput = search.searchInput;
    var sortOption = search.sortOption;
    var pageOption = search.pageOption;

    console.log(search);
    var returnValue = {};
    res.send(returnValue);
});

router.post('/searchBilling', function (req, res, next) {
    var search = req.body.data;

    var myBillingOption = search.myBillingOption;
    var searchInput = search.searchInput;
    var sortOption = search.sortOption;
    var pageOption = search.pageOption;

    console.log(search);
    var returnValue = {};
    res.send(returnValue);
});

router.post('/searchTrip', function (req, res, next) {
    var search = req.body.data;

    var myTripOption = search.myTripOption;
    var searchInput = search.searchInput;
    var sortOption = search.sortOption;
    var pageOption = search.pageOption;

    console.log(search);
    var returnValue = {
        "_tid": "2",
        "TripID": "223",
        "PickupLocation": "New York",
        "DropoffLocation": "Charleston",
        "Date": "05-11-16",
        "CustomerID": "412",
        "DriverID": "512",
        "TruckID": "612"
    };
    res.send(returnValue);
});

router.post('/areaInRevenue', function (req, res, next) {
    var area = req.body.data;

    var areaOption = area;
    console.log(area);
    res.send(areaOption);
});

router.post('/rideInViewRide', function (req, res, next) {
    var option = req.body.data;

    var rideOption = option;
    console.log(option);
    res.send(rideOption);
});

router.post('/tripInViewTrip', function (req, res, next) {
    var option = req.body.data;

    var viewTripOption = option;
    console.log(option);
    res.send(viewTripOption);
});

//Farmer admin module
var FarmerlList = [
    {
        "farmerID": "a",
        "firstName": "b",
        "lastName": "c",
        "address": "d",
        "state": "e",
        "city": "f",
        "zip": "g",
        "phone": "h",
        "email": "i",
        "reviews": "j",
        "introduction": "k",
        "deliveryHistory": "l"
    }
];

router.get('/getFarmerList', function (req, res, next) {
    console.log("------");
    res.send(FarmerlList);
});

router.post('/addFarmer', function (req, res, next) {
    var newfarmer = req.body.data;

    if (newfarmer.farmerID != "a") {
        var da = {"statecode": "ok"};
        res.send(da);

    } else {
        var da = {"statecode": "exists"};
        res.send(da);
    }
});

router.post('/modifyFarmer', function (req, res, next) {
    var modifiedfarmer = req.body.data;
    if (modifiedfarmer.farmerID != "jake") {
        res.send(modifiedfarmer);
    }
});

router.post('/deleteFarmer', function (req, res, next) {
    var defarmer = req.body.data;
    res.send(defarmer);
});

//Billing Module
//farmer admin module
var billingList = [
    {
        "BillingID": "a",
        "Date": "b",
        "E_D_T": "c",
        "ProductID": "d",
        "Distance_C": "e",
        "Total_AFR": "f",
        "Source_location": "g",
        "Destination_location": "h",
        "DriverID": "i",
        "CustomerID": "j"
    }];

router.get('/getBillingList', function (req, res, next) {
    console.log("------");
    res.send(billingList);
});

router.post('/addBilling', function (req, res, next) {
    var newbilling = req.body.data;

    if (newbilling.BillingID != "a") {
        var da = {"statecode": "ok"};
        res.send(da);

    } else {
        var da = {"statecode": "exists"};
        res.send(da);
    }
});

router.post('/modifyBilling', function (req, res, next) {
    var modifiedbilling = req.body.data;
    if (modifiedbilling.BillingID != "jake") {
        res.send(modifiedbilling);
    }
});

router.post('/deleteBilling', function (req, res, next) {
    var debilling = req.body.data;
    res.send(debilling);
});
module.exports = router;