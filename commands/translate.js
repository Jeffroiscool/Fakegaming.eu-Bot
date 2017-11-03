const translate = require('google-translate-api');

exports.run = async (client, message, params = [], debug = false) => {
    if (params.length < 3) return
    let translatedMessage = await translate(params.slice(2).join(" "), {from: params[0], to: params[1]})
    output(translatedMessage.text, message, debug)
}

exports.conf = {
  aliases: [],
}

exports.help = {
  name: "translate", 
  description: "Translate messages",
  usage: "translate [from] [to] [message]"
}

function output(input, message, debug = false){
    if(debug){
        console.log(input)
    }else{
        message.channel.send(input)
    }
}