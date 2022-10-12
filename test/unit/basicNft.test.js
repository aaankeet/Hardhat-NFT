const { assert } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Unit Test", function () {
          let basicNft, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicNft"])
              basicNft = await ethers.getContract("BasicNFT")
          })
          describe("Constructor", () => {
              it("initializes the BasicNft correctly", async function () {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })
          describe("Mint NFT", () => {
              it("let you mint an nft", async function () {
                  const txResponse = await basicNft.mintNft()
                  await txResponse.wait(1)

                  const tokenUri = await basicNft.TOKEN_URI()
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
                  assert.equal(tokenUri, await basicNft.TOKEN_URI())
              })
          })
      })

//       describe("Mint NFT", () => {
//         beforeEach(async () => {
//             const txResponse = await basicNft.mintNft()
//             await txResponse.wait(1)
//         })
//         it("Allows users to mint an NFT, and updates appropriately", async function () {
//             const tokenURI = await basicNft.tokenURI(0)
//             const tokenCounter = await basicNft.getTokenCounter()

//             assert.equal(tokenCounter.toString(), "1")
//             assert.equal(tokenURI, await basicNft.TOKEN_URI())
//         })
//         it("Show the correct balance and owner of an NFT", async function () {
//             const deployerAddress = deployer.address
//             const deployerBalance = await basicNft.balanceOf(deployerAddress)
//             const owner = await basicNft.ownerOf("0")

//             assert.equal(deployerBalance.toString(), "1")
//             assert.equal(owner, deployerAddress)
//         })
//     })
// })
