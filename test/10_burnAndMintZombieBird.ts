import {ethers} from "hardhat";
import {expect} from "chai";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";
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
        it("Should not burn if user try to burn 0 candy", async function () {
            // Try burn 0 candy
            await expect(SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "CandyQtyMustNotBe0"
            );
        })

        it("Should not burn if user try to burn non multiiplier of 4 candy", async function () {
            // Admin mints 5 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 5)

            // Check balance of account 1, which is = 5
            expect(await SpookyBirdsCandyMock.balanceOf(account1.address)).to.be.equal(5)

            // Try burn 5 candies
            await expect(SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3,4])).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "CandyQtyMustBeInMutiplyOf4"
            );
        })

        it("Should not burn if user try to burn the candy qty more than balance", async function () {
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

        it("Should burn - #1", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Should get 1 zombie bird
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)

            // Check if timestamp matched
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(timestampBefore)

            // Check if candry all burned
            expect(await SpookyBirdsCandyMock.connect(account1).balanceOf(account1.address)).to.be.equal(0)
        })

        it("Should burn - #2", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 8)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])
            // Check if timestamp matched
            const blockNumBefore1 = await ethers.provider.getBlockNumber();
            const blockBefore1 = await ethers.provider.getBlock(blockNumBefore1);
            const timestampBefore1 = blockBefore1.timestamp;

            // Try burn 4 candies again
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7])
            // Check if timestamp matched
            const blockNumBefore2 = await ethers.provider.getBlockNumber();
            const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
            const timestampBefore2 = blockBefore2.timestamp;

            // Should get 2 zombie birds
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address,0)).to.be.equal(1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address,1)).to.be.equal(1)

            // Check if timestamp matched
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address,0)).to.be.equal(timestampBefore1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address,1)).to.be.equal(timestampBefore2)

            // Check if candry all burned
            expect(await SpookyBirdsCandyMock.connect(account1).balanceOf(account1.address)).to.be.equal(0)
        })
    });

    describe("Admin set external zombie bird contract",  function () {
        it("Should not able to update contract if not the admin", async function () {
            await expect(SpookyBirdsCandyMock.connect(account1).setZombieBirdAddress(account1.address)).to.be.reverted
        })

        it("Should not able to update contract was set before", async function () {
            expect(await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(account1.address))

            await expect(SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(account1.address)).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "ZombieAddressWasSetBefore"
            )
        })

        it("Should able to set contract", async function () {
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(account1.address)
        })
    });

    describe("Mint zombie bird",  function () {
        it("Should not be able to mint if external zombie bird contract was not set", async function () {
            expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "ZombieAddressWasNotYetSet"
            )
        })

        it("Should not be able to mint if burn before within 30 days", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            const timestamp = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(timestamp);
            const timestampBefore = blockBefore.timestamp;

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Should get 1 zombie bird
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(1)

            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            const now = timestampBefore + 2 + 2_592_000 - 1
            await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
            await ethers.provider.send('evm_mine', []);

            expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieCanBeClaimed"
            )
        })

        it("Should not be able to burn if not tokenid", async function () {
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

        it("Should able to mint if burn has taken 30 days", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Should get 0 zombie bird, timestamp and times
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

            const now = timestamp + 2 + 2_592_000
            await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
            await ethers.provider.send('evm_mine', []);

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()
        })

        it("Should burn #1", async function () {
            // Admin mints 12 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 12)

            // Should get 0 zombie bird, timestamp and times
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtQtys(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(0)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimes(account1.address)).to.be.equal(0)

            const timestamp = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            {
                const now = timestamp + 2 + 86_400
                await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
                await ethers.provider.send('evm_mine', []);
            }

            // Try burn 8 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7,8,9,10,11])

            {
                const now = timestamp + 2 + 2_592_000
                await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
                await ethers.provider.send('evm_mine', []);
            }

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            {
                const now = timestamp + 2 + 2_592_000 + 86400
                await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
                await ethers.provider.send('evm_mine', []);
            }

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()
        })

        it("Should burn #2", async function () {
            // Admin mints 24 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 24)

            // Get timestamp
            const timestamp = await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            {
                const now = timestamp + 2 + 86_400
                await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
                await ethers.provider.send('evm_mine', []);
            }

            // Try burn 8 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7,8,9,10,11])

            {
                const now = timestamp + 2 + 86_400 + 86400
                await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
                await ethers.provider.send('evm_mine', []);
            }

            // Try burn 8 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([12,13,14,15,16,17,18,19])

            {
                const now = timestamp + 2 + 2_592_000
                await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
                await ethers.provider.send('evm_mine', []);
            }

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            {
                const now = timestamp + 2 + 2_592_000 + 86400 + 86400
                await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
                await ethers.provider.send('evm_mine', []);
            }

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()
        })

        it("Should burn #3", async function () {
            // Admin mints 24 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 24)

            // Get timestamp
            const timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

            // Wait for 1 day
            const now1 = timestamp + 86400 * 1
            await helpers.time.increaseTo(now1);

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Wait for 2 more days
            const now2 = timestamp + 86400 * 3
            await helpers.time.increaseTo(now2);

            // Try burn 8 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([4,5,6,7,8,9,10,11])

            // Wait for 5 more days
            const now3 = timestamp + 86400 * 5
            await helpers.time.increaseTo(now3);

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([20,21,23,22])

            // Wait for 5 more days
            const now4 = timestamp + 86400 * 10
            await helpers.time.increaseTo(now4);

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
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 0)).to.be.equal(now1+1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 1)).to.be.equal(now2+1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 2)).to.be.equal(now3+1)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtTimestamps(account1.address, 3)).to.be.equal(now4+1)

            // Check hasDistributed, all should be false
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 2)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 3)).to.be.equal(false)

            // Wait for 30 days
            {
                const time = timestamp + 86400 * 30
                await helpers.time.increaseTo(time);
            }

            // Set external address
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            // Try to mint at 30th day, should fail
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieCanBeClaimed"
            );

            // Wait for 1 more day
            {
                const time = timestamp + 86400 * 31
                await helpers.time.increaseTo(time);
            }

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
                "NoZombieCanBeClaimed"
            )

            // Wait for 1 more day
            {
                const time = timestamp + 86400 * 32
                await helpers.time.increaseTo(time);
            }

            // Try to mint on the same day again. Should fail.
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieCanBeClaimed"
            )

            // Wait for 1 more day
            {
                const time = timestamp + 86400 * 33
                await helpers.time.increaseTo(time);
            }

            // Should mint
            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            // Should be distributed
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 0)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 1)).to.be.equal(true)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 2)).to.be.equal(false)
            expect(await SpookyBirdsCandyMock._addressZombieBirdBoughtHasDistributed(account1.address, 3)).to.be.equal(false)

            // Wait for 1 more day
            {
                const time = timestamp + 86400 * 34
                await helpers.time.increaseTo(time);
            }

            // Try to mint on the same day again. Should fail.
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieCanBeClaimed"
            )

            // Wait for 10 more day
            {
                const time = timestamp + 86400 * 44
                await helpers.time.increaseTo(time);
            }

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
            {
                const time = timestamp + 86400 * 45
                await helpers.time.increaseTo(time);
            }

            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 8)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([28, 30, 29, 31, 32, 33, 35, 34])

            // Try to mint on the same day again. Should fail.
            await expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NoZombieCanBeClaimed"
            )

            // Wait for 30 more days
            {
                const time = timestamp + 86400 * 75
                await helpers.time.increaseTo(time);
            }

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()

            {
                const time = timestamp + 86400 * 76
                await helpers.time.increaseTo(time);
            }

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()
        })
    });
});