const { assert, expect } = require("chai")
const { network, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random NFT Tests", async function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock, mintFee, moddedRng

          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "randomIpfsNft"])
              randomIpfsNft = await ethers.getContract(
                  "RandomIpfsNft",
                  deployer
              )
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock"
              )
              mintFee = await randomIpfsNft.getMintFee()
          })
          describe("Constructor", async () => {
              it("sets the constructor values correctly", async function () {
                  const dogTokenUri = await randomIpfsNft.getDogTokenUris(0)
                  assert(dogTokenUri.includes, "ipfs://")
              })
              it("check token counter is zero", async () => {
                  const getTokenCounter = await randomIpfsNft.getTokenCounter()
                  assert.equal(getTokenCounter.toString(), "0")
              })
          })
          describe("Request Nft", async () => {
              it("Reverts when you dont provide enough ETH", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreEth"
                  )
              })
              it("emits an event when an nft is requested", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  expect(
                      await randomIpfsNft.requestNft({ value: fee.toString() })
                  ).to.emit("RandomIpfsNft", "NftRequested")
              })
          })
          describe("ModdedRng", async function () {
              it("reverts if moddedrng is bigger than 99", async () => {
                  if (moddedRng > 99) {
                      expect(
                          await randomIpfsNft
                              .getBreedFromModdedRng()
                              .to.be.revertedWith(
                                  "RandomIpfsNft__RangeOutOfBounds"
                              )
                      )
                  }
              })
          })
          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter =
                                  await randomIpfsNft.getTokenCounter()
                              assert.equal(
                                  tokenUri.toString().includes("ipfs://"),
                                  true
                              )
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const requestNftResponse =
                              await randomIpfsNft.requestNft({
                                  value: fee.toString(),
                              })
                          const requestNftReceipt =
                              await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
          describe("getBreedFromModdedRng", () => {
              it("should return pug if moddedRng < 10", async function () {
                  const expectedValue =
                      await randomIpfsNft.getBreedFromModdedRng(7)
                  assert.equal(0, expectedValue)
              })
              it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                  const expectedValue =
                      await randomIpfsNft.getBreedFromModdedRng(21)
                  assert.equal(1, expectedValue)
              })
              it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                  const expectedValue =
                      await randomIpfsNft.getBreedFromModdedRng(77)
                  assert.equal(2, expectedValue)
              })
          })
      })
