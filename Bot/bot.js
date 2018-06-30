//required packages
var Discord = require('discord.js');
var auth = require('./auth.json');
var ffmpeg = require('ffmpeg');
var fs = require('fs');

//logging variables
var loggingLevel=1;
var logFile="./log.txt";
var logConsole=false;

//symbol used to invoke message commands
var commandSymbol="%";

// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', () => {});

//event handling
try{
	/*
	a Message is sent in a text channel 
	*/
	bot.on('message', msg => {
		log(4,"Message Event Fired");
		handleMessage(msg);
	});

	/*
	someone joins/leaves a voice channel or /mutes/unmutes themselves
	*/
	bot.on('voiceStateUpdate', (oldUser,newUser) => {		
		log(4,"Voice State Update Event Fired");
		updateVoiceChannels(oldUser,newUser);
	});

	/*
	someone goes changes online status or game status
	*/
	bot.on('presenceUpdate', (oldUser,newUser) => {		
		log(4,"Presence Update Event Fired");
		updateVoiceChannels(oldUser,newUser);
	});
	
	
	/*
	bot got disconnected
	*/
	bot.on('disconnect', evt => {		
		log(1,"Bot disconnected, attempting to reconnect");
		login();
	});

	//login the bot to discord.
	login();
}catch(err){
	log(1,err.message);
}
//functions

/*
login - logs the bot in
*/

function login(){
	log(1,"Logging in"); 
	bot.login(auth.token);
	log(1,"Logged in succesfully");
	console.log("Bot Started");
}

/*
log - writes to log file and console if the level of the log command is less or equal to the global logging level. Can be turned off with a logging level of 0.
*/
function log(level,msg){
	if(level>loggingLevel){
		return;
	}
	var logStream = fs.createWriteStream(logFile, {'flags': 'a'});
	logStream.end(new Date().toString()+msg+"\n");
	if(logConsole){
		console.log(new Date().toString()+msg);
	}
}

/*
handleMessage - takes a Message object, determines if it is for this bot, and runs the appropiate function
*/
function handleMessage(msg){
	if(msg.author.bot || msg.content.substring(0,1)!=commandSymbol){
		log(4,"Message discarded, not for me");
		return;
	}
	var args = msg.content.substring(1).split(' ');
	var cmd = args[0];
	args = args.splice(1); 
	switch(cmd) {
		case "help":
			log(3,"Printing Help");
			printHelp(msg,args);
			break;
		case "cleanMsgs":
			log(2,"Attempting to clean messages in "+msg.channel.name);
			if(authenticate("Admin",msg)){
				cleanMsgs(msg,args);
				return;
			}
			log(2,"Failure to clean messages in "+msg.channel.name+". "+msg.author.username+" missing required role");
			break;
		case "searchMsgs":
			log(2,"Attempting to search messages in "+msg.channel.name+" for: "+args.toString());
			searchMsgs(msg,args);
			break;
		case "botinfo":
			log(2,"Attempting to print bot info in "+msg.channel.name);
			if(authenticate("Admin",msg)){
				msg.reply("\nVersion: 1.21\nClient: "+bot.user+"\nPing: "+bot.ping+"\nStatus: "+bot.status+"\nUptime: "+(bot.uptime/1000) +" (secs)"+"\nReady at: "+bot.readyAt);
				log(3,"Bot info printed in "+msg.channel.name+" for "+msg.author.username);
				return;
			}
			log(2,"Failure to print bot info in "+msg.channel.name+". "+msg.author.username+" missing required role");
			break;
		case "searchUser":
			log(2,"Attempting to search for user "+args[0]);
			if(authenticate("Admin",msg)){
				var members=msg.guild.members.array();
				var found=false;
				for(var i=0;i<members.length;i++){
					if(members[i].user.username.includes(args[0]) || (members[i].nickname!=null && members[i].nickname.includes(args[0])) || args[0]=="*"){
						printUser(members[i],msg);
						log(3,"User "+members[i].user.username+" found");
						found=true;
					}
				}	
				if(!found){
					log(3,"No results for user "+args[0]);
					msg.reply("No user found");
				}
				return;
			}
			log(2,"Failure to search user info for "+msg.author.username+". Missing required role");
			break;
		case "logLevel":
			log(2,"Attempting to change log level");
			if(authenticate("Admin",msg)){
				try{
				var temp = loggingLevel;
				loggingLevel=parseInt(args[0]);
				if(isNaN(loggingLevel)){
					log(1,"Error parsing new log level");
					loggingLevel=temp;
					msg.reply("Logging level must be an integer");
					
				}else{
					msg.reply("Logging Level changed to "+loggingLevel);
				}
				}catch(err){
					log(1,"Error parsing new log level\n"+err.message);
					return;
				}
				log(1,"Log level changed to "+loggingLevel);
				return;
			}
			log(2,"Failure to change log level for "+msg.author.username+". Missing required role");
			break;
		case "logConsole":
			log(2,"Attempting to change log console");
			if(authenticate("Admin",msg)){
				try{
				if(args[0]=="true"){
					logConsole=true;
				}else{
					logConsole=false;
				}
				msg.reply("Logging to console changed to "+logConsole);
				}catch(err){
					log(1,"Error parsing boolean\n"+err.message);
					return;
				}
				log(1,"Logging to console changed to "+logConsole);
				return;
			}
			log(2,"Failure to change log to console for "+msg.author.username+". Missing required role");
			break;	
		default: msg.reply("Unrecognized Command");   
	}
}

