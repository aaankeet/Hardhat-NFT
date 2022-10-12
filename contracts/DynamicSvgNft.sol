//SPDX-License-Identifier: Mit

//Imports
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

pragma solidity ^0.8.0;

error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract DynamicSvgNft is ERC721 {
    //State Variables
    uint256 private s_tokenCounter;
    string private s_lowImageUri;
    string private s_highImageUri;

    AggregatorV3Interface internal immutable i_priceFeed;

    mapping(uint256 => int256) private s_tokenIdToHighValue;
    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("DynamicSvgNft", "DSN") {
        s_tokenCounter = 0;
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
        s_lowImageUri = svgToImageUri(lowSvg);
        s_highImageUri = svgToImageUri(highSvg);
    }

    function mintNft(int256 highValue) public payable {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function svgToImageUri(string memory svg)
        public
        pure
        returns (string memory)
    {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = s_lowImageUri;

        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = s_highImageUri;
        }
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(), // you can add whatever name here
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return i_priceFeed;
    }

    function getLowImageUri() public view returns (string memory) {
        return s_lowImageUri;
    }

    function getHighImageUri() public view returns (string memory) {
        return s_highImageUri;
    }
}
