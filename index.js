var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var url = require('url');
var app = express();
var port = process.env.PORT || 8080;
var util = require('./util/util.js');

var adminFile = './twilio-data/admin.json';
var pointsFile = './twilio-data/points.json';
var teamsFile = './twilio-data/teams.json';
var questionsFile = './twilio-data/questions.json';

var password = 'cityc16!'; // used for receiving/answering questions

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
// allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/admin', function (req, res) {
  res.json(JSON.parse(fs.readFileSync(adminFile, 'utf8')));
});

app.get('/points', function (req, res) {
  res.json(JSON.parse(fs.readFileSync(pointsFile, 'utf8')));
});

app.get('/teams', function (req, res) {
  res.json(JSON.parse(fs.readFileSync(teamsFile, 'utf8')));
});

app.get('/questions', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  if (query.password != password) {
    res.status(403).send('access denied');
  } else {
    res.json(JSON.parse(fs.readFileSync(questionsFile, 'utf8')));
  }
});

app.post('/sms', function(req, res) {
  // console.log(req);
  var twilioResponse = util.runCommandFromInput(req.body);
  res.writeHead(200, {
    'Content-Type':'text/xml'
  });
  console.log(twilioResponse);
  res.end(twilioResponse);
});

app.post('/answerquestions', function(req, res) {
  if (req.body.password != password) {
    res.status(401).send('wrong password');
  } else {
    util.sendAnswers(req.body.answers);
    res.send('success!');
  }
});

var server = app.listen(port, function (cb) {
  var port = server.address().port;
  console.log('Listening on port http://localhost:%s', port);
});
