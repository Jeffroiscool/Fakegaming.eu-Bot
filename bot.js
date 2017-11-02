const BotSettings = require("./botsettings.json")
const Discord = require("discord.js")

const Music = require("./music.js")

const Fortnite = require("./games/fortnite.js")
const Overwatch = require("./games/overwatch.js")
const PUBG = require("./games/pubg.js")
const Translate = require("./tools/translate.js")
const GoogleTTS = require("google-tts-api");

const prefix = BotSettings.prefix

const client = new Discord.Client()

async function parseCommand(message) {
    let messageArray = message.toString().split(" ")
    let command = messageArray[0].replace("\r\n", "").replace(prefix, "")
    let args = messageArray.slice(1)

    switch(command){
        case "userinfo":
            let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription("This is the user's info!")
            .setColor("#ff0000")
            .setTitle("Test bla bla")
            return [embed, "string"]
        case "fortnite", "fn": 
            return [await Fortnite.getFortniteStats(args[0]), "string"]
        case "pubg": 
            return [await PUBG.getPUBGStats(args[0], args[1]), "string"]
        case "overwatch", "ow": 
            return [await Overwatch.getOverwatchStats(args[0], args[1], args[2]), "string"]
        case "razdo":
            return ["Deze string is veranderd omdat Razdo zich anders aangesproken voelt.", "string"]
        case "translate":
            return [await Translate.translate(args[0], args[1], args.slice(2).join(" ")), "string"]
        case "play":
            return [await Music.play(message), "function"]
        case "stop":
            return [await Music.stop(message), "function"]
        case "pause":
            return [await Music.pause(message), "function"]
        case "skip":
            return [await Music.skip(message), "function"]
        case "queue":
            return [await Music.retrieveQueue(message), "string"]
        default:
            return ""
    }
}

client.on("ready", async () => {
    console.log(`Bot is online ${client.user.username}`)
    client.user.setGame('Fakegaming.eu');
    try {
        let link = await client.generateInvite(["ADMINISTRATOR"])
        console.log(link)
    } catch (error) {
        console.log(error.stack)
    }
})

client.on("message",async message => {
    if(message.author.bot) return

    if(message.content.startsWith('++tts')){
        const voiceChannel = message.member.voiceChannel;
        if (!voiceChannel) return message.reply(`Please be in a voice channel first!`)
        let messageArray = message.toString().split(" ")
        let args = messageArray.slice(1)
        let msg = args.slice(1).join(" ")
        let ttsaudio = await GoogleTTS(msg, "nl", 1)
        voiceChannel.join()
        .then(connection => {
            const dispatcher = connection.playStream(ttsaudio)
            dispatcher.on('debug', info => console.log(info))
            dispatcher.on('error', error => console.log(error))
            dispatcher.on('end', () => voiceChannel.leave())
        });
    }
    let messageArray = message.content.split(" ")
    let command = messageArray[0]

    if(!command.startsWith(prefix)) return

    let output = await parseCommand(message, "discord")

    if(output[1] === "string"){
        message.channel.send(output[0])
    }
    
})

var stdin = process.openStdin();

stdin.on("data", async message => {
    let messageArray = message.toString().split(" ")
    let command = messageArray[0].replace("\r\n", "")

    if(!command.startsWith(prefix)) return

    let output = await parseCommand(message, "console")
    if(output !== undefined){
        if(output[1] === "string"){
            console.log(output[0])
        }
    }
});

client.login(BotSettings.discordToken)