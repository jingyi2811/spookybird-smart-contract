import {ethers} from "hardhat";
import {expect} from "chai";
import {SpookyBirdsCandy} from '../typechain-types'
import {MerkleTree} from "merkletreejs";
import keccak256 from "keccak256";

describe("Burn", function () {
    let admin: any
    let account1: any
    let account2: any
    let account3: any
    let SpookyBirdsCandyMock: any
    let account1Proof: any
    let account2Proof: any
    let tree: any;

    beforeEach(async function () {
        [admin, account1, account2, account3] = await ethers.getSigners();

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

    describe("Burn", function () {
        it("Should burn", async function () {
            await SpookyBirdsCandyMock.connect(admin).burn(123);
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_773)
       })

        it('Should not burn if not owner', async () => {
            await expect(SpookyBirdsCandyMock.connect(account1).burn(123)).revertedWith('Ownable: caller is not the owner');
            expect(await SpookyBirdsCandyMock.totalSupply()).eq(9_774);
        });
    });
});
