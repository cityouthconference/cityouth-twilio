# cityouthtwilio
A SMS based application (using [Twilio](https://www.twilio.com/)) that automatically receives and responds to commands regarding the conference.

Currently running on Heroku: https://cityouth-conference.herokuapp.com/

## Requirements
- `event` :  Get the upcoming event
- `hint [GAME_NAME]` : Get hints for certain activities
- `team [NAME]` : Get team
- `points [TEAM_NAME]` : Get current teams points
- `text [MESSAGE]` : Text one of the serving members
- `hi` : gives the list of commands that are available
- `sendmessage [MESSAGE]`: sends a global message to everyone subscribed

A full list of currently implemented commands can be viewed [here](https://github.com/cityouthconference/cityouth-twilio/blob/master/util/util.js#L7)

### Things to work on
- making commands case insensitive
- add database to make points and phone numbers persistent
- Unit testing

## Development Workflow

#### Getting Started
This development setup requires that you have `git` and `npm` installed on your machine. For installation go to: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git and https://nodejs.org/en/. If you are on macOS, `npm` can be installed with Homebrew: `brew install npm`

Clone the repository

`git clone git@github.com:cityouthconference/cityouth-twilio.git`

#### Testing Locally with Twilio

To test locally, we need to first get the configuration variables. These can be retrieved from Heroku under cityouth-twilio > Settings > Reveal Config Vars. Then export the variables in your local terminal (with the values substituted for `...`):
```bash
export ACCOUNT_SID=...
export AUTH_TOKEN=...
export TWILIO_NUMBER=...
```

Start the node application with `npm start` in the root directory, the output should appear as the following:

```bash
➜  cityouth-twilio git:(master) npm start

> cityouthtwilio@1.0.1 start /Users/<user>/workspace/cityouth-twilio
> nodemon index.js

[nodemon] 1.18.3
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: *.*
[nodemon] starting `node index.js`
Listening on port http://localhost:8080
```

Now that the server is started on your local machine, we need Twilio to be able to send callback requests to it once it receives an SMS message. To do so, we need to expose the local server to the public with [ngrok](https://ngrok.com/). If ngrok is not installed to your computer, it can be installed [here](https://ngrok.com/download). Once it is downloaded, we recommend you add it to your PATH. Then tunnel your application:

```bash
ngrok http 8080
```

The output of the ngrok command should give you something like:

```bash
ngrok by @inconshreveable                                                                             (Ctrl+C to quit)

Session Status                online
Session Expires               7 hours, 59 minutes
Version                       2.3.34
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://7991a0cf.ngrok.io -> http://localhost:8080
Forwarding                    https://7991a0cf.ngrok.io -> http://localhost:8080

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Finally, log in to Twilio and go to Manage Numbers > Active Numbers > Configure > Messaging. Under the Webhook box, put in the "Forwarding" ngrok URL (ex. `http://7991a0cf.ngrok.io` for the above output). 

You should now be good to go! Start messaging the Twilio phone number from your phone and see the requests come in your local server.
