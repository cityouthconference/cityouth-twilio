var twilio = require('twilio');
var fs = require('fs');

var ACCOUNT_SID = process.env.ACCOUNT_SID;
var AUTH_TOKEN = process.env.AUTH_TOKEN
var TWILIO_NUMBER = process.env.TWILIO_NUMBER;
var adminFile = './data/admin.json';
var leaderPhoneNumberFile = './data/leaderphonenumbers.json';
var servingPhoneNumberFile = './data/servingphonenumbers.json';
var phoneNumberFile = './data/phonenumbers.json';
var scheduleFile = './data/schedule.csv';
var teamsFile = './data/teams.json';
var pointsFile = './data/points.json';
var backupPointsFile = './data/points_backup.json';
var helpFile = './data/help.json';
var questionsFile = './data/questions.json';

var client = new twilio.RestClient(ACCOUNT_SID, AUTH_TOKEN);

var phoneNumberRegex = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;

/*
  These are the main functions that will run the commands the user inputs.
  Each function will take in 2 paramaters: param and phoneNumber

  @param param: Array of the words in the text message AFTER the first word
  @param phoneNUmber: phoneNumber of the person texting
*/

var hi = function(param, phoneNumber){
  resp = new twilio.TwimlResponse();
  if (param.length == 0) {
    resp.message(
      "Hello! Type one of these available commands:\n \
      \nevent \nnextevent \npoints \nteam \nquestion \nadmin \
      \n\nIf you need help, type 'help' followed by the command."
    );
  }
  else if(param.length == 1 && param[0].toLowerCase() == 'admin'){
    resp.message(
      "Hello! Type one of these available commands: \n\naddpoints \naddnumber \
      \nremovenumber \naddadmin \nremoveadmin \nsendmessage \nsendadminmessage \nsendleadermessage \nsendServingMessage\
      \n\nIf you need help, type 'help' followed by the command."
    );
  } else {
      var command = param[0].toLowerCase();
      var helpObj = JSON.parse(fs.readFileSync(helpFile, 'utf8'));
      var message = helpObj[command];
      if (!message) resp.message('the command ' + command + ' was not found. Please try again.');
      else resp.message(message);
  }
  return resp.toString();
}

var admin = function(param, phoneNumber){
  console.log('admin function');
  resp = new twilio.TwimlResponse();

  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you are not an admin.');
  } else {
    resp.message("Here are the commands for admin: \naddpoints, \nchangeteamname, \naddadmin, \nremoveadmin, \nsendmessage, \n"
      + 'sendadminmessage, \nsendleadermessage, \nsendservingMessage.\nIf you need help, type "help" followed by the command.');
  }
  return resp.toString();
}

var getPoints = function(param) {
  console.log('getting points', param);
  resp = new twilio.TwimlResponse();
  var obj = JSON.parse(fs.readFileSync(pointsFile, 'utf8'));

  if(param.length == 1){
      var team = param[0].toLowerCase();
      console.log("team is " + team);
      if(team in obj){
        var points = obj[team];
        resp.message(param[0] + ' has ' + points + ' points');
      } else {
        var teams = Object.keys(obj).reduce(function(s,v) {return s+', '+v});
        resp.message(param + ' team is not found. Please choose ' + teams)
      }
  }
  else if(param == ''){
    var msg = '';
    for(var key in obj){
      msg = msg + key + ' has ' + obj[key] + ' points \n';
    }
    console.log(msg);
    resp.message(msg);
  }
  else{
      resp.message(param + ' team is not found');
  }
  return resp.toString();
}

var addPoints = function(param, phoneNumber) {
  console.log('adding points', param);
  resp = new twilio.TwimlResponse();
  var obj = JSON.parse(fs.readFileSync(pointsFile, 'utf8'));
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  } else if(param.length == 2){
      var team = param[0];
      var points = param[1];
      if(!(team in obj)){
          var teams = Object.keys(obj).reduce(function(s,v) {return s+', '+v});
          resp.message(param + ' team is not found. Please choose ' + teams);
      }
      else if(Number(points) == NaN){
          resp.message(points + ' is not a number');
      }
      else{
          numPoints = Number(points);
          obj[team] +=numPoints;
          var newPoints = obj[team];
          var jsonString = JSON.stringify(obj, null, 2);
          console.log('new json: '  + jsonString);
          fs.writeFileSync(pointsFile, jsonString);
          var operation = '';
          if(numPoints > 0){
              operation = 'added';
          }
          else{
              operation = 'subtracted';
              numPoints = Math.abs(numPoints);
          }
          resp.message(operation + ' ' + numPoints + ' points to ' + team + ' team, ' + team + ' team now has ' + newPoints + ' points');
      }
  }
  else{
      resp.message('wrong format, should be: addpoints [team] [points]');
  }
  return resp.toString();
}

