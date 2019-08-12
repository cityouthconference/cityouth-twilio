var twilio = require('twilio');
var commands = require('./commands.js');

var resp; // variable for twilio.TwimlResponse()


var COMMANDS_LIST = {
    hi: commands.hi,
    admin: commands.admin,
    event: commands.getEvent,
    nextevent: commands.getNextEvent,
    points: commands.getPoints,
    addpoints: commands.addPoints,
    team: commands.getTeam,
    teamname: commands.changeTeamName,
    addadmin: commands.addAdmin,
    removeadmin: commands.removeAdmin,
    sendmessage: commands.sendMessage,
    sendleadermessage: commands.sendLeaderMessage,
    sendservingmessage: commands.sendServingMessage,
    sendadminmessage: commands.sendAdminMessage,
    addnumber: commands.addNumber,
    removenumber: commands.removeNumber,
    help: commands.help,
    question: commands.askQuestion,
    test: commands.test
}

/*
  MAIN FUNCTION
  @param rawInput(string): text message that the user sends
  @return String of the TwilMl message
*/
var runCommandFromInput = function (request) {
  var rawInput = request.Body;
  var phoneNumber = request.From;
  var commandObject = getCommandObject(rawInput);
  // if an error is present in commandObject, return the error
  if (commandObject.error) return commandObject.error;
  else return COMMANDS_LIST[commandObject.command](commandObject.param, phoneNumber);
}

var getCommandObject = function(rawInput) {
  console.log(`\nCommand: ${rawInput}\n`)
  var input = rawInput.split(' ');
  // First, validate input by removing empty values in input
  for (var i = 0; i < input.length; i++) {
    if (input[i] == '') {
      input.splice(i, 1);
      i--;
    }
  }

  if (input.length == 0) {
    console.log('error: need to provide more!');
    resp = new twilio.TwimlResponse();
    resp.message('error: need to provide more!');
    return { error: resp.toString() };
  }

  // first element in the array will be the command, with the rest being the parameters
  var command = input[0].toLowerCase();
  var param = input.slice(1,input.length);

  // check if the command is in COMMAND_LIST. If not, return error
  if (!COMMANDS_LIST[command]) {
    resp = new twilio.TwimlResponse();
    resp.message('The command: ' + command + ' is not found. Text "hi" for a list of commands.');
    return { error: resp.toString() };
  }

  return {
    command: command,
    param: param
  }
}

var sendAnswers = function(answers) {
  commands.sendAnswers(answers);
};

module.exports = {
  runCommandFromInput: runCommandFromInput,
  sendAnswers: sendAnswers
}
