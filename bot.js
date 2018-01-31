const BotSettings = require("./botsettings.json")
const Discord = require("discord.js")

const FS = require("fs");

const prefix = BotSettings.prefix
const client = new Discord.Client()

client.commands = new Discord.Collection()
client.aliases = new Discord.Collection()

function runCommand(message){
    let command = message.content.split(" ")[0].replace(prefix, "");
    let params = message.content.split(" ").slice(1);

    let commandObject

    if (client.commands.has(command)) {
        commandObject = client.commands.get(command)
    } else if (client.aliases.has(command)) {
        commandObject = client.commands.get(client.aliases.get(command));
    }

    if(commandObject){
        commandObject.run(client, message, params)
    } 
}

//Inspired by various commandhandlers, specifically guidebot: https://github.com/Hyvonic/guidebot
FS.readdir("./commands/", (error, files) => {
    if(error) console.error(error)
    console.log(`Loading a total of ${files.length} commands`)
    files.forEach(file => {
        let props = require(`./commands/${file}`)
        console.log(`Loading command: ${prefix}${props.help.name}`)
        client.commands.set(props.help.name, props)
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name)
        });
    });
});

var stdin = process.openStdin();

stdin.on("data", async message => {
    runCommand(message)
});

client.on("ready", async () => {
    console.log(`Bot is online ${client.user.username}`)
    client.user.setActivity('Fakegaming.eu');
    try {
        let link = await client.generateInvite(["ADMINISTRATOR"])
        console.log(link)
    } catch (error) {
        console.log(error.stack)
    }
})

client.on("message",async message => {
    if(message.author.bot) return
    if(!message.content.startsWith(prefix)) return
    try{
        runCommand(message)
    }
    catch (error){
        console.log(error.stack)
    }
})

client.login(BotSettings.discordToken)