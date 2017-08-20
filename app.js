var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require("connect-mongo")(session);
var passport = require('passport');

var routes = require('./routes/index');
var welcome = require('./routes/welcome');
var signin = require('./routes/signin');
var signup = require('./routes/signup');
var farmer = require('./routes/farmer');
var productManage = require('./routes/productManage');
var signInCart = require('./routes/signInCart');
var product = require('./routes/product');
var shoppingCartView = require('./routes/shoppingCartView');
var previewOrder = require('./routes/previewOrder');
var confirmOrder = require('./routes/confirmOrder');
var allOrders = require('./routes/allOrders');
var orderDetails = require('./routes/orderDetails');
var users = require('./routes/users');
var log = require('./middleware/farm/helpers/log');
var admin = require('./routes/admin');
var productlist = require('./routes/productlist');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('jade', require('jade').__express);
app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: '1c8607ad-4484-493b-85b2-bb5949051e38',
    resave: false,  //don't save session if unmodified
    saveUninitialized: false,	// don't create session until something stored
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    store: new mongoStore({
        url: 'mongodb://localhost:27017/amazon'
    })
}));
app.use(function(req, res, next){
	
	res.locals.user = req.session.passport? req.session.passport.user:{};
	
	
	next();
	});
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/welcome', welcome);
app.use('/signin', signin);
app.use('/signInCart', signInCart);
app.use('/shoppingCartView', shoppingCartView);
app.use('/previewOrder', previewOrder);
app.use('/confirmOrder', confirmOrder);
app.use('/allOrders', allOrders);
app.use('/orderDetails', orderDetails);
app.use('/product', product);
app.use('/signup', signup);
app.use('/signout', require('./routes/signout'));
app.use('/api', require('./routes/api'));
app.use('/admin', admin);
app.use('/farmer', farmer);
app.use('/productmanage', productManage);
app.use('/users', users);
app.use('/productlist', productlist);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    // var err = new Error('Not Found');
    // err.status = 404;
    // next(err);
    res.status(404);
    res.send('not found');
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        log.e(err.stack);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
module.exports.log = true;
