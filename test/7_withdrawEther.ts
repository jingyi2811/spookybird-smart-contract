import {ethers} from "hardhat";
import {expect} from "chai";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";
import {BigNumber} from "ethers";

describe("Deposit", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyFactory: any
    let SpookyBirdsCandyMock: any

    let account1Proof: any

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();
        SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://");

        const leaf: any = keccak256(account1.address) // Get proof from account1
        const addresses = [account1.address];
        const leaves = addresses.map(x => keccak256(x))
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
        const buf2hex = (x: Buffer) => `0x${x.toString('hex')}`

        await SpookyBirdsCandyMock.connect(admin).setPhase(1, buf2hex(tree.getRoot()));
        account1Proof = tree.getProof(leaf).map(x => buf2hex(x.data));
    });

    describe("Should withdraw ether",  function () {
        it("Should able to withdraw", async function () {
            {
                const provider = ethers.provider;
                const balance = await provider.getBalance(SpookyBirdsCandyMock.address);
                console.log(balance)
            }

            await SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.276") });

            {
                const provider = ethers.provider;
                const balance = await provider.getBalance(SpookyBirdsCandyMock.address);
                console.log(balance)
            }

            {
                const provider = ethers.provider;
                const balance = await provider.getBalance(admin.address);
                console.log(balance)
            }

            await SpookyBirdsCandyMock.connect(admin).withdraw()

            {
                const provider = ethers.provider;
                const balance = await provider.getBalance(SpookyBirdsCandyMock.address);
                console.log(balance)
            }

            {
                const provider = ethers.provider;
                const balance = await provider.getBalance(admin.address);
                console.log(balance)
            }
        })
    })

    describe("Should reject deposit",  function () {
        it("Should invoke the payable function", async function () {
            await expect(
                admin.sendTransaction({
                    to: SpookyBirdsCandyMock.address,
                    value: ethers.utils.parseEther("1.0")
                })
            ).to.be.reverted;
        })

        it('should invoke the fallback function', async () => {
            const tx = admin.sendTransaction({
                to: SpookyBirdsCandyMock.address,
                data: "0x",
            });

            await expect(tx).to.be.reverted;
        });
    });
});
