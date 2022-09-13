// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

//import "hardhat/console.sol";

interface IZombieBirdContract {
    function mint(address to, uint qty) external returns (bool);
}

contract SpookyBirdsCandy is ERC721AQueryable, Ownable, Pausable {

    /**
     * Enums
     */

    enum Phase {
        NULL, // Either haven't start or have ended (DEFAULT VALUE)
        PRE_SALE,    // Stage 1
        PUBLIC_MINT, // Stage 2
        ZOMBIE_BIRD_MINT  // Stage 3
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

    // Stage 2 - PUBLIC_MINT
    mapping(address => uint) public _publicSaleAirDropAddressQty;

    // Stage 3 - ZOMBIE_BIRD_MINT
    IZombieBirdContract public _zombieBirdContract;
    bool public _hasZombieContractSet;
    mapping(address => uint) public _addressZombieBirdBoughtTimes;
    mapping(address => mapping(uint => uint)) public _addressZombieBirdBoughtQtys;
    mapping(address => mapping(uint => uint)) public _addressZombieBirdBoughtTimestamps;
    mapping(address => mapping(uint => bool)) public _addressZombieBirdBoughtHasDistributed;

    /**
     * Events
     */

    event PreSaleMint(address indexed to, uint indexed timestamp);
    event PublicSaleClaimAirdrop(address indexed to, uint indexed timestamp, uint qty);
    event ZombieSaleBurnCandyTokenId(address indexed to, uint indexed timestamp, uint tokenId);
    event ZombieSaleBurnCandy(address indexed to, uint indexed timestamp, uint qty);
    event ZombieClaimed(address indexed to, uint indexed timestamp, uint qty);

    /**
     * Errors
     */

    // Global errors
    error NotCorrectPhase();
    error TotalSupplyHasReached();
    error NotAWhitelistedAddress();
    // Presale errors
    error PreSaleQtyHasReached();
    error PurchasedEtherMustBeCorrect();
    error CannotPurchaseMoreThan1Time();
    // Public mint errors
    error AddressesAndQtysLengthAreDifferent();
    error NoPublicSaleAirdrop();
    // Zombie mint errors
    error CandyQtyMustNotBe0();
    error CandyQtyMustBeInMutiplyOf4();
    error CandyQtyMustBeLessOrEqualToBalance();
    error IsNotCandyOwner();
    error ZombieAddressWasSetBefore();
    error ZombieAddressWasNotYetSet();
    error NoZombieCanBeClaimed();
    error UnableToMintZombie();

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

    function mint(address to, uint256 qty) external onlyOwner {
        if ((totalSupply() + qty) > MAX_SUPPLY) revert TotalSupplyHasReached();
        _safeMint(to, qty);
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function getCurrentBlockTimestamp() external view returns (uint) {
        return block.timestamp;
    }

    /**
     * 154_995 Gas unit per function call
     * At 1_708.75 usd/eth, 5.56 USD per call (May not be accurate)
     *
     * Customize functions - PRE_SALE functions
     * 1 - Allow 222 different whitelisted addresses to buy candy.
     * 2 - Every address can only buy 4 candies with 0.276 Ether in 1 purchase.
     */

    function presaleMint(bytes32[] calldata proof_) external payable phaseRequired(Phase.PRE_SALE) {
        if (!MerkleProof.verify(proof_, _currentMerkleRoot, keccak256(abi.encodePacked(msg.sender)))) revert NotAWhitelistedAddress();
        if (totalSupply() >= MAX_SUPPLY) revert TotalSupplyHasReached();
        // While testing, comment the next line and use this line => if (_presaleMintQty >= 4) revert PreSaleClosed();
        if (_presaleMintQty >= 888) revert PreSaleQtyHasReached();
        if (msg.value != 0.276 ether) revert PurchasedEtherMustBeCorrect();
        if (_hasPresaleAddressSold[msg.sender]) revert CannotPurchaseMoreThan1Time();
        _presaleMintQty = _presaleMintQty + 4;
        _hasPresaleAddressSold[msg.sender] = true;
        _safeMint(msg.sender, 4);
        emit PreSaleMint(msg.sender, block.timestamp);
    }

    /**
     * 2_990_989 Gas unit per function call by passing in 128 addresses
     * At 1716.11 usd/eth, 107.79 USD per call
     * 8_888 Airdrop = 8_888 / 128 = 69.4375 which is at least 70 times
     * Recommendation: Call this function 70 times, every time 128 addresses
     * Estimate total cost: 70 * 107.79 = 7545.3 USD for 8888 airdrops (May not be accurate)  (See 11_calculateGas.ts)
     *
     * Customize functions - PUBLIC_MINT functions
     * 1 - Admin airdrops candy(s) to different whitelisted addresses. (Could be more than 1 time)
     * 2 - User claims his airdropped candy(s). (Could be more than 1 time)
     */

    function publicSaleAirDrop(address[] calldata addresses_, uint[] calldata qtys_) external onlyOwner phaseRequired(Phase.PUBLIC_MINT) {
        uint addressLength = addresses_.length; // Save gas

        if (addressLength != qtys_.length) revert AddressesAndQtysLengthAreDifferent();
        for (uint i = 0; i < addressLength;) {
            _publicSaleAirDropAddressQty[addresses_[i]] = qtys_[i];
            {
            unchecked{++i;} // Save gas
            }
        }
    }

    function publicMint(bytes32[] calldata proof_) external phaseRequired(Phase.PUBLIC_MINT) {
        if (!MerkleProof.verify(proof_, _currentMerkleRoot, keccak256(abi.encodePacked(msg.sender)))) revert NotAWhitelistedAddress();
        if (_publicSaleAirDropAddressQty[msg.sender] == 0) revert NoPublicSaleAirdrop();
        uint airDropAddressQty = _publicSaleAirDropAddressQty[msg.sender]; // Save gas
        _publicSaleAirDropAddressQty[msg.sender] = 0;
        _safeMint(msg.sender, airDropAddressQty);
        emit PublicSaleClaimAirdrop(msg.sender, block.timestamp, airDropAddressQty);
    }

    /**
     * 2_896_867 Gas unit per function call by passing in maximum 88 tokenIds
     * At 1732.22 usd/eth, 105.38 USD per call (May not be accurate)
     * Recommendation: Call this function with maximum 88 tokenIds (See 11_calculateGas.ts)
     *
     * Customize functions - ZOMBIE_BIRD_SALE functions
     * 1 - User burns 4 candies to buy a zombie.
     * 2 - Admin need to set zombie bird address (Only can set once).
     * 3 - User claims his bought zombie after 30 days.
     */

    function burnCandyToMintZombieBird(uint[] calldata tokenIds_) external phaseRequired(Phase.ZOMBIE_BIRD_MINT) {
        uint length = tokenIds_.length; // Save gas
        if (length == 0) revert CandyQtyMustNotBe0();
        if (length % 4 != 0) revert CandyQtyMustBeInMutiplyOf4();
        if (length > balanceOf(msg.sender)) revert CandyQtyMustBeLessOrEqualToBalance();

        uint times = _addressZombieBirdBoughtTimes[msg.sender];
        _addressZombieBirdBoughtQtys[msg.sender][times] = length / 4;
        _addressZombieBirdBoughtTimestamps[msg.sender][times] = block.timestamp;
        {
        unchecked{++_addressZombieBirdBoughtTimes[msg.sender];} // Save gas
        }

        for (uint i = 0; i < length;) {
            uint tokenId = tokenIds_[i]; // Save gas
            if(ownerOf(tokenId) == msg.sender){
                _burn(tokenId);
            } else {
                revert IsNotCandyOwner();
            }
            emit ZombieSaleBurnCandyTokenId(msg.sender, block.timestamp, tokenId);
            {
            unchecked{++i;} // Save gas
            }
        }

        emit ZombieSaleBurnCandy(msg.sender, block.timestamp, length);
    }

    function setZombieBirdAddress(address address_) external onlyOwner phaseRequired(Phase.ZOMBIE_BIRD_MINT) {
        if (_hasZombieContractSet) revert ZombieAddressWasSetBefore();
        _zombieBirdContract = IZombieBirdContract(address_);
        _hasZombieContractSet = true;
    }

    function mintZombieBird() external phaseRequired(Phase.ZOMBIE_BIRD_MINT) {
        if (!_hasZombieContractSet) revert ZombieAddressWasNotYetSet();
        uint times = _addressZombieBirdBoughtTimes[msg.sender];
        uint addressBoughtZombieBirdQty = 0;

        for (uint i = 0; i < times;) {
            uint addressBoughtTimestamp = _addressZombieBirdBoughtTimestamps[msg.sender][i];
            if (block.timestamp - addressBoughtTimestamp >= 2_592_000 && !_addressZombieBirdBoughtHasDistributed[msg.sender][i]) {
                addressBoughtZombieBirdQty = addressBoughtZombieBirdQty + _addressZombieBirdBoughtQtys[msg.sender][i];
                _addressZombieBirdBoughtHasDistributed[msg.sender][i] = true;
            }
            {
            unchecked{++i;} // Save gas
            }
        }

        if(addressBoughtZombieBirdQty == 0) revert NoZombieCanBeClaimed(); // Need more or equal to 30 days
        //console.log("Qty minted", addressBoughtZombieBirdQty);
        bool canMint = _zombieBirdContract.mint(msg.sender, addressBoughtZombieBirdQty);
        if (!canMint) revert UnableToMintZombie();
        emit ZombieClaimed(msg.sender, block.timestamp, addressBoughtZombieBirdQty);
    }
}