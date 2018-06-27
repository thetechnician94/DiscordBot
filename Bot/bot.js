var Discord = require('discord.io');
var auth = require('./auth.json');

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {});

//look at text commands
bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '$') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        switch(cmd) {
            case "test": sendMsg(channelID,message,"test reply");           
        }
     }
});



function sendMsg(channelID,message,msg){
	bot.sendMessage({to: channelID,message: msg});	
}
