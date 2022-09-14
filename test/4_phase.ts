import {ethers} from "hardhat";
import {expect} from "chai";
import {SpookyBirdsCandy} from '../typechain-types'
import {MerkleTree} from "merkletreejs";
import keccak256 from "keccak256";

describe("Phase", function () {
    let admin: any;
    let account1: any;
    let account2: any;
    let SpookyBirdsCandyFactory: any;;
    let SpookyBirdsCandyMock: any;
    let account1Proof: any;
    let account2Proof: any;
    let tree: any;
    let currentMerkleProof: any;

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();

        const leaves = [account1.address, account2.address].map(x => keccak256(x))
        tree = new MerkleTree(leaves, keccak256, { sortPairs: true })

        currentMerkleProof = tree.getHexRoot();

        const leaf1 = keccak256(account1.address);
        account1Proof = tree.getHexProof(leaf1);

        const leaf2 = keccak256(account2.address);
        account2Proof = tree.getHexProof(leaf2);

        SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy", admin);
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("https://ggwp.com");
    });

    describe("Set Phase", function () {
        it("Should able to set phase", async function () {
            await SpookyBirdsCandyMock.setPhase(0, currentMerkleProof)
            await SpookyBirdsCandyMock.setPhase(1, currentMerkleProof)
            await SpookyBirdsCandyMock.setPhase(2, currentMerkleProof)

            const leaves1 = [account1.address].map(x => keccak256(x))
            const tree1 = new MerkleTree(leaves1, keccak256, { sortPairs: true })

            const leaves2 = [account2.address].map(x => keccak256(x))
            const tree2 = new MerkleTree(leaves2, keccak256, { sortPairs: true })

            await SpookyBirdsCandyMock.setPhase(2, tree1.getHexRoot())
            await SpookyBirdsCandyMock.setPhase(2, tree2.getHexRoot())
        })

        it("Should not be able to set phase if phase no more than 3", async function () {
            await expect(
                SpookyBirdsCandyMock.setPhase(3, currentMerkleProof)
            ).to.be.reverted

            await expect(
                SpookyBirdsCandyMock.setPhase(4, currentMerkleProof)
            ).to.be.reverted
        })

        it('Should not be able to set phase if not owner', async function () {
            await expect(
                SpookyBirdsCandyMock.connect(account1).setPhase(1, currentMerkleProof)
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });
});
