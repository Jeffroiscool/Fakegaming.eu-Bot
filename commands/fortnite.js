const Fetch = require('node-fetch')
const Cheerio = require('cheerio')
const Discord = require("discord.js")
const Request = require("request-promise")
const Moment = require("moment")
require("moment-duration-format")

exports.run = async (client, message, params = [], debug = false) => {
    if (params.length === 0) return
    if(!await checkFortnitePlayerExists(params[0])) await searchFortnitePlayer(params[0])
    await checkFortnitePlayerUpdated(params[0])
    let stats = await getFortnitePlayerStats(params[0])
    output(stats, message, debug)
}

exports.conf = {
  aliases: ["fn"],
}

exports.help = {
  name: "fortnite", 
  description: "Retrieve player's stats for Fortnite",
  usage: "fortnite [username]"
}

function output(input, message, debug = false){
    if(debug){
        console.log(input)
    }else{
        message.channel.send(input)
    }
}

async function checkFortnitePlayerExists(username){
    let url = `https://fortnitestats.net/stats/${username}`
    let res = await Fetch(url)
    if(res.ok){
        if(res.url === "https://fortnitestats.net/"){
            return false;
        }else{
            return true;
        }
    }
}

async function searchFortnitePlayer(username){
    var options = {
        method: 'POST',
        uri: 'https://fortnitestats.net/login.php',
        formData: {
            q: username
        }
    }

    let res = await Request(options)
    let regex = /n=(.*)'/g
    let match = regex.exec(res)
    let number = match[1]
    let url = `https://fortnitestats.net/includes/api/ajax.php?user=${username}&n=${number}`
    await Fetch(url)
    return true
}

async function checkFortnitePlayerUpdated(username){
    let url = `https://fortnitestats.net/stats/${username}`
    let res = await Fetch(url)
    let data = await res.text();
    if(res.ok){            
        let $ = Cheerio.load(data)
        let lastUpdated = $(".user-info").find("p").text()
        if (~lastUpdated.indexOf("hour")){
            let updateUrl = `https://fortnitestats.net/update/${username}`
            let res = await Fetch(updateUrl)
            if(res.ok){ 
                let data = await res.text()
                let regex = /n=(.*)'/g
                let match = regex.exec(data)
                let number = match[1]
                let url = `https://fortnitestats.net/includes/api/ajax.php?user=${username}&n=${number}`
                await Fetch(url)
            }
        }else{
            return true
        }
    }
}


async function getFortnitePlayerStats(username){
    let url = `https://fortnitestats.net/api.php?player=${username}`
    let data = await Fetch(url)
    let json = await data.json()

    let soloKills = json.solo_kills
    let duoKills = json.duo_kills
    let squadKills = json.squad_kills
    let totalKills = soloKills + duoKills + squadKills

    let soloWins = json.solo_wins
    let duoWins = json.duo_wins
    let squadWins = json.squad_wins
    let totalWins = soloWins + duoWins + squadWins

    let soloMatches = json.solo_matches
    let duoMatches = json.duo_matches
    let squadMatches = json.squad_matches
    let totalMatches = soloMatches + duoMatches + squadMatches
    
    let soloKD = parseFloat(json.solo_kd).toFixed(2)
    let duoKD = parseFloat(json.duo_kd).toFixed(2)
    let squadKD = parseFloat(json.squad_kd).toFixed(2)
    let overallKD = (totalKills / totalMatches).toFixed(2)

    let totalLoss = totalMatches - totalWins
    let soloLoss = soloMatches - soloWins
    let duoLoss = duoMatches - duoWins
    let squadLoss = squadMatches - squadWins
    
    let hoursSolo = Moment.duration(json.solo_time, "minutes").format("d [day(s)] h [hrs] m [min]")
    let hoursDuo = Moment.duration(json.duo_time, "minutes").format("d [day(s)] h [hrs] m [min]")
    let hoursSquad = Moment.duration(json.squad_time, "minutes").format("d [day(s)] h [hrs] m [min]")
    let hoursPlayed = Moment.duration(+(parseInt(json.solo_time) + parseInt(json.duo_time) + parseInt(json.squad_time)).toFixed(2), "minutes").format("d [day(s)] h [hrs] m [min]")

    let overallWinrate = Math.floor(totalWins / totalMatches * 100) + "%"
    /*
    let soloWinrate = Math.floor(soloWins / soloMatches * 100) + "%"
    let duoWinrate = Math.floor(duoWins / duoMatches * 100) + "%"
    let squadWinrate = Math.floor(squadWins / squadMatches * 100) + "%"
    */
    
    let solo5 = json.solo_top5
    let duo5 = json.duo_top5
    let squad5 = json.squad_top5
    let total5 = parseInt(solo5) + parseInt(duo5) + parseInt(squad5)

    let solo10 = json.solo_top10
    let duo10 = json.duo_top10
    let squad10 = json.squad_top10
    let total10 = parseInt(solo10) + parseInt(duo10) + parseInt(squad10)
    
    let solo25 = json.solo_top25
    let duo25 = json.duo_top25
    let squad25 = json.squad_top25
    let total25 = parseInt(solo25) + parseInt(duo25) + parseInt(squad25)

    let lastUpdated = json.last_updated
    let embed = new Discord.RichEmbed()
        .setURL(`https://fortnitestats.net/stats/${username}`)
        .setDescription(`[Profile](https://fortnitestats.net/stats/${username})\n\n${totalMatches} total matches played (${overallWinrate} won) over ${(hoursPlayed)}.`)
        .setAuthor(username, "https://static.blog.playstation.com/wp-content/uploads/avatars/ccP8lTm_400x400.jpeg")
        .setColor("#FF0000")
        .setFooter(lastUpdated)
        .addField("Kills", `Total: ${totalKills}\nSolo: ${soloKills}\nDuos: ${duoKills}\nSquads: ${squadKills}`, true)
        .addField("K/D Ratio", `Total: ${overallKD}\nSolo: ${soloKD}\nDuos: ${duoKD}\nSquads: ${squadKD}`, true)
        .addField("Top 5's", `Total: ${total5}\nSolo: ${solo5}\nDuos: ${duo5}\nSquads: ${squad5}`, true)
        .addField("Matches", `Total: ${totalMatches}\nSolo: ${soloMatches}\nDuos: ${duoMatches}\nSquads: ${squadMatches}`, true)
        .addField("Wins", `Total: ${totalWins}\nSolo: ${soloWins}\nDuos: ${duoWins}\nSquads: ${squadWins}`, true)
        .addField("Top 10's", `Total: ${total10}\nSolo: ${solo10}\nDuos: ${duo10}\nSquads: ${squad10}`, true)
        .addField("Losses", `Total: ${totalLoss}\nSolo: ${soloLoss}\nDuos: ${duoLoss}\nSquads: ${squadLoss}`, true)
        .addField("Hours played", `Total: ${hoursPlayed}\nSolo: ${hoursSolo}\nDuos: ${hoursDuo}\nSquads: ${hoursSquad}`, true)
        .addField("Top 25's", `Total: ${total25}\nSolo: ${solo25}\nDuos: ${duo25}\nSquads: ${squad25}`, true)

    return embed
}