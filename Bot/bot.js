var Discord = require('discord.js');
var auth = require('./auth.json');

// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});



//look at text commands
bot.on('message', function (user, userID, channelID, message, evt) {
	
	if (message.substring(0, 1) == '$') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        switch(cmd) {
            case "test": sendMsg(channelID,message,"test reply");   
				break;
			case "version": sendMsg(channelID,message,"1.0"); 
				break;
			case "disconnect": 
				sendMsg(channelID,message,"Bye");
				bot.disconnect();
				break;
			case "d": 
				sendMsg(channelID,message,bot.getUser(userID));
				break;
//			case "deleteMessages": DCP.deleteMessages();
//				break;
			default: sendMsg(channelID,message,"Unrecognized Command");   
        }
     }
});


function sendMsg(channelID,message,msg){
	bot.sendMessage({to: channelID,message: msg});	
}
