// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IZombieBirdContract {
    function mint(address to, uint qty) external returns (bool);
}

contract SpookyBirdsCandy is ERC721A, Ownable, Pausable {

    /**
     * Enums
     */

    enum Phase {
        NULL, // Either haven't start or have ended
        PRE_SALE,    // Stage 1
        PUBLIC_SALE, // Stage 2
        ZOMBIE_BIRD_SALE  // Stage 3
    }

    /**
     * Storage variables
     */

    uint public constant MAX_SUPPLY = 9_776;
    string public _myBaseURI;
    Phase public _currentPhase;
    bytes32 public _currentMerkleRoot;

    // Stage 1 - PRE_SALE
    uint public _presaleMintQty;
    mapping(address => bool) public _hasPresaleAddressSold;

    // Stage 2 - PUBLIC_SALE
    mapping(address => uint) public _publicSaleAirDropAddressQty;
    mapping(address => bool) public _hasPublicSaleAddressClaimed;

    // Stage 3 - ZOMBIE_SALE
    IZombieBirdContract public _zombieBirdContract;
    bool public _hasZombieContractSet;
    mapping(address => uint) public _addressBoughtZombieBirdQty;
    mapping(address => uint) public _addressBoughtTimestamp;

    /**
     * Events
     */

    event PreSaleMint(address indexed _from, uint indexed timestamp);
    event PublicSaleAirdrop(address indexed _from, uint indexed timestamp, uint qty);
    event PublicSaleClaimAirdrop(address indexed _from, uint indexed timestamp, uint qty);
    event ZombieSaleBurnCandyTokenId(address indexed _from, uint indexed timestamp, uint tokenId);
    event ZombieSaleBurnCandy(address indexed _from, uint indexed timestamp, uint qty);
    event ZombieClaimed(address indexed _from, uint indexed boughtTimestamp, uint indexed claimedTimestamp, uint qty);

    /**
     * Errors
     */

    // Global errors
    error NotCorrectPhase();
    error TotalSupplyHasReached();
    // Presale1 errors
    error PreSaleClosed();
    error PurchasedEtherMustBeCorrect();
    error CannotPurchaseMoreThan1Time();
    error NotAWhitelistedAddress();
    // Public sale errors
    error AddressesLengthMustBeGreaterThan0();
    error AddressesAndQtysLengthAreDifferent();
    error NoPublicSaleAirdrop();
    error CannotClaimMoreThan1Time();
    error ZombieAddressWasSetBefore();
    error ZombieAddressWasNotYetSet();
    // Sell zombie errors
    error CandyQtyMustNotBe0();
    error CandyQtyMustBeInMutiplyOf4();
    error CandyQtyMustBeLessOrEqualToBalance();
    error ZombieNeedsMoreOrEqualTo30DaysToBeClaimed();
    error UnableToMintZombieBird();

    /**
     * Constructor
     */

    constructor(string memory myBaseURI_) ERC721A("Spooky Birds Candy", "Candy") {
        _myBaseURI = myBaseURI_;
    }

    /**
     * Modifiers
     */

    modifier phaseRequired(Phase currentPhase_) {
        if (_currentPhase != currentPhase_) revert NotCorrectPhase();
        _;
    }

    /**
     * Openzeppelin functions
     */

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * ERC721A functions
     */

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal whenNotPaused override{
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }

    function _baseURI() internal view override returns (string memory) {
        return _myBaseURI;
    }

    function setBaseURI(string memory myBaseURI_) external onlyOwner {
        _myBaseURI = myBaseURI_;
    }

    /**
     * Customize functions - utility functions
     */

    function setPhase(Phase currentPhase_, bytes32 currentMerkleRoot_) external onlyOwner {
        _currentPhase = currentPhase_;
        _currentMerkleRoot = currentMerkleRoot_;
    }

    /**
     * 99_076 Gas unit per IF MINT 1 tokenid
     * At 1773.94 usd/eth,  3.69 USD per call TO MINT 1 tokenid
     */

    function mint(address to, uint256 qty) external onlyOwner {
        if ((totalSupply() + qty) > MAX_SUPPLY) revert TotalSupplyHasReached();
        _safeMint(to, qty);
    }

    /**
     * 63_728 Gas unit per function call
     * At 1)773.69 usd/eth,  2.37 USD per call
     */

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * 155_017 Gas unit per function call
     * At 1_762.05 usd/eth, 5.74 USD per call
     *
     * Customize functions - PRE_SALE functions
     * 1 - Allow 222 different whitelisted addresses to buy candy.
     * 2 - Every address can only buy 4 candies with 0.276 Ether in 1 purchase.
     */

    function presaleMint(bytes32[] calldata proof_) external payable phaseRequired(Phase.PRE_SALE) {
        if (!MerkleProof.verify(proof_, _currentMerkleRoot, keccak256(abi.encodePacked(msg.sender)))) revert NotAWhitelistedAddress();
        if (totalSupply() >= MAX_SUPPLY) revert TotalSupplyHasReached();
        // While testing, comment the next line and use this line => if (_presaleMintQty >= 4) revert PreSaleClosed();
        if (_presaleMintQty >= 888) revert PreSaleClosed();
        if (msg.value != 0.276 ether) revert PurchasedEtherMustBeCorrect();
        if (_hasPresaleAddressSold[msg.sender]) revert CannotPurchaseMoreThan1Time();
        _presaleMintQty = _presaleMintQty + 4;
        _hasPresaleAddressSold[msg.sender] = true;
        _safeMint(msg.sender, 4);
        emit PreSaleMint(msg.sender, block.timestamp);
    }

    /**
     * 52_575 Gas unit per function call
     * At 1766.65 usd/eth, 1.95 USD per call
     * 8_888 Airdrop = 8_888 * 52_575 = 467_286_600, which is more than 30_000_000
     * Recommendation: Call this function 16 times, every time 570 maximum addresses, with 52_575 * 570 = 29_967_750 (May not be accurate)
     * Estimate total cost: 17331.6 USD for 8888 airdrop  (May not be accurate)
     *
     * Customize functions - PUBLIC_SALE functions
     * 1 - Admin airdrops candy(s) to different whitelisted addresses.
     * 2 - User claims his airdropped candy(s).
     */

    function publicSaleAirDrop(address[] calldata addresses_, uint[] calldata qtys_) external onlyOwner phaseRequired(Phase.PUBLIC_SALE) {
        if (addresses_.length == 0) revert AddressesLengthMustBeGreaterThan0();
        if (addresses_.length != qtys_.length) revert AddressesAndQtysLengthAreDifferent();
        for (uint i = 0; i < addresses_.length;) {
            _publicSaleAirDropAddressQty[addresses_[i]] = qtys_[i];
            emit PublicSaleAirdrop(addresses_[i], block.timestamp, qtys_[i]);
            {
            unchecked{++i;} // Save gas
            }
        }
    }

    function publicMint(bytes32[] calldata proof_) external phaseRequired(Phase.PUBLIC_SALE) {
        if (!MerkleProof.verify(proof_, _currentMerkleRoot, keccak256(abi.encodePacked(msg.sender)))) revert NotAWhitelistedAddress();
        if (_publicSaleAirDropAddressQty[msg.sender] == 0) revert NoPublicSaleAirdrop();
        if (_hasPublicSaleAddressClaimed[msg.sender]) revert CannotClaimMoreThan1Time();
        uint airDropAddressQty = _publicSaleAirDropAddressQty[msg.sender]; // Save gas
        _hasPublicSaleAddressClaimed[msg.sender] = true;
        _safeMint(msg.sender, airDropAddressQty);
        emit PublicSaleClaimAirdrop(msg.sender, block.timestamp, airDropAddressQty);
    }

    /**
     * 210_316 Gas unit per function call
     * At 1_765.66 usd/eth, 7.80 USD per call
     * Recommendation: Call this function with maximum 142 tokenIds, with 142 * 210_316 = 29_864_872 (May not be accurate)
     *
     * Customize functions - ZOMBIE_BIRD_SALE functions
     * 1 - User burns 4 candies to buy a zombie.
     * 2 - Admin need to set zombie bird address (Only can set once).
     * 3 - User claims his bought zombie after 30 days.
     */

    function burnCandyToMintZombieBird(uint[] calldata tokenIds_) external phaseRequired(Phase.ZOMBIE_BIRD_SALE) {
        uint length = tokenIds_.length; // Save gas
        if (length == 0) revert CandyQtyMustNotBe0();
        if (length % 4 != 0) revert CandyQtyMustBeInMutiplyOf4();
        if (length > balanceOf(msg.sender)) revert CandyQtyMustBeLessOrEqualToBalance();
        _addressBoughtZombieBirdQty[msg.sender] = length / 4;
        _addressBoughtTimestamp[msg.sender] = block.timestamp;

        for (uint i = 0; i < tokenIds_.length;) {
            _burn(tokenIds_[i]);
            emit ZombieSaleBurnCandyTokenId(msg.sender, block.timestamp, tokenIds_[i]);
            {
            unchecked{++i;} // Save gas
            }
        }

        emit ZombieSaleBurnCandy(msg.sender, block.timestamp, length);
    }

    function setZombieBirdAddress(address address_) external onlyOwner phaseRequired(Phase.ZOMBIE_BIRD_SALE) {
        if (_hasZombieContractSet) revert ZombieAddressWasSetBefore();
        _zombieBirdContract = IZombieBirdContract(address_);
        _hasZombieContractSet = true;
    }

    function mintZombieBird() external phaseRequired(Phase.ZOMBIE_BIRD_SALE) {
        if (!_hasZombieContractSet) revert ZombieAddressWasNotYetSet();
        uint addressBoughtTimestamp = _addressBoughtTimestamp[msg.sender]; // Save gas
        if (block.timestamp - addressBoughtTimestamp < 2_592_000) revert ZombieNeedsMoreOrEqualTo30DaysToBeClaimed(); // Need more or equal to 30 days
        uint addressBoughtZombieBirdQty = _addressBoughtZombieBirdQty[msg.sender]; // Save gas
        bool canMint = _zombieBirdContract.mint(msg.sender, addressBoughtZombieBirdQty);
        if (!canMint) revert UnableToMintZombieBird();
        emit ZombieClaimed(msg.sender, addressBoughtTimestamp, block.timestamp, addressBoughtZombieBirdQty);
    }
}