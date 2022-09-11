import {ethers} from "hardhat";
import {expect} from "chai";

describe("Deposit", function () {
    let admin: any
    let account1: any
    let account2: any
    let SpookyBirdsCandyFactory: any
    let SpookyBirdsCandyMock: any

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();
        SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy");
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://");
    });

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
