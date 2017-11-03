const BotSettings = require("./botsettings.json")
const Discord = require("discord.js")
const YTDL = require("ytdl-core");
const YTSearch = require("youtube-search");
const Util = require("util")
const YTSearchAsync = Util.promisify(YTSearch)

exports = {
    play: async function (message) {

        let messageArray = message.toString().split(" ")
        let args = messageArray.slice(1)

        if(currentDispatcher[message.guild.id] !== undefined){
            if(currentDispatcher[message.guild.id].paused === true){
                currentDispatcher[message.guild.id].resume()
                return
            }
        }
        if(args.length < 1) return message.channel.send("Invalid link or search terms!")
        if (!message.member.voiceChannel) return message.reply("Please be in a voice channel first!")
        
        let song = {}
        song.requester = message.author.username

        let isYT = YTDL.validateURL(args[0])
        if(isYT){
            song.title = (YTDL.getInfo(args[0])).title
            song.stream = YTDL(args[0], { filter: 'audioonly' })
        }else{
            let result = await YTSearchAsync(args.join(" "), {key: BotSettings.youtubeAPI, maxResults: 1, type: "video"})
            console.log(result)
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
        message.channel.send(`${song.title} added to queue`)
    },
    stop: async function (message) {
        currentQueue[message.guild.id] = []
        currentDispatcher[message.guild.id].end()
    },
    pause: async function (message) {
        currentDispatcher[message.guild.id].pause()
    },
    skip: async function (message) {
        currentDispatcher[message.guild.id].end()
    },
    retrieveQueue: async function (message) {
        return await getQueue(message)
    }
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