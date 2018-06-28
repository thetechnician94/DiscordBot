var Discord = require('discord.js');
var auth = require('./auth.json');
var ffmpeg = require('ffmpeg');

// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});

//symbol used to invoke message commands
var commandSymbol="%";

//event handling
bot.on('message', msg => {
	handleMessage(msg);
});

bot.on('voiceStateUpdate', (oldUser,newUser) => {		
	updateVoiceChannels(oldUser,newUser);
});

bot.on('presenceUpdate', (oldUser,newUser) => {		
	updateVoiceChannels(oldUser,newUser);
});

bot.login(auth.token);

function handleMessage(msg){
  var args = msg.content.substring(1).split(' ');
  var cmd = args[0];
  args = args.splice(1);
  if (msg.content.substring(0,1)==commandSymbol) {
   switch(cmd) {
			case "help":
				printHelp(msg,args);
				break;
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
					msg.reply("\nVersion: 1.21\nClient: "+bot.user+"\nPing: "+bot.ping+"\nStatus: "+bot.status+"\nUptime: "+(bot.uptime/1000) +" (secs)"+"\nReady at: "+bot.readyAt);
				}
				break;
			case "userinfo":
				if(authenticate("Admin",msg)){
					msg.server.members.get("name", "USERNAMEHERE").id
				}
				break;
			default: msg.reply("Unrecognized Command");   
     }
  }
  else{
	return;
  }	
}

function updateVoiceChannels(oldUser,newUser){	
	if(newUser.voiceChannel!=null){ //joining
		if(newUser.voiceChannel.name=="Admin" || newUser.voiceChannel.name=="AFK"){
			return;
		}
		var members = newUser.voiceChannel.members.array();
		if(!newUser.user.bot && (oldUser.voiceChannel==null || oldUser.voiceChannel != newUser.voiceChannel)&& members.length>1){
			newUser.voiceChannel.join().then(connection=>{
				const dispatcher = connection.playFile("E:/Documents/GitHub/DiscordBot/Bot/connected.mp3",{bitrate:"auto",passes:3});
				dispatcher.on("end", end => {
					connection.disconnect();
				}); 		
			}).catch(console.error);;
		}
		var members = newUser.voiceChannel.members.array();
		if(members.length==0){
			newUser.voiceChannel.setName("Open Voice Channel");
			return;
		}
		var games = new Array();
		for(var i=0;i<members.length;i++){
			if(members[i].presence.game!=null)
			games.push(members[i].presence.game.name);
		}
		if(games.length==0){
			newUser.voiceChannel.setName("Just Chatting");
		}else{
			newUser.voiceChannel.setName(mode(games));
		}
	}
	if(oldUser.voiceChannel!=null){//leaving
		if(oldUser.voiceChannel.name=="Admin" || oldUser.voiceChannel.name=="AFK"){
			return;
		}	
		var members = oldUser.voiceChannel.members.array();
		if(members.length==0){
			oldUser.voiceChannel.setName("Open Voice Channel");
			return;
		}
		var games = new Array();
		for(var i=0;i<members.length;i++){
			if(members[i].presence.game!=null)
			games.push(members[i].presence.game.name);
		}
		if(games.length==0){
			oldUser.voiceChannel.setName("Just Chatting");
		}else{
			oldUser.voiceChannel.setName(mode(games));
		}
	}
}

function mode(arr){
    return arr.sort((a,b) =>
          arr.filter(v => v===a).length
        - arr.filter(v => v===b).length
    ).pop();
}

function printHelp(msg,args){
	msg.channel.send(new Discord.Attachment("./help.jpg","help.jpg"));
}

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
					msg.channel.fetchPinnedMessages().then(function(pins){
						pins=pins.array();
						data=data.array();
						if(pins.length>0){
							for(var i=0;i<data.length;i++){
								if(data[i].pinned){
									data.splice(i,1);
								}
							}
						}
						msg.channel.bulkDelete(data);							
					});
					
					
				}
				else{
					var msgs = data.array();
					try{
						var num=parseInt(args[0]);
					}
					catch(err){
					}
					if(isNaN(num) || num<1){
							msg.reply("Please specify \"all\" or a positive integer");
							return;
						}
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
			}else{
				msg.reply("Usage: cleanMsgs[all|number]");
			}
			
			
	});
}