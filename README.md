# cityouthtwilio
Uses Twilio API to answer questions about the conference
Currently running on Heroku: https://cityouth-conference.herokuapp.com/
To test locally, tunnel application using ngrok: https://ngrok.com/

## Requirements
- 'event' :  Get the upcoming event
- 'hint [GAME_NAME]' : Get hints for certain activities
- 'team [NAME]' : Get team
- 'points [TEAM_NAME]' : Get current teams points
- 'verse [BIBLE_VERSE]' : Get bible verse?
- 'text [MESSAGE]' : Text one of the serving members
- 'help' : gives the list of commands that are available
- 'addadmin [PHONE_NUMBER]': add phone number to admin list
- 'removeadmin [PHONE_NUMBER]': removes phone number from admin list
- 'sendmessage [MESSAGE]': sends a global message to everyone subscribed

### Things to work on
- making commands case insensitive
- add/delete phone numbers

## Development Setup

This development setup requires that you have `git` installed on your machine. For installation go to: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git

Clone the repository
`git clone git@github.com:cityouthconference/cityouth-twilio.git`

... To be continued
