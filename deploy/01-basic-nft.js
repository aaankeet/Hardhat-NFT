const { BaseContract } = require("ethers")
const { hexStripZeros } = require("ethers/lib/utils.js")
const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("------------------------------------------------")

    arguments = []

    const basicNft = await deploy("BasicNFT", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(basicNft.address, arguments)
    }
    log("------------------------------------------------")
}
module.exports.tags = ["all", "basicNft", "main"]
