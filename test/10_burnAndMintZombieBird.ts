import {ethers} from "hardhat";
import {expect} from "chai";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";
import {time} from "@nomicfoundation/hardhat-network-helpers";

const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Burn and mint zombie bird", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyMock: any
    let ZombieBirdFactoryMock: any
    let ZombieBirdFactoryMockFalse: any

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();

        const addresses = [admin.address, account1.address, account2.address];
        const leaves = addresses.map(x => keccak256(x))
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://bird/");

        const ZombieBirdFactory = await ethers.getContractFactory("ZombieBird");
        ZombieBirdFactoryMock = await ZombieBirdFactory.deploy();

        const ZombieBirdFalseFactory = await ethers.getContractFactory("ZombieBirdFalse");
        ZombieBirdFactoryMockFalse = await ZombieBirdFalseFactory.deploy();

        await SpookyBirdsCandyMock.connect(admin).setPhase(3, ethers.utils.formatBytes32String(""));
    });

    describe("Burn candy",  function () {
        it("Should burn - #1", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Should get 1 zombie bird
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)

            // Check timestamp
            const timestamp = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(timestamp)

            // Check if candy all burned
            expect(await SpookyBirdsCandyMock.connect(account1).balanceOf(account1.address)).to.be.equal(0)
        })

        it("Should burn - #2", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 8)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])
            const timestamp1 = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Try burn 4 candies again
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7])
            const timestamp2 = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Should get 2 zombie birds, 1 for every time
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address,0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address,1)).to.be.equal(1)

            // Check if timestamp matched
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address,0)).to.be.equal(timestamp1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address,1)).to.be.equal(timestamp2)

            // Check if candy all was burned
            expect(await SpookyBirdsCandyMock.connect(account1).balanceOf(account1.address)).to.be.equal(0)
        })

        it("Should not burn if 0 candy", async function () {
            // Try to burn 0 candy
            await expect(SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "CandyQtyMustNotBe0"
            );
        })

        it("Should not burn if non multiiplier of 4 candies", async function () {
            // Admin mints 5 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 5)

            // Check balance of account 1, which is = 5
            expect(await SpookyBirdsCandyMock.balanceOf(account1.address)).to.be.equal(5)

            // Try to burn 5 candies
            await expect(SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3,4])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "CandyQtyMustBeInMutiplyOf4"
            );
        })

        it("Should not burn if burn the candy qty that is more than balance", async function () {
            // Admin mints 3 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 3)

            // Check balance of account 1, which is = 3
            expect(await SpookyBirdsCandyMock.balanceOf(account1.address)).to.be.equal(3)

            // Try burn 4 candies
            await expect(SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "CandyQtyMustBeLessOrEqualToBalance"
            );
        })
    });

    describe("Set external zombie bird contract",  function () {
        it("Should set contract", async function () {
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(account1.address)
        })

        it("Should not set contract if not the admin", async function () {
            await expect(SpookyBirdsCandyMock.connect(account1).setZombieBirdAddress(account1.address)).to.be.reverted
        })

        it("Should not set contract if it was set before", async function () {
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(account1.address)
            await expect(SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(account1.address)).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "ZombieBirdAddressWasSetBefore"
            )
        })
    });

    describe("Mint zombie bird",  function () {
        it("Should mint #1", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Should get 0 zombie bird, 0 timestamp and 0 times
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimes(account1.address)).to.be.equal(0)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])
            const timestamp = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Should get 1 zombie bird
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(timestamp)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimes(account1.address)).to.be.equal(1)

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            await helpers.time.increaseTo(timestamp + 86400 * 30);

            // Should be able to mint after 30 days
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Check final result
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(true)
        })

        it("Should mint #2", async function () {
            // Admin mints 12 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 12)
            const timestamp = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Should get 0 zombie bird, 0 timestamp and 0 times
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimes(account1.address)).to.be.equal(0)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            await helpers.time.increaseTo(timestamp + 86400);

            // Try burn 8 candies after 1 day
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7,8,9,10,11])

            await helpers.time.increaseTo(timestamp + 86400 * 30);

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            // Try to mint after 30 days from the first mint
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            await helpers.time.increaseTo(timestamp + 86400 * 31);

            // Try to mint after 30 days from the second mint
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Check final result
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 1)).to.be.equal(2)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(true)
        })

        it("Should mint #3", async function () {
            // Admin mints 24 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 24)
            const timestamp = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            await helpers.time.increaseTo(timestamp + 86400);

            // Try burn 8 candies after 1 day
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7,8,9,10,11])

            await helpers.time.increaseTo(timestamp + 86400 * 2);

            // Try burn 8 candies after 2 days
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([12,13,14,15,16,17,18,19])

            await helpers.time.increaseTo(timestamp + 86400 * 30);

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            // Try to mint after 30 days from the third mint
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            await helpers.time.increaseTo(timestamp + 86400 * 32);

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Check final result
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 1)).to.be.equal(2)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 2)).to.be.equal(2)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 2)).to.be.equal(true)
        })

        it("Should mint #4", async function () {
            // Admin mints 24 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 24)
            const timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Wait for 1 day
            await helpers.time.increaseTo(timestamp + 86400);

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Wait for 2 more days
            await helpers.time.increaseTo(timestamp + 86400 * 3);

            // Try burn 8 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7,8,9,10,11])

            // Wait for 5 more days
            await helpers.time.increaseTo(timestamp + 86400 * 5);

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([20,21,23,22])

            // Wait for 5 more days
            await helpers.time.increaseTo(timestamp + 86400 * 10);

            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([12,14,15,13])

            // Check statuses
            // Total times = 4
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimes(account1.address)).to.be.equal(4)

            // Bought qty => 1, 2, 1, 1
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 1)).to.be.equal(2)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 2)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 3)).to.be.equal(1)

            // Check timestamp
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(timestamp + 86400 + 1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 1)).to.be.equal(timestamp + 86400 * 3 + 1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 2)).to.be.equal(timestamp + 86400 * 5 + 1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 3)).to.be.equal(timestamp + 86400 * 10 + 1)

            // Check hasDistributed, all should be false
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 2)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 3)).to.be.equal(false)

            // Wait for 30 days from the first mint
            await helpers.time.increaseTo(timestamp + 86400 * 30);

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            // Try to mint at 30th day, should fail
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieBirdCanBeClaimed"
            );

            // Wait for 1 more day
            await helpers.time.increaseTo(timestamp + 86400 * 31);

            // Mint at 31th day
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Should be distributed
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 2)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 3)).to.be.equal(false)

            // Try to mint on the same day again. Should fail.
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieBirdCanBeClaimed"
            )

            // Wait for 1 more day
            await helpers.time.increaseTo(timestamp + 86400 * 32);

            // Try to mint on the same day again. Should fail.
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieBirdCanBeClaimed"
            )

            await helpers.time.increaseTo(timestamp + 86400 * 33);

            // Should mint
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Should be distributed
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 2)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 3)).to.be.equal(false)

            // Wait for 1 more day
            await helpers.time.increaseTo(timestamp + 86400 * 34);

            // Try to mint on the same day again. Should fail.
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieBirdCanBeClaimed"
            )

            // Wait for 10 more day
            await helpers.time.increaseTo(timestamp + 86400 * 44);

            // Should mint
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Should be distributed
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 2)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 3)).to.be.equal(true)

            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([24, 25, 27, 26])

            // Wait for 1 more day
            await helpers.time.increaseTo(timestamp + 86400 * 45);

            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 8)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([28, 30, 29, 31, 32, 33, 35, 34])

            // Try to mint on the same day again. Should fail.
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieBirdCanBeClaimed"
            )

            // Wait for 30 more days
            await helpers.time.increaseTo(timestamp + 86400 * 75);

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Wait for 1 more day
            await helpers.time.increaseTo(timestamp + 86400 * 76);

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()
        })

        it("Should not be able to mint if external zombie bird contract was not set", async function () {
            expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "ZombieBirdAddressWasNotYetSet"
            )
        })

        it("Should not be able to mint if burned a few minutes ago", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Should get 1 zombie bird
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)

            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieBirdCanBeClaimed"
            )
        })

        it("Should not be able to mint if not the candy owner", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Admin mints 4 candies to account 2
            await SpookyBirdsCandyMock.connect(admin).mint(account2.address, 4)

            // Should fail if burn 0,1,2,3 by account 2
            await expect(SpookyBirdsCandyMock.connect(account2).burnCandyToMintZombieBird([0,1,2,3])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "IsNotCandyOwner"
            );

            // Should fail if burn 4,5,6,7 by account 1
            await expect(SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "IsNotCandyOwner"
            );
        })
    });
});