var getTeam = function(param) {
  console.log('getting team', param);
  resp = new twilio.TwimlResponse();
  var obj = JSON.parse(fs.readFileSync(teamsFile, 'utf8'));
  if (param.length == 0) {
    resp.message('Please type the persons name! Text "team [NAME]"');
  } else {
    var name = param.join(' ').toLowerCase();
    var team = obj[name];
    if (team) {
      resp.message(name + ' belongs to team ' + team + '.');
    } else {
      // try to find by first name
      var firstName = param[0];
      var possibleNames = Object.keys(obj).filter(function(name) {

        return name.toLowerCase().indexOf(firstName.toLowerCase()) != -1;
      }).map(function(name) { return name + ': team ' + obj[name]; })
        .join(",\n");
      console.log(possibleNames);
      resp.message('These are the names that matched ' + firstName + ": \n" + possibleNames);
    }
  }
  return resp.toString();
}

var changeTeamName = function(param, phoneNumber) {
  console.log('getting team', param);
  resp = new twilio.TwimlResponse();
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  }
  else if(param.length == 2){
    var obj = JSON.parse(fs.readFileSync(pointsFile, 'utf8'));
    var oldName = param[0];
    var newName = param[1];

    if(!(oldName in obj)){
        resp.message(oldName + ' team is not found');
    }
    else{
        var value = obj[oldName];
        obj[newName] = value;
        delete obj[oldName];
        if(newName in obj){
            var jsonString = JSON.stringify(obj, null, 2);
            console.log('new json: '  + jsonString);
            fs.writeFileSync(pointsFile, jsonString);
            resp.message('team ' + oldName + ' changed to ' + newName);
        }
        else{
            resp.message('team name change failed');
        }
    }
  }
  else{
      resp.message('Sorry, wrong format. Please enter in this format teanname [oldname] [newname]');
  }
  return resp.toString();
}

// adds phone numbers as admin
var addAdmin = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  var obj = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
  console.log(obj);
  var admins = obj.ADMIN;
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  } else if (param.length == 0){
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'addadmin [NUMBER] [NUMBER]... etc.');
  } else {
    // validate phone number
    param.forEach(function(number) {
      var match = number.match(phoneNumberRegex);
      if (!match) {
        resp.message('Sorry, the number '+number+' you entered is not a valid phone number.');
      } else {
        // always add +1 to the phone number, assuming all numbers are from Canada
        var validNumber = '+1'+match[2]+match[3]+match[4];
        if (admins.indexOf(validNumber) > -1) {
          resp.message('The number '+number+' is already an admin.');
        } else {
          admins.push(validNumber);
          console.log('number added: '+validNumber);
          fs.writeFileSync(adminFile, JSON.stringify(obj, null, 2));
          resp.message('added '+number+' as an admin.');
        }
      }
    });
  }

  return resp.toString();
}

// removes phone numbers that are admins
var removeAdmin = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  var obj = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
  console.log(obj);
  var admins = obj.ADMIN;
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  } else if (param.length == 0) {
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'removeadmin [NUMBER] [NUMBER]... etc.');
  } else {
    // validate phone number
    param.forEach(function(number) {
      var match = number.match(phoneNumberRegex);
      if (!match) {
        resp.message('Sorry, the number '+number+' you entered is not a valid phone number.');
      } else {
        // always add +1 to the phone number, assuming all numbers are from Canada
        var validNumber = '+1'+match[2]+match[3]+match[4];
        var index = admins.indexOf(validNumber);
        if (index == -1) {
          resp.message('The number '+number+' is not an admin.');
        } else {
          admins.splice(index, 1);
          console.log('number removed: '+validNumber);
          fs.writeFileSync(adminFile, JSON.stringify(obj));
          resp.message('removed '+number+' as an admin.');
        }
      }
    });
  }
  return resp.toString();
}

// sends a global message to everyone subscribed
var sendMessage = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  } else if (param.length == 0) {
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'sendmessage [MESSAGE]');
  } else {
    var message = param.join(' ');
    console.log('message: '+message);
    var obj = JSON.parse(fs.readFileSync(phoneNumberFile, 'utf8'));
    var phoneNumberErrors = []; // to store the errors of the phone numbers

    obj.PHONE_NUMBERS.forEach(function(number) {
      try {
        sendTextMessage(message, number);
      } catch(err) {
        console.log('uh oh! caught an error...');
        phoneNumberErrors.push(err);
      }
    });

    if (phoneNumberErrors.length > 0) {
      resp.message('Could not send to the following phone numbers: '+phoneNumberErrors);
    } else {
      resp.message('Message sent successfully! This is what you sent: "'+message+'"');
    }
  }
  return resp.toString();
}

