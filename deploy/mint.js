const { getNamedAccounts, network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    // Mint Basic Nft
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const mintBasicNft = await basicNft.mintNft()
    await mintBasicNft.wait(1)
    console.log(`Basic NFT at index 0 tokenUri: ${await basicNft.tokenURI(0)}`)

    // Mint Dynamic Nft
    const dynamicNft = await ethers.getContract("DynamicSvgNft", deployer)
    const highValue = ethers.utils.parseEther("1000")
    const mintDynamicNft = await dynamicNft.mintNft(highValue)
    await mintDynamicNft.wait(1)
    console.log(
        `Dyanamic NFT at index 0 tokenUri ${await dynamicNft.tokenURI(0)}`
    )

    // Mint Random Nft
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = ethers.utils.parseEther("0.01")
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({
        value: mintFee.toString(),
        gasLimit: "250000",
    })
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
    // Need to listen for response
    await new Promise(async (resolve, reject) => {
        setTimeout(
            () => reject("Timeout: 'NFTMinted' event did not fire"),
            300000
        ) // 5 minute timeout time
        // setup listener for our event
        randomIpfsNft.once("NftMinted", async () => {
            resolve()
        })
        if (chainId == 31337) {
            const requestId =
                randomIpfsNftMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            )
            await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestId,
                randomIpfsNft.address
            )
        }
    })
    console.log(
        `Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`
    )
}
module.exports.tags = ["all", "mint"]
