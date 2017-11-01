const translate = require('google-translate-api');

module.exports = {
    translate: async function (from, to, message) {
        let translated = await translate(message, {from: from, to: to})
        return translated.text
    }
}