// sends a global message to team leaders subscribed
var sendLeaderMessage = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  } else if (param.length == 0) {
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'sendmessage [MESSAGE]');
  } else {
    var message = param.join(' ');
    console.log('message: '+message);
    var obj = JSON.parse(fs.readFileSync(leaderPhoneNumberFile, 'utf8'));
    var phoneNumberErrors = []; // to store the errors of the phone numbers

    obj.LEADER_PHONE_NUMBERS.forEach(function(number) {
      try {
        sendTextMessage(message, number);
      } catch(err) {
        console.log('uh oh! caught an error...');
        phoneNumberErrors.push(err);
      }
    });

    if (phoneNumberErrors.length > 0) {
      resp.message('Could not send to the following phone numbers: '+phoneNumberErrors);
    } else {
      resp.message('Message sent successfully! This is what you sent: "'+message+'"');
    }
  }
  return resp.toString();
}

// sends a global message to serving team subscribed
var sendServingMessage = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  } else if (param.length == 0) {
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'sendmessage [MESSAGE]');
  } else {
    var message = param.join(' ');
    console.log('message: '+message);
    var obj = JSON.parse(fs.readFileSync(servingPhoneNumberFile, 'utf8'));
    var phoneNumberErrors = []; // to store the errors of the phone numbers

    obj.SERVING_PHONE_NUMBERS.forEach(function(number) {
      try {
        sendTextMessage(message, number);
      } catch(err) {
        console.log('uh oh! caught an error...');
        phoneNumberErrors.push(err);
      }
    });

    if (phoneNumberErrors.length > 0) {
      resp.message('Could not send to the following phone numbers: '+phoneNumberErrors);
    } else {
      resp.message('Message sent successfully! This is what you sent: "'+message+'"');
    }
  }
  return resp.toString();
}

// sends a global message to admins subscribed
var sendAdminMessage = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  if (!isAdmin(phoneNumber)) {
    resp.message('Sorry, you cannot use this command, since you are not an admin.');
  } else if (param.length == 0) {
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'sendmessage [MESSAGE]');
  } else {
    var message = param.join(' ');
    console.log('message: '+message);
    var obj = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
    var phoneNumberErrors = []; // to store the errors of the phone numbers

    obj.ADMIN.forEach(function(number) {
      try {
        sendTextMessage(message, number);
      } catch(err) {
        console.log('uh oh! caught an error...');
        phoneNumberErrors.push(err);
      }
    });

    if (phoneNumberErrors.length > 0) {
      resp.message('Could not send to the following phone numbers: '+phoneNumberErrors);
    } else {
      resp.message('Message sent successfully! This is what you sent: "'+message+'"');
    }
  }
  return resp.toString();
}

// adds phone numbers to phonenumbers.json
var addNumber = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  var obj = JSON.parse(fs.readFileSync(phoneNumberFile, 'utf8'));
  var numberList = obj.PHONE_NUMBERS;
  if (param.length == 0){
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'addnumber [NUMBER] [NUMBER]... etc.');
  } else {
    // validate phone number
    param.forEach(function(number) {
      var match = number.match(phoneNumberRegex);
      if (!match) {
        resp.message('Sorry, the number '+number+' you entered is not a valid phone number.');
      } else {
        // always add +1 to the phone number, assuming all numbers are from Canada
        var validNumber = '+1'+match[2]+match[3]+match[4];
        if (numberList.indexOf(validNumber) > -1) {
          resp.message('The number '+number+' is already subscribed.');
        } else {
          numberList.push(validNumber);
          console.log('number added: '+validNumber);
          fs.writeFileSync(phoneNumberFile, JSON.stringify(obj, null, 2));
          resp.message('added '+number+'.');
        }
      }
    });
  }
  return resp.toString();
}

