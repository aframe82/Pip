var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

require('./models/database');
require('./config/passport')(passport);
// require('./utils/rtm_handler');
var auth = require('./routes/auth');
var calendars = require('./routes/calendar');
var notifications = require('./routes/notification');
var users = require('./routes/user');
var register = require('./routes/register');
var app = express();

app.disable('x-powered-by');
app.disable('Server');

app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ 
  store: new FileStore({
    path: __dirname + '/sessions'
  }),
  secret: '',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
var handlebars = require('handlebars');
var engines = require('consolidate');
app.engine('html', engines.handlebars);
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname, 'public')));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://calendar.allowpip.com');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', function(req, res) {
  res.sendStatus(200);
  // res.sendFile(__dirname + "./views/index.html");
});

app.use('/v1/auth', auth);
app.use('/v1/calendars', calendars);
app.use('/v1/notifications', notifications);
app.use('/v1/users', users);
app.use('/register', register);
app.use('/v1/events', require('./routes/event'));

app.get('/login', function(req, res) {
  return res.render('login', { 
    message: req.message
  });
});

app.post('/login', passport.authenticate('local'), function(req, res) {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/favicon.ico', function(req, res) {
  res.sendStatus(200);
});
app.get('/healthcheck', function(req, res) {
  res.sendStatus(200);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({ error_message: err });
    // res.render('error', {
    //   message: err.message,
    //   error: err
    // });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error_message: err });
  // res.render('error', {
  //   message: err.message,
  //   error: {}
  // });
});

module.exports = app;
