var Discord = require('discord.js');
var auth = require('./auth.json');

// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});



//look at text commands
bot.on('message', msg => {
  var args = msg.content.substring(1).split(' ');
  var cmd = args[0];
  args = args.splice(1);
  if (msg.content.substring(0,1)=="$") {
   switch(cmd) {
            case "test": msg.reply("test reply");   
				break;
			case "version": msg.reply("1.0"); 
				break;
			case "whoami": 
				msg.reply(msg.author.username);
				break;
			case "cleanMsgs":
				msg.reply(bot.sweepMessages(10));
				break;
			case "botinfo":
				if(authenticate("Admin",msg)){
					msg.reply("\nClient: "+bot.user+"\nPing: "+bot.ping+"\nStatus: "+bot.status+"\nUptime: "+(bot.uptime/1000) +" (secs)"+"\nReady at: "+bot.readyAt);
				}
				break;
			default: msg.reply("Unrecognized Command");   
     }
  }
  else{
	return;
  }
});


bot.login(auth.token);


function authenticate(roleName,msg){
	if(!msg.guild.available){
		msg.reply("Guild not available");
		return;
	}
	let role = msg.guild.roles.find("name", roleName);
	if(role===null){
		msg.reply("Role \""+roleName+"\" not found");
		return;
	}
	if(msg.member.roles.has(role.id)) {
		return true;
	}
	return false;
}