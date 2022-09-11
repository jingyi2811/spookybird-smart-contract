import {ethers} from "hardhat";
import {expect} from "chai";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";

describe("Calculate gas", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyFactory: any
    let SpookyBirdsCandyMock: any
    let account1Proof: any
    let account2Proof: any

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();

        const addresses = [admin.address, account1.address, account2.address];
        const leaves = addresses.map(x => keccak256(x))
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://bird/");

        const buf2hex = x => `0x${x.toString('hex')}`
        await SpookyBirdsCandyMock.connect(admin).setPhase(2, buf2hex(tree.getRoot()));

        {
            const leaf: any = keccak256(account1.address) // Get proof from account1
            account1Proof = tree.getProof(leaf).map(x => buf2hex(x.data))
        }

        {
            const leaf: any = keccak256(account2.address) // Get proof from account1
            account2Proof = tree.getProof(leaf).map(x => buf2hex(x.data))
        }
    });

    describe("Airdrop",  function () {
        it("Should airdrop", async function () {
            await SpookyBirdsCandyMock.connect(admin).publicSaleAirDrop([account1.address], [1])
        })
    });

    describe("Burn candy",  function () {
        it("Should burn", async function () {
            await SpookyBirdsCandyMock.connect(admin).setPhase(3, ethers.utils.formatBytes32String(""));

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
});