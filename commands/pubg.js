const Discord = require("discord.js")
const pubg = require("pubg.js");
const client = new pubg.Client("ff7fc3cb-99cf-416a-afec-0cd9097414bb");
const Fetch = require("node-fetch")

exports.run = async (client, message, params = [], debug = false) => {
    if (params.length === 0) return
    let stats = await getPUBGPlayerStats(params[0], params[1])
    output(stats, message, debug)
}

exports.conf = {
  aliases: [],
}

exports.help = {
  name: "pubg", 
  description: "Retrieve player's stats for PlayerUnknown's Battlegrounds",
  usage: "pubg [username] (optional: [region])"
}

function output(input, message, debug = false){
    if(debug){
        console.log(input)
    }else{
        message.channel.send(input)
    }
}

async function parseMatchType(match){
    switch(match){
        case "solo":
            return "Solo"
        case "solo-fpp":
            return "Solo FPP"
        case "duo":
            return "Duo"
        case "duo-fpp":
            return "Duo FPP"
        case "squad":
            return "Squad"
        case "squad-fpp":
            return "Squad FPP"
        default:
            return "Unknown"
    }
}

async function getPUBGPlayerStats(username, region){
    let stats = await client.getProfile(username)
    if(!region){
        region = "eu"
    }
    let profile = `https://pubgtracker.com/profile/pc/${stats.playerName}?region=${region}`
    let defaultSeason = stats.defaultSeason
    let statsSolo = stats.stats.find(o => o.region === region && o.season === defaultSeason && o.match === "solo")
    let statsSoloFPP = stats.stats.find(o => o.region === region && o.season === defaultSeason && o.match === "solo-fpp")
    let statsDuo = stats.stats.find(o => o.region === region && o.season === defaultSeason && o.match === "duo")
    let statsDuoFPP = stats.stats.find(o => o.region === region && o.season === defaultSeason && o.match === "duo-fpp")
    let statsSquad = stats.stats.find(o => o.region === region && o.season === defaultSeason && o.match === "squad")
    let statsSquadFPP = stats.stats.find(o => o.region === region && o.season === defaultSeason && o.match === "squad-fpp")
    
    let statsArray = new Array (statsSolo, statsSoloFPP, statsDuo, statsDuoFPP, statsSquad, statsSquadFPP)

    let winText = ""
    let killText = ""
    let rankText = ""
    let ratingText = ""
    let kdrText = ""
    let matchesText = ""
    let seasonHighText = ""
    let adrText = ""
    let topText = ""

    for(let stat of statsArray){
        if(stat != undefined){
            let st = stat.stats
            let matchType = await parseMatchType(stat.match)
            let rank = st.find(o => o.name === "BestRank").displayValue
            rankText += `${matchType}: ${rank}\n`
            let rating = st.find(o => o.name === "Rating").displayValue
            ratingText += `${matchType}: ${rating}\n`
            let kdr = st.find(o => o.name === "KillDeathRatio").displayValue
            kdrText += `${matchType}: ${kdr}\n`
            let wins = st.find(o => o.name === "Wins").displayValue
            winText += `${matchType}: ${wins}\n`
            let matches = st.find(o => o.name === "RoundsPlayed").displayValue
            matchesText += `${matchType}: ${matches}\n`
            let seasonHigh = st.find(o => o.name === "BestRating").displayValue
            seasonHighText += `${matchType}: ${seasonHigh}\n`
            let adr = st.find(o => o.name === "DamagePg").displayValue
            adrText += `${matchType}: ${adr}\n`
            top = st.find(o => o.name === "Top10s").displayValue
            topText += `${matchType}: ${top}\n`
            let kills = st.find(o => o.name === "Kills").displayValue
            killText += `${matchType}: ${kills}\n`
        }
    }

    let pubgtop = await Fetch(`http://api.pubgtop.ru:81/api/search/nick/${stats.playerName}`)
    let pubgjson = await pubgtop.json()
    let lifeTimeStats = pubgjson.LifeTimeStats

    let embed = new Discord.MessageEmbed()
    .setURL(profile)
    .setAuthor(stats.playerName, stats.avatar)
    .setDescription(`[PUBGTracker](${profile}) | [PUBG.me](https://pubg.me/player/${stats.playerName})\n\n`)
    .setColor("#FF0000")
    .setFooter(`Last updated: ${stats.lastUpdated.toString()}`)
    .addField("Total Matches", lifeTimeStats.find(o => o.Key === "Matches Played").Value, true)
    .addField("Total Wins", lifeTimeStats.find(o => o.Key === "Wins").Value, true)
    .addField("Total Top 10's", lifeTimeStats.find(o => o.Key === "Top 10s").Value, true)
    .addField("Total Kills", lifeTimeStats.find(o => o.Key === "Kills").Value, true)
    .addField("Total KD Ratio", lifeTimeStats.find(o => o.Key === "K/d").Value, true)
    .addField("Total Heals", lifeTimeStats.find(o => o.Key === "Heals").Value, true)
    .addField("Rank", rankText, true)
    .addField("Kills", killText, true)
    .addField("KD Ratio", kdrText, true)
    .addField("Rating", ratingText, true)
    .addField("Matches", matchesText, true)
    .addField("Wins", winText, true)
    .addField("Season High", seasonHighText, true)
    .addField("ADR", adrText, true)
    .addField("Top 10's", topText, true)

return embed
}