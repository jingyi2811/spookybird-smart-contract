import {ethers} from "hardhat";
import {expect} from "chai";
import {SpookyBirdsCandy} from '../typechain-types'
import {MerkleTree} from "merkletreejs";
import keccak256 from "keccak256";

describe("Mint", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyMock: any
    let account1Proof: any
    let account2Proof: any
    let tree: any;

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();

        const leaves = [account1.address, account2.address].map(x => keccak256(x))
        tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        const leaf1 = keccak256(account1.address);
        account1Proof = tree.getHexProof(leaf1);

        const leaf2 = keccak256(account2.address);
        account2Proof = tree.getHexProof(leaf2);

        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy", admin);
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("https://ggwp.com");

        await SpookyBirdsCandyMock.setPhase(2, tree.getHexRoot());

        await SpookyBirdsCandyMock.publicMintAirDrop([account1.address, account2.address], [4_887, 4_887]);

        await SpookyBirdsCandyMock.connect(account1).publicMint(account1Proof)
        await SpookyBirdsCandyMock.connect(account2).publicMint(account2Proof)
    });

    describe("Mint", function () {
        it("Should mint", async function () {
            await SpookyBirdsCandyMock.mint(account1.address, 1)
            expect(await SpookyBirdsCandyMock.ownerOf(9_774)).to.be.equal(account1.address);
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_775)

            await SpookyBirdsCandyMock.mint(account2.address, 1)
            expect(await SpookyBirdsCandyMock.ownerOf(9_775)).to.be.equal(account2.address);
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_776)
        })

        it("Should not mint if total supply has reached", async function () {
            await SpookyBirdsCandyMock.mint(account1.address, 1)
            expect(await SpookyBirdsCandyMock.ownerOf(0)).to.be.equal(account1.address)
            await SpookyBirdsCandyMock.mint(account1.address, 1)
            expect(await SpookyBirdsCandyMock.ownerOf(0)).to.be.equal(account1.address)
            await expect(
                SpookyBirdsCandyMock.mint(account1.address, 1)
            ).to.be.revertedWithCustomError(SpookyBirdsCandyMock, 'TotalSupplyHasReached')
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_776)
        })

        it("Should not mint if not owner", async function () {
            await expect(
                SpookyBirdsCandyMock.connect(account2).mint(account1.address, 1)
            ).to.be.revertedWith('Ownable: caller is not the owner');
        })
    });
});
