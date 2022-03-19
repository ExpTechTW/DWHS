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
//#region 同步讀取資料
let User = JSON.parse(fs.readFileSync('./Json/Line/User.json').toString())
let Cache = JSON.parse(fs.readFileSync('./Json/Line/Cache.json').toString())
//#endregion

//#region 變數
let ver = "22w12-pre3"
//#endregion

//#region 初始化
const credentials = { ca: ca, key: privateKey, cert: certificate }
const httpsServer = https.createServer(credentials, app)
const client = linebot({
    channelId: ExpTech.channelId,
    channelSecret: ExpTech.channelSecret,
    channelAccessToken: ExpTech.channelAccessToken
})
const linebotParser = client.parser()
app.post('/webhook', linebotParser)
//#endregion

setInterval(async () => {
    var time = (new Date().getMonth() + 1).toString() + new Date().getDate().toString()
    if (Cache["TimeStamp"] != time && new Date().getHours() >= 6) {
        Cache["TimeStamp"] = time
        fs.writeFileSync('./Json/Line/Cache.json', JSON.stringify(Cache, null, "\t"))
        for (let index = 0; index < User["AllUser"].length; index++) {
            (User["AllUser"][index], "早安")
        }
    }
}, 30000)

//#region 訊息處理區塊
client.on('message', async function (event) {
    if (event.message.text == "即時氣象數據") {
        event.reply("CAAWMS\n複合式全天候自動氣象監測系統\n(Composite All-weather Automatic Weather Monitoring System)\n\n測站: 0001 大灣高中\nPM2.5: N/A\n溫度: N/A\n濕度: N/A\n氣壓: N/A\n\n加速度\nXraw: N/A\nYraw: N/A\nZraw: N/A\n\n陀螺儀\nXnorm: N/A\nYnorm: N/A\nZnorm: N/A\n\n卡爾曼濾波\nX: N/A\nY: N/A\nZ: N/A")
    } else if (event.message.text == "小時精準預報") {
        let data = {
            "APIkey": "a5ef9cb2cf9b0c86b6ba71d0fc39e329",
            "Function": "data",
            "Type": "dwhs-weather-accuweather",
            "FormatVersion": 1
        }
        let res = await API.main(ExpTech, data)
        event.reply(res.data["response"])
    } else if (event.message.text == "氣象局預報") {
        let data = {
            "APIkey": "a5ef9cb2cf9b0c86b6ba71d0fc39e329",
            "Function": "data",
            "Type": "dwhs-weather-cwb",
            "FormatVersion": 1
        }
        let res = await API.main(ExpTech, data)
        event.reply(res.data["response"]["title"].replace("溫度", "\n溫度").replace("降雨機率", "\n降雨機率").replace("%", "%\n"))
    } else if (event.message.text == "最新衛星雲圖") {
        let data = {
            "APIkey": "a5ef9cb2cf9b0c86b6ba71d0fc39e329",
            "Function": "data",
            "Type": "dwhs-weather-cwb",
            "FormatVersion": 1
        }
        let res = await API.main(ExpTech, data)
        await event.reply([{
            type: 'image',
            originalContentUrl: res.data["response"]["picture"],
            previewImageUrl: res.data["response"]["picture"]
        }, {
            type: 'text',
            text: "若預覽出現問題請點擊下方鏈接\n" + res.data["response"]["picture"]
        }])
    } else if (event.message.text == "最新地震") {
        let data = {
            "APIkey": "a5ef9cb2cf9b0c86b6ba71d0fc39e329",
            "Function": "data",
            "Type": "earthquake",
            "FormatVersion": 1
        }
        let res = await API.main(ExpTech, data)
        let response = res.data["response"]["earthquakeReport"]
        event.reply("類型: " + response[0] + "\n時間: " + response[1] + "\n北緯: " + response[2] + "\n東經: " + response[3] + "\n規模: " + response[4] + "\n深度: " + response[5] + "\n位置: " + response[6] + "\n地震報告:\nhttps://www.cwb.gov.tw" + response[7] + "\n輸入 [即時地震] 獲取即時發生的地震")
    } else if (event.message.text == "關於機器人") {
        event.reply("DWHS 天氣小幫手\n(DWHS Weather Helper Service)\n\n版本: " + ver + "\n\n由 JavaScript 開發的 Line 機器人，依賴 ExpTech API Service\n\n• 貢獻者\nwhes1015 - 程式開發\n郭彥銘 - 圖像設計\n\n• 遵守 AGPL-3.0 開源協議\n\n• GitHub\nhttps://github.com/ExpTechTW/DWHS\n• userID\n" + event.source.userId)
    } else if (event.message.text == "即時地震") {
        let data = {
            "APIkey": "a5ef9cb2cf9b0c86b6ba71d0fc39e329",
            "Function": "data",
            "Type": "earthquake",
            "FormatVersion": 1
        }
        let res = await API.main(ExpTech, data)
        let response = res.data["response"]
        await event.reply([{
            type: 'image',
            originalContentUrl: response["map"],
            previewImageUrl: response["map"]
        }, {
            type: 'image',
            originalContentUrl: response["data"],
            previewImageUrl: response["data"]
        }, {
            type: 'image',
            originalContentUrl: response["level"],
            previewImageUrl: response["level"]
        }, {
            type: 'text',
            text: "地震發生後最快 2 分鐘內即可獲取此項數據\n上圖時間為 UT 時間 請自行轉換為 UT+8 (TW 台灣)"
        }, {
            type: 'text',
            text: "若預覽出現問題請點擊下方鏈接\n" + response["map"]
        }])
    }
})
//#endregion

//#region 監聽端口
httpsServer.listen(3000, function () {
    console.log('BOT已啟動')
})
//#endregion