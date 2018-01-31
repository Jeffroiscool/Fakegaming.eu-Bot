const Discord = require("discord.js")
const OverwatchJS = require("overwatch-js")

exports.run = async (client, message, params = [], debug = false) => {
    if (params.length === 0) return
    let stats = await getOverwatchPlayerStats(params[0], params[1], params[2])
    output(stats, message, debug)
}

exports.conf = {
  aliases: ["ow"],
}

exports.help = {
  name: "overwatch", 
  description: "Retrieve player's stats for Overwatch",
  usage: "overwatch [username] (optional: [region] [platform])"
}

function output(input, message, debug = false){
    if(debug){
        console.log(input)
    }else{
        message.channel.send(input)
    }
}

async function getOverwatchPlayerStats(username, region, platform){
    username = username.replace("#", "-")
    if(!region || !platform){
        let data = await OverwatchJS.search(username)
        if (data.length === 0){
            return `No profile found for "${username}"`
        }
        let res = Math.max.apply(Math,data.map(function(o){return o.level}))
        let user = data.find(function(o){ return o.level == res})
        region = user.region
        platform = user.platform
    }
    let data = await OverwatchJS.getOverall(platform, region, username)
    if (data === undefined){
        return `No profile found for ${username}`
    }

    let comp = data.competitive.global

    let winrate = Math.floor((comp.games_won / comp.games_played * 100)) + "%"
    let embed = new Discord.MessageEmbed()
    .setURL(data.profile.url)
    .setAuthor(data.profile.nick, data.profile.rankPicture)
    .setDescription(`[Profile](${data.profile.url}) | [Overbuff](https://www.overbuff.com/players/${platform}/${username}) | [Master Overwatch](https://masteroverwatch.com/profile/${platform}/${region}/${username})\n\n${data.competitive.global.games_played.toLocaleString()} competitive games played (${winrate} won).`)
    .setColor("#FF0000")
    .addField("Level", data.profile.tier + "" + data.profile.level, true)
    .addField("Skill Rating", data.profile.rank, true)
    .addField("Medals", comp.medals.toLocaleString(), true)
    .addField("Eliminations", `Most: ${comp.eliminations_most_in_game.toLocaleString()}\nTotal: ${comp.eliminations.toLocaleString()}`, true)
    .addField("Hero Damage", `Most: ${comp.hero_damage_done_most_in_game || 0}\nTotal: ${comp.hero_damage_done || 0}`, true)
    .addField("Healing", `Most: ${comp.healing_done_most_in_game.toLocaleString()}\nTotal: ${comp.healing_done.toLocaleString()}`, true)
    .addField("Solo Kills", `Most: ${comp.solo_kills_most_in_game.toLocaleString()}\nTotal: ${comp.solo_kills.toLocaleString()}`, true)
    .addField("Final Blows", `Most: ${comp.final_blows_most_in_game.toLocaleString()}\nTotal: ${comp.final_blows.toLocaleString()}`, true)
//    .addField("Environmental", `Most: ${comp.environmental_kills_most_in_game.toLocaleString()}\nTotal: ${comp.environmental_kills.toLocaleString()}`, true)
    .addField("Objective Kills", `Most: ${comp.objective_kills_most_in_game.toLocaleString()}\nTotal: ${comp.objective_kills.toLocaleString()}`, true)
    .addField("Offensive Assists", `Most: ${comp.offensive_assists_most_in_game.toLocaleString()}\nTotal: ${comp.offensive_assists.toLocaleString()}`, true)
    .addField("Defensive Assists", `Most: ${comp.defensive_assists_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.defensive_assists.toLocaleString()}`, true)
    
return embed
}