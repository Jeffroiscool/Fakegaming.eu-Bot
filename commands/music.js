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
        case "queue" || "list":
            let list = await getQueue(message)
            output(list, message)
            break
        case "np" || "nowplaying":
            let np = await nowPlaying(message)
            output(np, message)
            break
    }
}

exports.conf = {
  aliases: ["play", "pause", "stop", "skip", "queue", "list", "np", "nowplaying"]
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

function fancyTimeFormat(time)
{   
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
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
    song.requester = message.author

    let isYT = YTDL.validateURL(args[0])
    if(isYT){
        let ytInfo = await (YTDL.getInfo(args[0]))
        song.title = ytInfo.title
        song.length = ytInfo.length_seconds
        song.stream = YTDL(args[0], { filter: 'audioonly' })
        song.url = ytInfo.video_url
        song.info = ytInfo
    }else{
        let result = await YTSearchAsync(args.join(" "), {key: BotSettings.youtubeAPI, maxResults: 1, type: "video"})
        let ytInfo = await YTDL.getInfo(result[0].link)
        song.title = ytInfo.title
        song.length = ytInfo.length_seconds
        song.stream = YTDL(result[0].link, { filter: 'audioonly' })
        song.url = ytInfo.video_url
        song.info = ytInfo
    }

    if(currentQueue[message.guild.id] === undefined){
        currentQueue[message.guild.id] = []
    }
    currentQueue[message.guild.id].push(song)
    if(currentQueue[message.guild.id].length === 1){
        playNextSongInQueue(message)
    }
    if (BotSettings.musicRemoveCommand){
        message.delete()
    }
    output(`${song.title} (${fancyTimeFormat(song.length)}) added to queue`, message)
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

async function nowPlaying(message){
    let song = currentQueue[message.guild.id][0]
    let embed = new Discord.RichEmbed()
    .setURL(song.url)
    .setAuthor(song.info.author.name, song.info.author.avatar, song.info.author.channel_url)
    .setDescription(song.info.description)
    .setColor("#FF0000")
    .setThumbnail(song.info.thumbnail_url)
    .setFooter(`Requested by ${song.requester.username}`, song.requester.avatarURL)
    return embed
}

async function getQueue(message){
    if (currentQueue[message.guild.id] === undefined) return "Nothing in playlist"
    let embed = new Discord.RichEmbed()
    let songList = ""
    let i = 0
    for(let song of currentQueue[message.guild.id]){
        i++
        songList += `#${i} - ${song.title} (${fancyTimeFormat(song.length)})\n`
    }
    embed.addField("Current playlist", songList)
    return embed
}

const currentDispatcher = []
const currentQueue = {}
const currentVoiceConnection = []