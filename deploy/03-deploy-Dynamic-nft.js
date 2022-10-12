// imports
const { network, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress

    if (chainId == 31337) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }
    log("----------------------------------------------------------------")

    const lowSvg = fs.readFileSync("./images/dynamic/frown.svg", {
        encoding: "utf8",
    })
    const highSvg = fs.readFileSync("./images/dynamic/happy.svg", {
        encoding: "utf8",
    })

    arguments = [ethUsdPriceFeedAddress, lowSvg, highSvg]

    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying....")
        await verify(dynamicSvgNft.address, arguments)
    }
}
module.exports.tags = ["all", "dynamicSvgNft", "main"]
