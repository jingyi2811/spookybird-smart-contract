import { ethers } from "hardhat";
import { expect } from "chai";
import { SpookyBirdsCandy, SpookyBirdsCandy__factory } from '../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe("BaseUrl", function () {
    let admin: SignerWithAddress
    let account1: SignerWithAddress
    let account2: SignerWithAddress
    let SpookyBirdsCandyFactory: SpookyBirdsCandy__factory
    let SpookyBirdsCandyMock: SpookyBirdsCandy

    beforeEach(async function () {
        [admin, account1, account2] = await ethers.getSigners();
        SpookyBirdsCandyFactory = await ethers.getContractFactory("SpookyBirdsCandy", admin) as SpookyBirdsCandy__factory;
        SpookyBirdsCandyMock = await SpookyBirdsCandyFactory.deploy("http://ggwp.com");
    });

    describe("SET BASE_URL", function () {
        it("Should able to set base url", async function () {
            expect(
                await SpookyBirdsCandyMock.setBaseURI("http://ggwp.co")
            ).ok;

            // no checking on setting same URL
            expect(
                await SpookyBirdsCandyMock.setBaseURI("http://ggwp.co")
            ).ok;
        })

        it('Should not set the base url - NOT OWNER', async function () {
            await expect(
                SpookyBirdsCandyMock.connect(account2).setBaseURI("http://ggwp.co")
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });
});
