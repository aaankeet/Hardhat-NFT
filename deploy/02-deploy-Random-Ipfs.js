const { network } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify")
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata")
require("dotenv").config()

const FUND_AMOUNT = "1000000000000000000000"
const imagesLocation = "./images/RandomNFT"

const metaDataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "cute",
            value: 100,
        },
    ],
}

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let tokenUris = [
        "ipfs://Qma9WLomtjAsd13fBegjHt7cr7kyBw34gVt4n4LXgBJmpe",
        "ipfs://QmbAyNEqWq8RbVDpJKtfFe7aXwpusSDStCJjDNrxfDR2XB",
        "ipfs://QmdhWTWHHpoSrT2pMQPwXzJ6vaDPWGh7pEds6oHGshkHCn",
    ]

    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (chainId == 31337) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const txResponse = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        // fund the subscrition
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    if (chainId == 31337) {
        await vrfCoordinatorV2Mock.addConsumer(
            subscriptionId,
            randomIpfsNft.address
        )
    }

    log("-------------------------------------------------------")

    // await storeImages(imagesLocation)

    const arguments = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("-------------------------------------------------------")
    // verifying the deployment
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(randomIpfsNft.address, arguments)
    }

    async function handleTokenUris() {
        tokenUris = []
        // store images to ipfs
        // upload metadata to ipfs
        const { responses: imageUploadResponses, files } = await storeImages(
            imagesLocation
        )
        for (imageUploadResponseIndex in imageUploadResponses) {
            // create Metadata
            // upload Metadata
            let tokenUriMetadata = { ...metaDataTemplate }
            tokenUriMetadata.name =
                files[imageUploadResponseIndex].replace(".png")
            tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
            tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
            console.log(`Uploading ${tokenUriMetadata.name}...`)
            // store JSON  to Ipfs/pinata
            const metadataUploadResponse = await storeTokenUriMetadata(
                tokenUriMetadata
            )
            tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`) // pushing images hash to tokenUri
        }
        console.log("Token Uris Uploaded! They are:")
        console.log(tokenUris)
        return tokenUris
    }
}
module.exports.tags = ["all", "randomIpfsNft", "main"]
