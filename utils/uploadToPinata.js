const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataSecretKey = process.env.PINATA_SECRET_KEY

const pinata = pinataSDK(pinataApiKey, pinataSecretKey)

async function storeImages(imagesFilePath) {
    const imagesFullPath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(imagesFilePath)
    // console.log(files)
    let responses = []

    // console.log("Uploading To Pinata...")

    for (fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(
            `${imagesFullPath}/${files[fileIndex]}`
        )
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile)
            responses.push(response)
        } catch (error) {
            console.log(error)
        }
    }
    return { responses, files }
}

async function storeTokenUriMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.log(error)
    }
    return null
}

module.exports = { storeImages, storeTokenUriMetadata }