/*
printUser - takes a GuildMember object and a Message object to print various information about the user
*/
function printUser(member,msg){
	var content="";
	var date="";
	var game="";
	var user=member.user;
	if(user.lastMessage==null){
		content="None";
		date="None"
	}
	else{
		content=user.lastMessage.content;
		date=user.lastMessage.createdAt;
	}
	if(user.presence.game==null){
		game="None";
	}else{
		game=user.presence.game.name;
	}
	msg.reply("\nUsername: "+user.username+"\nNickname: "+member.nickname+"\nJoined: "+member.joinedAt+"\nId: "+user.id+"\nLast Message:\n-------\n"+content+"\n"+date+"\n-------\nStatus: "+user.presence.status+"\nGame: "+game+"\nTag: "+user.tag);
}

/*
updateVoiceChannels - changes the name to the name of the most frequent game being played in this channel, Just chatting if no one is playing a game, or Open Voice channel if no one is in the channel. Also plays the "user connected" message on join
*/
function updateVoiceChannels(oldUser,newUser){	
	if(newUser.voiceChannel!=null){ //joining
		if(newUser.user.bot){
			return;
		}
		log(4,"User is in new Voice channel or muted/unmuted");
		if(newUser.voiceChannel.name=="Admin" || newUser.voiceChannel.name=="AFK"){
			log(4,"This channel is ignored");
			return;
		}
		var members = newUser.voiceChannel.members.array();
		/*
		if((oldUser.voiceChannel==null || oldUser.voiceChannel != newUser.voiceChannel)){
			log(4,"User connected, not result of mute/unmute. Playing \"connected\" voice");
			try{
				newUser.voiceChannel.join().then(connection=>{
					const dispatcher = connection.playFile("/home/ad/Bot/connected.mp3",{bitrate:"auto",passes:3});
					dispatcher.on("end", end => {
						connection.disconnect();
					}); 		
				});
			}catch(err){
				log(1,err.message);
			}
		}
		*/
		var members = newUser.voiceChannel.members.array();
		if(members.length==0){
			log(4,"No more members in channel");
			newUser.voiceChannel.setName("Open Voice Channel");
			return;
		}
		var games = new Array();
		for(var i=0;i<members.length;i++){
			if(members[i].presence.game!=null){
				games.push(members[i].presence.game.name);
				log(5,"A member is playing a game");
			}
		}
		if(games.length==0){
			log(4,"No one is playing a game");
			newUser.voiceChannel.setName("Just Chatting");
		}else{
			log(4,"Changing channel name to "+mode(games));
			newUser.voiceChannel.setName(mode(games));
		}
	}
	if(oldUser.voiceChannel!=null){//leaving
		if(oldUser.user.bot){
			return;
		}
		log(4,"User left a voice channel or muted/unmuted");
		if(oldUser.voiceChannel.name=="Admin" || oldUser.voiceChannel.name=="AFK"){
			log(4,"This channel is ignored");
			return;
		}	
		var members = oldUser.voiceChannel.members.array();
		/*if(!oldUser.user.bot && (newUser.voiceChannel==null || oldUser.voiceChannel != newUser.voiceChannel)){
			oldUser.voiceChannel.join().then(connection=>{
				const dispatcher = connection.playFile("/home/ad/Bot/disconnected.mp3",{bitrate:"auto",passes:3});
				dispatcher.on("end", end => {
					connection.disconnect();
				}); 		
			}).catch(console.error);;
		}*/
		if(members.length==0){
			log(4,"There is no one in this channel");
			oldUser.voiceChannel.setName("Open Voice Channel");
			return;
		}
		var games = new Array();
		for(var i=0;i<members.length;i++){
			if(members[i].presence.game!=null){
				games.push(members[i].presence.game.name);
				log(5,"A Member is playng a game");
			}
		}
		if(games.length==0){
			log(4,"No one is playing a game");
			oldUser.voiceChannel.setName("Just Chatting");
		}else{
			log(4,"Changing channel name to "+mode(games));
			oldUser.voiceChannel.setName(mode(games));
		}
	}
}

