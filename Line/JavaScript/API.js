const axios = require('axios')

async function main(ExpTech, data) {
    return await axios
        .post(ExpTech.APIhost, data)
        .catch((err) => {
            console.log(err)
        })
}

module.exports = {
    main
}