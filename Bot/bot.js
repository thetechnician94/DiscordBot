var Discord = require('discord.js');
var auth = require('./auth.json');

// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});



//look at text commands
bot.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});


client.login('token');
