import {ethers} from "hardhat";
import {expect} from "chai";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";

describe("Burn and mint zombie bird", function () {
    let admin: any
    let account1: any
    let SpookyBirdsCandyMock: any
    let ZombieBirdFactoryMock: any
    let ZombieBirdFactoryMockFalse: any

    beforeEach(async function () {
        [admin, account1] = await ethers.getSigners();

        const addresses = [admin.address, account1.address];
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

        it("Should burn", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Should get 1 zombie bird
            expect(await SpookyBirdsCandyMock._addressBoughtZombieBirdQty(account1.address)).to.be.equal(1)

            // Check if timestamp matched
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;
            expect(await SpookyBirdsCandyMock._addressBoughtTimestamp(account1.address)).to.be.equal(timestampBefore)

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

            // Get timestamp
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Admin set external zombie bird contract
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(account1.address)

            const now = timestampBefore + 2_591_999
            await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
            await ethers.provider.send('evm_mine', []);

            // Account1 try to mint zombie bird 2 blocks after minting
            expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "ZombieNeedsMoreOrEqualTo30DaysToBeClaimed"
            )
        })

        it("Should not able to mint if fail to mint in zombie contract", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Get timestamp
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Balance should equal to 0
            expect(await SpookyBirdsCandyMock.connect(account1).balanceOf(account1.address)).to.be.equal(0)

            // Admin set external zombie bird contract
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMockFalse.address)

            const now = timestampBefore + 2_592_000
            await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
            await ethers.provider.send('evm_mine', []);

           expect(SpookyBirdsCandyMock.connect(account1).mintZombieBird()).to.be.revertedWithCustomError(
               SpookyBirdsCandyMock,
               "UnableToMintZombieBird"
           )
        })

        it("Should able to mint", async function () {
            // Admin mints 4 candies to account 1
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 4)

            // Get timestamp
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            // Try burn 4 candies
            await SpookyBirdsCandyMock.connect(account1).burnCandyToMintZombieBird([0,1,2,3])

            // Balance should equal to 0
            expect(await SpookyBirdsCandyMock.connect(account1).balanceOf(account1.address)).to.be.equal(0)

            // Admin set external zombie bird contract
            await SpookyBirdsCandyMock.connect(admin).setZombieBirdAddress(ZombieBirdFactoryMock.address)

            const now = timestampBefore + 2_592_000
            await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
            await ethers.provider.send('evm_mine', []);

            await SpookyBirdsCandyMock.connect(account1).mintZombieBird()
        })
    });
});