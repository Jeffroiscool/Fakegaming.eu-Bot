const Fetch = require('node-fetch')
const Cheerio = require('cheerio')
const Discord = require("discord.js")
const Request = require("request-promise")

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
    let url = `https://fortnitestats.net/stats/${username}`
    let res = await Fetch(url)
    let data = await res.text();
    if(res.ok){
        let $ = Cheerio.load(data)
        let totalKills = $(".panel-green").find("h3").text()
        let soloKills = $("h4:contains('Kills')").eq(0).prev().text()
        let duoKills = $("h4:contains('Kills')").eq(1).prev().text()
        let squadKills = $("h4:contains('Kills')").eq(2).prev().text()

        let overallKD = $(".panel-orange").find("h3").text()
        let soloKD = $("h4:contains('K/D Ratio')").eq(0).prev().text()
        let duoKD = $("h4:contains('K/D Ratio')").eq(1).prev().text()
        let squadKD = $("h4:contains('K/D Ratio')").eq(2).prev().text()
        
        let totalWins = $(".panel-red").find("h3").text()
        let soloWins = $("h4:contains('Wins')").eq(0).prev().text()
        let duoWins = $("h4:contains('Wins')").eq(1).prev().text()
        let squadWins = $("h4:contains('Wins')").eq(2).prev().text()

        let totalMatches = $(".panel-purple").find("h3").text()
        let soloMatches = $("h3:contains('solo Stats')").eq(0).next().text().replace(/[^0-9]/g, '')
        let duoMatches = $("h3:contains('duo Stats')").eq(0).next().text().replace(/[^0-9]/g, '')
        let squadMatches = $("h3:contains('Squad Stats')").eq(0).next().text().replace(/[^0-9]/g, '')
        
        let totalLoss = totalMatches - totalWins
        let soloLoss = soloMatches - soloWins
        let duoLoss = duoMatches - duoWins
        let squadLoss = squadMatches - squadWins

        let hoursPlayed = $(".panel-pink").find("h3").text()

        let overallWinrate = Math.floor(parseInt($(".panel-blue").find("h3").text())) + "%"
        let soloWinrate = Math.floor(soloWins / soloMatches * 100) + "%"
        let duoWinrate = Math.floor(duoWins / duoMatches * 100) + "%"
        let squadWinrate = Math.floor(squadWins / squadMatches * 100) + "%"
        
        let solo5 = $("h4:contains('Top 5')").eq(0).prev().text()
        let duo5 = $("h4:contains('Top 5')").eq(1).prev().text()
        let squad5 = $("h4:contains('Top 5')").eq(2).prev().text()
        let total5 = parseInt(solo5) + parseInt(duo5) + parseInt(squad5)

        let solo10 = $("h4:contains('Top 10')").eq(0).prev().text()
        let duo10 = $("h4:contains('Top 10')").eq(1).prev().text()
        let squad10 = $("h4:contains('Top 10')").eq(2).prev().text()
        let total10 = parseInt(solo10) + parseInt(duo10) + parseInt(squad10)
        
        let solo25 = $("h4:contains('Top 25')").eq(0).prev().text()
        let duo25 = $("h4:contains('Top 25')").eq(1).prev().text()
        let squad25 = $("h4:contains('Top 25')").eq(2).prev().text()
        let total25 = parseInt(solo25) + parseInt(duo25) + parseInt(squad25)

        let lastUpdated = $(".user-info").find("p").text()
        let embed = new Discord.RichEmbed()
            .setURL(url)
            .setDescription(`[Profile](${url})\n\n${totalMatches} total matches played (${overallWinrate} won) over ${Math.floor(hoursPlayed)} hours.`)
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
            .addField("Overall Winrate", `Total: ${overallWinrate}\nSolo: ${soloWinrate}\nDuos: ${duoWinrate}\nSquads: ${squadWinrate}`, true)
            .addField("Top 25's", `Total: ${total25}\nSolo: ${solo25}\nDuos: ${duo25}\nSquads: ${squad25}`, true)

        return embed
    }
    return null
}