// remove phone numbers from phonenumbers.json
var removeNumber = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  var obj = JSON.parse(fs.readFileSync(phoneNumberFile, 'utf8'));
  console.log(obj);
  var numberList = obj.PHONE_NUMBERS;
  if (param.length == 0) {
    resp.message('Sorry, you have not entered anything! Ensure that the text message is this format: '+
      'removenumber [NUMBER] [NUMBER]... etc.');
  } else {
    // validate phone number
    param.forEach(function(number) {
      var match = number.match(phoneNumberRegex);
      if (!match) {
        resp.message('Sorry, the number '+number+' you entered is not a valid phone number.');
      } else {
        // always add +1 to the phone number, assuming all numbers are from Canada
        var validNumber = '+1'+match[2]+match[3]+match[4];
        var index = numberList.indexOf(validNumber);
        if (index == -1) {
          resp.message('The number '+number+' is already removed.');
        } else {
          numberList.splice(index, 1);
          console.log('number removed: '+validNumber);
          fs.writeFileSync(phoneNumberFile, JSON.stringify(obj));
          resp.message('removed '+number+'.');
        }
      }
    });
  }
  return resp.toString();
}

var help = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  if(param.length == 1 && param[0].toLowerCase() == 'admin'){
    resp.message(
      "Hello! Type one of these available commands: \naddpoints \naddnumber \
      \nremovenumber \naddadmin \nremoveadmin \nsendmessage \nsendadminmessage \nsendleadermessage \nsendServingMessage\
      \n\nIf you need help, type 'help' followed by the command."
    );
  } else {
      var command = param[0].toLowerCase();
      var helpObj = JSON.parse(fs.readFileSync(helpFile, 'utf8'));
      var message = helpObj[command];
      if (!message) resp.message('The command ' + command + ' was not found. Please type "help" followed by the command. \
        For the list of commands, type "hi".');
      else resp.message(message);
  }
  return resp.toString();
}

var test = function(param){
    console.log('getting current event', param);
    resp = new twilio.TwimlResponse();

    resp.message('This is a test')
    return resp.toString();
}

var getEvent = function(param){
    console.log('getting current event', param);
    resp = new twilio.TwimlResponse();

    var obj = getScheduleJson();
    var event = '';
    var msg = '';
    if(param.length == 0){
        var day = getDay();
        var time = getTime();

        console.log('getting ' + day+' '+time);
        if(obj.hasOwnProperty(day)){
            if(obj[day].hasOwnProperty(time)){
                event = obj[day][time];
            }
        }
        console.log('event is ' + event);

        if(event != '' && event != '*'){
            msg = 'The current event is ' + event;
        }
        else if(event == '' || event == '*'){
            msg = 'There is currently no event';
        }
    }
    else if(param.length == 2){
        var day = param[0].toUpperCase();
        var time = param[1];
        console.log('getting event at ' + day+' '+time);
        var timeSplit = time.split(':');
        if(timeSplit.length == 2){
            var hour = timeSplit[0];
            var min = timeSplit[1];
            min = roundMinutes(min);
            time = hour+':'+min;
            console.log('getting ' + day+' '+time);
            if(obj.hasOwnProperty(day)){
                if(obj[day].hasOwnProperty(time)){
                    event = obj[day][time];
                }
            }
            console.log('event is ' + event);

            if(event != '' && event != '*'){
                msg = 'The event on ' + param[0] + ' at ' + param[1] + ' is ' + event;
            }
            else if(event == '' || event == '*'){
                msg = 'There is no event on ' + param[0] + ' at ' + param[1];
            }
        }
        else{
            msg = 'Please enter in this format event [DAYOFWEEK] [HOUR:MIN]';
        }
    }

    resp.message(msg);
    return resp.toString();
}

var getNextEvent = function(param){
    console.log('getting next event', param);
    resp = new twilio.TwimlResponse();

    var day = getDay();
    var time = getTime();
    var nextEvent = getNextEventValue(day, time);

    if(nextEvent){
        resp.message('The next event is ' + nextEvent[1] + ' at ' + nextEvent[0]);
    }
    else{
        resp.message('There is no next event')
    }
    return resp.toString();
}

var getScheduleJson = function(){
    var csvString = fs.readFileSync(scheduleFile, 'utf8').toString();
    var lines = csvString.split(/\r\n|\n/);
    var dates = lines[0].split(',');
    var jsonObj = {};

    for(var i = 1; i < dates.length; i++){
        jsonObj[dates[i]] = {};
        for(var j = 1; j < lines.length; j++){
            var lineArr = lines[j].split(',');
            var time = lineArr[0];
            var event = lineArr[i];
            jsonObj[dates[i]][time] = event;
        }
    }

    console.log(jsonObj);
    return jsonObj;
}

var askQuestion = function(param, phoneNumber) {
  resp = new twilio.TwimlResponse();
  if (param.length == 0) {
    resp.message("Sorry, we didn\'t quite get your question, please ask again! Make sure you\
      text 'question' followed by your question.");
  } else {
    var question = {
      question: param.join(' '),
      phonenumber: phoneNumber,
      answered: false
    };
    var obj = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
    obj.questions.push(question);
    fs.writeFileSync(questionsFile, JSON.stringify(obj, null, 2));
    resp.message("Thanks for asking a question!!! We will try to reply to you as soon as possible! :)");
  }
  return resp.toString();
}

