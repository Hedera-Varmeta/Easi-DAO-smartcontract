// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../OpenzeppelinUpgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../OpenzeppelinUpgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC721/extensions/ERC721VotesUpgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "../OpenzeppelinUpgradeable/access/OwnableUpgradeable.sol";

contract ERC721VotesStandard is
    ERC721Upgradeable,
    EIP712Upgradeable,
    ERC721VotesUpgradeable,
    ERC721URIStorageUpgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable
{
    // Base URI
    string private _baseUri;

    function initialize(
        string calldata name,
        string calldata symbol,
        string memory baseUri,
        address newOwner
    ) public initializer returns (bool) {
        __ERC721_init(name, symbol);
        __EIP712_init(name, "1");
        __ERC721Votes_init();
        __Ownable_init();
        _setBaseURI(baseUri);
        transferOwnership(newOwner);
        return true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function safeMint(
        address to,
        string memory tokenUri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        require(tokenId > 0, "tokenId must be a number");
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
        return tokenId;
    }

    function mint(
        address to,
        string memory tokenUri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        require(tokenId > 0, "tokenId must be a number");
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
        return tokenId;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721VotesUpgradeable) {
        super._afterTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not owner nor approved"
        );
        _burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _setBaseURI(string memory baseUri) internal {
        _baseUri = baseUri;
    }

    function setTokenURI(uint256 tokenId, string memory newTokenURI) external {
        super._setTokenURI(tokenId, newTokenURI);
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }
}
