//#region 依賴
const fs = require('fs')
const https = require('https')
const express = require('express')
const linebot = require('linebot')
const app = express()
//#endregion

//#region 本地依賴
const ExpTech = require('./JavaScript/config')
const API = require('./Line/JavaScript/API')

// SSL文件
const privateKey = fs.readFileSync(ExpTech.sslKey, 'ascii')
const certificate = fs.readFileSync(ExpTech.cert, 'ascii')
const ca = fs.readFileSync(ExpTech.ca, 'ascii')
//#endregion

//#region 初始化
const credentials = { ca: ca, key: privateKey, cert: certificate }
const httpsServer = https.createServer(credentials, app)
const bot = linebot({
    channelId: ExpTech.channelId,
    channelSecret: ExpTech.channelSecret,
    channelAccessToken: ExpTech.channelAccessToken
})
const linebotParser = bot.parser()
app.post('/webhook', linebotParser)
//#endregion

//#region 同步讀取資料
let User = JSON.parse(fs.readFileSync('./Line/Json/User.json').toString())
//#endregion

//#region 好友
bot.on('follow', function (event) {
    //#region 儲存用戶ID 廣播用
    if (User["AllUser"].indexOf(event.source.userId) == -1) {
        User["AllUser"].push(event.source.userId)
        //同步儲存 且 格式化 Json
        fs.writeFileSync('./Line/Json/User.json', JSON.stringify(User, null, "\t"))
    }
    //#endregion 
});
//#endregion

setInterval(async () => {

}, 30000)

//#region 訊息處理區塊
bot.on('message', async function (event) {
    //console.log(event)
    if (event.message.text=="天氣") {
        let data = {
            "APIkey": "a5ef9cb2cf9b0c86b6ba71d0fc39e329",
            "Function": "data",
            "Type": "dwhs-weather-cwb",
            "FormatVersion": 1
        }
        let res = await API.main(ExpTech, data)
        console.log(res.data)
        event.reply(res.data["response"]["title"] + "\n\n[最新衛星雲圖]\n" + res.data["response"]["picture"])
    }
});
//#endregion

//#region 監聽端口
httpsServer.listen(3000, function () {
    console.log('BOT已啟動')
})
//#endregion