var sendAnswers = function(answers) {
  answers.forEach(function(answer) {
    var message = "Hey! We have an answer for this question you sent:\n\""
      + answer.question + "\"\nThis is what a serving member said:\n\""
      + answer.answer + "\"";
    console.log(message);
    sendTextMessage(message, answer.phonenumber);
    // mark as answered
    var obj = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
    obj.questions.forEach(function(d) {
      if (d.question == answer.question) {
        d.answered = true;
        d.answer = answer.answer;
      }
    });
    fs.writeFileSync(questionsFile, JSON.stringify(obj, null, 2));
  });
}


/* UTILITY FUNCTIONS */

function isAdmin(phoneNumber) {
  var obj = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
  if (obj.ADMIN.indexOf(phoneNumber) == -1) return false;
  return true;
}

function getTeamLeaders(){
  console.log("getting team leaders");
  var obj = JSON.parse(fs.readFileSync(teamsFile, 'utf8'));
  var leaderNumbers = [];
  for(var team in obj){
    console.log("TEAM: " + team);
    var teamJson = obj[team];
    var leaderJson = teamJson.LEADERS;
    var pointJson = teamJson.POINTS;
    console.log("LEADERS: " + leaderJson);
    console.log("POINTS: " + pointJson);
  }
}

function sendTextMessage(message, phoneNumber) {

  client.sendMessage({

    to: phoneNumber, // Any number Twilio can deliver to
    from: TWILIO_NUMBER, // A number you bought from Twilio and can use for outbound communication
    body: message // body of the SMS message

  }, function(err, responseData) { //this function is executed when a response is received from Twilio

    if (!err) { // "err" is an error received during the request, if any

      // "responseData" is a JavaScript object containing data received from Twilio.
      // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
      // http://www.twilio.com/docs/api/rest/sending-sms#example-1

      console.log('from:', responseData.from); // outputs "+14506667788"
      console.log('to:', responseData.to); // outputs "+14506667788"
      console.log('body:', responseData.body); // outputs "word to your mother."

    } else {
      console.log(responseData);
      console.log(err);
      throw responseData;
    }
  });
}

function getDay(){
    var date = new Date();
    var day = dayOfWeek(date.getDay());
    //day = "SATURDAY";
    return day;
}

function getTime(){
    var date = new Date();
    var hour = date.getHours();
    var min = date.getMinutes();
    //hour = '22';
    //min = '01';

    console.log('current time is ' + hour + ':' + min);
    min = roundMinutes(min);
    console.log('rounded time is ' + hour + ':' + min);

    return hour+':'+min;
}

function roundMinutes(min){
    min = ((min / 15 | 00) * 15) % 60;
    if(min == 0){
        min = '00';
    }
    return min;
}

function dayOfWeek(dayIndex) {
  return ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][dayIndex];
}

function getNextEventValue(currentDay, currentTime){
    var obj = getScheduleJson();
    var dayEvents = obj[currentDay];
    var currentEvent = '';
    var nextEvent;
    var startCheck = false;
    for(var key in dayEvents){
        //console.log(key + ' - ' + dayEvents[key]);
        if(startCheck){
            if(currentEvent == dayEvents[key]){
                //do nothing
                console.log('current ' + key + ' ' + dayEvents[key]);
            }
            else{
                nextEvent = new Array(2);
                nextEvent[0] = key;
                nextEvent[1] = dayEvents[key];
                console.log('next ' + key + ' ' + dayEvents[key]);
                break;
            }
        }
        if(key == currentTime){
            currentEvent = dayEvents[key];
            startCheck = true;
            console.log('current ' + key + ' ' + dayEvents[key]);
        }
    }
    return nextEvent;
}

module.exports = {
    hi: hi,
    admin: admin,
    getEvent: getEvent,
    getNextEvent: getNextEvent,
    getPoints: getPoints,
    addPoints: addPoints,
    getTeam: getTeam,
    changeTeamName: changeTeamName,
    addAdmin: addAdmin,
    removeAdmin: removeAdmin,
    sendMessage: sendMessage,
    sendLeaderMessage: sendLeaderMessage,
    sendServingMessage: sendServingMessage,
    sendAdminMessage: sendAdminMessage,
    addNumber: addNumber,
    removeNumber: removeNumber,
    help: help,
    askQuestion: askQuestion,
    test: test,
    sendAnswers: sendAnswers // not a command, but used internally in util.js
}
