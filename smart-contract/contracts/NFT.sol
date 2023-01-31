// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

/*
    1) Presale -> accessible by only those who have been whitelisted
    2) Public sale

    - total supply for nft: 20
    - presale mint price: 0.05 eth
    - public sale mint price: 0.1 eth
    - presale will be started by the owner and will last for whatever duration is specified (5 minutes)
        - during this time, only the whitelisted people can mint
    - pause
        - incase of any unforeseen conditions
        - only available for the owner
    - during presale
        - check whether the presale started
        - check whether it hasn't ended
        - check whether the minter's address is whitelisted
        - check whether there are any nfts to be minted
        - check whether the eth provided by the minter is enough for minting
        - after all of this _safemint(minter address, tokenId)
    - during public sale
        - check whether the presale started
        - check whether the presale ended
        - check if any nfts are left
        - check if enough eth was provided
        - _safemint(minter address, tokenId)
    - withdraw
        - owner should be able to withdraw all the funds in the contract
    - receive and fallback to get eth from minters
*/

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import './IWhitelist.sol';

/*
    @todo: work on adding the base uri
*/
contract NFT is ERC721, Ownable {
    event PresaleStarted(uint256 indexed _startTime);
    event Mint(address indexed _to, uint256 indexed _tokenId);

    uint256 public maxTokenId = 20;
    uint256 public tokenId = 1;
    uint256 public presaleMintPrice = 0.05 ether;
    uint256 public mintPrice = 0.1 ether;
    bool public presaleStarted;
    uint256 public presaleStartTime;
    uint256 public totalPresaleTime = 5 minutes;
    uint256 public presaleEndTime;
    bool public paused;
    mapping(address => uint256) public ownerToTokenId;

    IWhitelist whitelist;

    /**
     * @dev ERC721 token takes in a 'name' and a 'symbol' to the token collection.
     * constructor takes in the name, symbol, baseURI and whitelist contract address
     * initializes the instance of the whitelist contract
     * TODO: add baseURL functionality
     */
    constructor(string memory _name, string memory _symbol, address whitelistAddress) ERC721(_name, _symbol) {
        whitelist = IWhitelist(whitelistAddress);
    }

    /**
     * @dev will check if the contract is in paused stated or not
     */
    modifier OnlyIfNotPaused() {
        require(!paused, "contract is currently in paused state");
        _;
    }

    /**
     * @dev only the owner can call this function, will start the presale
     * if it hasn't already been started
     */
    function startPresale() public onlyOwner {
        require(!presaleStarted, "presale has already been initiated");
        presaleStartTime = block.timestamp;
        presaleEndTime = presaleStartTime + totalPresaleTime;
        presaleStarted = true;
        emit PresaleStarted(presaleStartTime);
    }

    /**
     * @dev only be executed if the contract is not in paused state
     * and is used for minting the collection by the whitelisted addresses
     */
    function presaleMint() public payable OnlyIfNotPaused {
        require(presaleStarted, "presale hasn't started yet");
        require(block.timestamp < presaleEndTime, "presale ended, mint in public sale");
        require(tokenId <= maxTokenId, "sold out");
        require(whitelist.whitelistedAddresses(msg.sender), "you are not on the whitelist, wait for the public sale");
        require(ownerToTokenId[msg.sender] == 0, "one mint per address allowed");
        require(msg.value >= presaleMintPrice, "add more eth to mint");

        _safeMint(msg.sender, tokenId);
        emit Mint(msg.sender, tokenId);
        ownerToTokenId[msg.sender] = tokenId;
        tokenId += 1;
    }

    /**
     * @dev executed once the presale has ended and the public sale has initiated
     */
    function mint() public payable OnlyIfNotPaused {
        require(presaleStarted, "presale hasn't started yet");
        require(block.timestamp >= presaleEndTime, "presale hasn't ended yet, please wait");
        require(tokenId <= maxTokenId, "sold out");
        require(ownerToTokenId[msg.sender] == 0, "one mint per address allowed");
        require(msg.value >= mintPrice, "add more eth to mint");

        _safeMint(msg.sender, tokenId);
        emit Mint(msg.sender, tokenId);
        ownerToTokenId[msg.sender] = tokenId;
        tokenId += 1;
    }

    /**
     * @dev function used to transfer all the funds from this contract to the owner's wallet
     * only callable by the owner
     */
    function withdraw() public onlyOwner {
        (bool success, ) = msg.sender.call{
            value: address(this).balance
        }("");
        require(success, "couldn't transfer funds from contract to owner");
    }

    /**
     * @dev will set the contract in a paused state
     * only callable by the owner
     * @param _value used to set the paused variable
     */
    function setPause(bool _value) public onlyOwner {
        paused = _value;
    }

    receive() external payable {}
    fallback() external payable {}
}