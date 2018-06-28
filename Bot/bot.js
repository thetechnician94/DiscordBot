var Discord = require('discord.js');
var auth = require('./auth.json');

// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});
var commandSymbol="%";
//look at text commands
bot.on('message', msg => {
  var args = msg.content.substring(1).split(' ');
  var cmd = args[0];
  args = args.splice(1);
  if (msg.content.substring(0,1)==commandSymbol) {
   switch(cmd) {
			case "cleanMsgs":
				if(authenticate("Admin",msg)){
					cleanMsgs(msg,args);
				}
				break;
			case "searchMsgs":
				searchMsgs(msg,args);
				break;
			case "botinfo":
				if(authenticate("Admin",msg)){
					msg.reply("\nVersion: 1.0\nClient: "+bot.user+"\nPing: "+bot.ping+"\nStatus: "+bot.status+"\nUptime: "+(bot.uptime/1000) +" (secs)"+"\nReady at: "+bot.readyAt);
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
		return false;
	}
	let role = msg.guild.roles.find("name", roleName);
	if(role!=null){
		if(msg.member.roles.has(role.id)) {
			return true;
		}
	}
	msg.reply("You must have the \""+roleName+"\" role to use this command");
	return false;
}

function searchMsgs(msg,args){
	if(args.length==0){
				return;
	}
	msg.channel.fetchMessages().then(function(data){
			var msgs = data.array();
			for(var i=0;i<msgs.length;i++){
				if(msgs[i].content.substring(0,1)==commandSymbol || msgs[i].author.bot){
					continue;
				}
				for(var k=0;k<args.length;k++){
					if (msgs[i].content.includes(args[k])){
						msg.reply("\n"+msgs[i].author.username+"\n\n"+msgs[i].content+"\n\n"+msgs[i].createdAt);
						break;;
					}
				}
			}			
	});
}

function cleanMsgs(msg,args){
	msg.channel.fetchMessages().then(function(data){
			if(args.length>0){
				if(args[0]==="all"){
					msg.channel.bulkDelete(data);	
				}
				else{
					var msgs = data.array();
					var num=parseInt(args[0]);
					var deleted=0;
					for(var i=msgs.length-1;i>=0;i--){
						if(!msgs[i].pinned){
							msgs[i].delete();
							deleted++;
						}
						if(deleted==num){
							msgs[0].delete();
							return;
						}
						
					}
				}
			}
			else{
				var msgs = data.array();
				for(var i=msgs.length-1;i>=0;i--){
					if(!msgs[i].pinned){
						msgs[i].delete();
					}
				}
			}
			
	});
}