const BotSettings = require("../botsettings.json")
const Discord = require("discord.js")
const YTDL = require("ytdl-core");
const YTSearch = require("youtube-search");
const Util = require("util")
const YTSearchAsync = Util.promisify(YTSearch)

exports.run = async (client, message, params = [], debug = false) => {
    if(debug) return
    let command = message.content.split(" ")[0].replace(BotSettings.prefix, "");
    switch(command){
        case "play":
            if (params.length === 0) return
            parseSong(message)
            break
        case "pause":
            currentDispatcher[message.guild.id].pause()
            break
        case "stop":
            currentQueue[message.guild.id] = []
            currentDispatcher[message.guild.id].end()
            break
        case "skip":
            currentDispatcher[message.guild.id].end()
            break
        case "queue", "list":
            let list = await getQueue(message)
            output(list, message)
            break
    }
}

exports.conf = {
  aliases: ["play", "pause", "stop", "skip", "queue", "list"],
}

exports.help = {
  name: "music", 
  description: "Plays music",
  usage: ""
}

function output(input, message, debug = false){
    if(debug){
        console.log(input)
    }else{
        message.channel.send(input)
    }
}

async function parseSong(message){
    let messageArray = message.toString().split(" ")
    let args = messageArray.slice(1)

    if(currentDispatcher[message.guild.id] !== undefined){
        if(currentDispatcher[message.guild.id].paused === true){
            currentDispatcher[message.guild.id].resume()
            return
        }
    }
    if(args.length < 1) return output("Invalid link or search terms!", message)
    if (!message.member.voiceChannel) return message.reply("Please be in a voice channel first!")
    
    let song = {}
    song.requester = message.author.username

    let isYT = YTDL.validateURL(args[0])
    if(isYT){
        song.title = (YTDL.getInfo(args[0])).title
        song.stream = YTDL(args[0], { filter: 'audioonly' })
    }else{
        let result = await YTSearchAsync(args.join(" "), {key: BotSettings.youtubeAPI, maxResults: 1, type: "video"})
        song.title = result[0].title
        song.stream = YTDL(result[0].link, { filter: 'audioonly' })
        song.url = result[0].link
    }

    if(currentQueue[message.guild.id] === undefined){
        currentQueue[message.guild.id] = []
    }
    currentQueue[message.guild.id].push(song)
    if(currentQueue[message.guild.id].length === 1){
        playNextSongInQueue(message)
    }
    output(`${song.title} added to queue`, message)
}

async function playNextSongInQueue(message){
    if(currentQueue[message.guild.id].length === 0){
        message.channel.send(`Stopped playback`)
        message.member.voiceChannel.leave()
        currentDispatcher[message.guild.id] = undefined
        currentQueue[message.guild.id] = undefined
        currentVoiceConnection[message.guild.id] = undefined
        return
    }
    
    if(!message.guild.voiceConnection){
        currentVoiceConnection[message.guild.id] = await message.member.voiceChannel.join()
    }

    //currentVoiceConnection[message.guild.id] = currentVoiceConnection[message.guild.id] || await message.member.voiceChannel.join()
        
    let song = currentQueue[message.guild.id][0]
    currentDispatcher[message.guild.id] = currentVoiceConnection[message.guild.id].playStream(song.stream)
    currentDispatcher[message.guild.id].on('debug', info => console.log(info))
    currentDispatcher[message.guild.id].on('error', error => console.log(error))
    currentDispatcher[message.guild.id].on('end', () => {
        setTimeout(() => {
            currentQueue[message.guild.id].shift()
            playNextSongInQueue(message)
        }, 1000)
    })
    
    //message.channel.send(`Started playback: ${song.title} requested by ${song.requester}`)
}

async function getQueue(message){
    if (currentQueue[message.guild.id] === undefined) return "Nothing in playlist"
    let embed = new Discord.RichEmbed()
    let songList = ""
    let i = 0
    for(let song of currentQueue[message.guild.id]){
        i++
        songList += `#${i} - ${song.title}\n`
    }
    embed.addField("Current playlist", songList)
    return embed
}

const currentDispatcher = []
const currentQueue = {}
const currentVoiceConnection = []