/*
mode - takes an array of Strings (eg of games) and returns the one that appears the most frequently
*/
function mode(arr){
    return arr.sort((a,b) =>
          arr.filter(v => v===a).length
        - arr.filter(v => v===b).length
    ).pop();
}


/*
printHelp -  takes a Message object and array of arguments (not used) to display help.jpg
*/
function printHelp(msg,args){
	msg.channel.send(new Discord.Attachment("./help.jpg","help.jpg"));
}


/*
authenticate - takes a String that is the name of a role and a Message object to determine if the author of this message has the required role. returns true if they do or false if they do not. Also replies to the message to tell the user they lack required privileges
*/
function authenticate(roleName,msg){
	if(!msg.guild.available){
		msg.reply("An error occurred while authenticating your user, please try again");
		log(1,"Guild not available");
		return false;
	}
	let role = msg.guild.roles.find("name", roleName);
	
	if(role!=null){
		if(msg.member.roles.has(role.id)) {
			log(4,msg.member.user.username+" passed role check for "+roleName);
			return true;
		}
	}else{
		log(3,roleName+" does not exist!");
	}
	msg.reply("You must have the \""+roleName+"\" role to use this command");
	log(4,msg.member.user.username+" failed role check for "+roleName);
	return false;
}

/*
searchMsgs - takes a Message object and list of arguments (that are the terms to search by) and replies with all messages that contain one or more of the search terms. Excludes commands to this bot and any messages generated by a bot.
*/
function searchMsgs(msg,args){
	if(args.length==0){
				log(2,"No arguments were provided for search");
				return;
	}
	msg.channel.fetchMessages().then(function(data){
			var msgs = data.array();
			for(var i=0;i<msgs.length;i++){
				if(msgs[i].content.substring(0,1)==commandSymbol || msgs[i].author.bot){
					log(5,"Skipping message: was a command or originated from a bot");
					continue;
				}
				for(var k=0;k<args.length;k++){
					if (msgs[i].content.includes(args[k])){
						log(5,"Matching message found");
						msg.reply("\n"+msgs[i].author.username+"\n\n"+msgs[i].content+"\n\n"+msgs[i].createdAt);
						break;
					}
				}
			}			
	});
}

/*
cleanMsgs - takes a Message object and a list of arguments. if the first argument is "all" all messages in this channel are deleted (except pinned messages). If the argument is a positive integer, that many messages will be deleted from the top of the channel (except pinned messages).
*/
function cleanMsgs(msg,args){
	msg.channel.fetchMessages().then( function(data){
		if(args.length>0){
			if(args[0]==="all"){
				log(2,"Cleaning all messages");
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
					log(3,"Messages cleaned");						
				});				
			}
			else{
				var msgs = data.array();
				try{
					var num=parseInt(args[0]);
					
				}
				catch(err){
					log(3,"Error getting number of messages\n"+err.message);
					return;
				}
				if(isNaN(num) || num<1){
					log(2,"Invalid Number supplied");
					msg.reply("Please specify \"all\" or a positive integer");
					return;
				}
				log(1,"Cleaning "+num+" messages");
				var deleted=0;
				for(var i=msgs.length-1;i>=0;i--){
					if(!msgs[i].pinned){
						log(4,"Message pinned, skipping");
						msgs[i].delete();
						deleted++;
					}
					if(deleted==num){
						msgs[0].delete();
						log(2,"Done - "+deleted+" messages deleted");
						return;
					}
					
				}
			}
		}else{
			log(1,"No arguments were provided for clean");
			msg.reply("Usage: cleanMsgs[all|number]");
		}
	});
}