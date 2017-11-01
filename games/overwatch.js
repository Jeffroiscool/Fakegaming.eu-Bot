const Discord = require("discord.js")
const OverwatchJS = require("overwatch-js")

module.exports = {
    getOverwatchStats: async function (username, region, platform) {
        let stats = await getOverwatchPlayerStats(username, region, platform)
        return stats
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

    let winrate = Math.floor((data.competitive.global.games_won / data.competitive.global.games_played * 100)) + "%"
    let embed = new Discord.RichEmbed()
    .setURL(data.profile.url)
    .setAuthor(data.profile.nick, data.profile.rankPicture)
    .setDescription(`[Profile](${data.profile.url}) | [Overbuff](https://www.overbuff.com/players/${platform}/${username}) | [Master Overwatch](https://masteroverwatch.com/profile/${platform}/${region}/${username})\n\n${data.competitive.global.games_played.toLocaleString()} competitive games played (${winrate} won).`)
    .setColor("#FF0000")
    .addField("Level", data.profile.tier + "" + data.profile.level, true)
    .addField("Skill Rating", data.profile.rank, true)
    .addField("Medals", data.competitive.global.medals.toLocaleString(), true)
    .addField("Eliminations", `Most: ${data.competitive.global.eliminations_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.eliminations.toLocaleString()}`, true)
    .addField("Hero Damage", `Most: ${data.competitive.global.hero_damage_done_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.hero_damage_done.toLocaleString()}`, true)
    .addField("Healing", `Most: ${data.competitive.global.healing_done_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.healing_done.toLocaleString()}`, true)
    .addField("Solo Kills", `Most: ${data.competitive.global.solo_kills_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.solo_kills.toLocaleString()}`, true)
    .addField("Final Blows", `Most: ${data.competitive.global.final_blows_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.final_blows.toLocaleString()}`, true)
    .addField("Environmental", `Most: ${data.competitive.global.environmental_kills_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.environmental_kills.toLocaleString()}`, true)
    .addField("Objective Kills", `Most: ${data.competitive.global.objective_kills_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.objective_kills.toLocaleString()}`, true)
    .addField("Offensive Assists", `Most: ${data.competitive.global.offensive_assists_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.offensive_assists.toLocaleString()}`, true)
    .addField("Defensive Assists", `Most: ${data.competitive.global.defensive_assists_most_in_game.toLocaleString()}\nTotal: ${data.competitive.global.defensive_assists.toLocaleString()}`, true)
    
return embed
}