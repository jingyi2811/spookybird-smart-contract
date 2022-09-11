import {ethers} from "hardhat";
import {expect} from "chai";
import keccak256 from "keccak256";
import {MerkleTree} from "merkletreejs";

describe("Presale mint", function () {
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
        const buf2hex = (x: Buffer) => `0x${x.toString('hex')}`

        const SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://bird/");

        await SpookyBirdsCandyMock.connect(admin).setPhase(1, buf2hex(tree.getRoot()));

        {
            const leaf: any = keccak256(account1.address) // Get proof from account1
            account1Proof = tree.getProof(leaf).map(x => buf2hex(x.data))
        }

        {
            const leaf: any = keccak256(account2.address) // Get proof from account1
            account2Proof = tree.getProof(leaf).map(x => buf2hex(x.data))
        }
    });

    describe("Presale mint",  function () {
        it("Should not allow presale mint if total supply >= 9776", async function () {

            // Mint 9776 Candies
            await SpookyBirdsCandyMock.connect(admin).mint(account1.address, 9776);

            // Check total supply, should be = 9776
            expect(await SpookyBirdsCandyMock.totalSupply()).to.be.equal(9776);

            await expect(SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof)).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "TotalSupplyHasReached"
            );
        })

        // To test this code, need to uncomment the code in the solidity file.
        // it("Should not purchase for if qty reached 4", async function () {
        //     await SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.276") });
        //     await expect(SpookyBirdsCandyMock.connect(account2).presaleMint(account2Proof, { value: ethers.utils.parseEther("0.276") })).to.be.revertedWithCustomError(
        //         SpookyBirdsCandyMock,
        //         "PreSaleClosed"
        //     );
        // })

        it("Should not allow presale mint if ether send not equal to 0.276", async function () {
            expect(await SpookyBirdsCandyMock.totalSupply()).to.be.equal(0);
            expect(await SpookyBirdsCandyMock._presaleMintQty()).to.be.equal(0);

            const makeADeposit = await SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.276") });

            expect(await SpookyBirdsCandyMock.totalSupply()).to.be.equal(4);
            expect(await SpookyBirdsCandyMock._presaleMintQty()).to.be.equal(4);

            // Try 0.275
            await expect(SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.275") })).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "PurchasedEtherMustBeCorrect"
            );

            // Try 0.277
            await expect(SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.277") })).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "PurchasedEtherMustBeCorrect"
            );
        })

        it("Should not purchase more than 1 time", async function () {
            const makeADeposit = await SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.276") });
            // Try to buy again
            await expect(SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.276") })).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "CannotPurchaseMoreThan1Time"
            );
        })

        it("Should not purchase for non whitelist address", async function () {
            // Try to buy again
            await expect(SpookyBirdsCandyMock.connect(account2).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.276") })).to.be.revertedWithCustomError(
                SpookyBirdsCandyMock,
                "NotAWhitelistedAddress"
            );
        })

        it("Should able to purchase", async function () {
            const makeADeposit = await SpookyBirdsCandyMock.connect(account1).presaleMint(account1Proof, { value: ethers.utils.parseEther("0.276") });

            expect(await SpookyBirdsCandyMock.totalSupply()).to.be.equal(4);
            expect(await SpookyBirdsCandyMock.balanceOf(account1.address)).to.be.equal(4);
            expect(await SpookyBirdsCandyMock._presaleMintQty()).to.be.equal(4);
            expect(await SpookyBirdsCandyMock._hasPresaleAddressSold(account1.address)).to.be.equal(true);
        })
    });
});
