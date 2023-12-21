// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "../OpenzeppelinUpgradeable/access/OwnableUpgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "../OpenzeppelinUpgradeable/utils/AddressUpgradeable.sol";

contract Treasury is
    OwnableUpgradeable,
    ERC721HolderUpgradeable,
    ERC1155HolderUpgradeable
{
    using AddressUpgradeable for address payable;

    function initialize(
        address timeLockAddress
    ) public initializer returns (bool) {
        __Ownable_init();

        _transferOwnership(timeLockAddress);

        return true;
    }

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override(ERC721HolderUpgradeable) returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155ReceiverUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC1155Receiver-onERC1155Received}.
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev See {IERC1155Receiver-onERC1155BatchReceived}.
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function releaseERC20(
        address to,
        uint256 amount,
        address voteToken
    ) public onlyOwner {
        IERC20Upgradeable(voteToken).transfer(to, amount);
    }

    function releaseERC721(
        address from,
        address to,
        uint256 tokenId,
        address tokenAddress
    ) public onlyOwner {
        IERC721Upgradeable(tokenAddress).transferFrom(from, to, tokenId);
    }

    function releaseERC1155(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        address tokenAddress,
        bytes memory data
    ) public onlyOwner {
        IERC1155Upgradeable(tokenAddress).safeTransferFrom(
            from,
            to,
            tokenId,
            amount,
            data
        );
    }

    function releaseNativeToken(address to, uint256 amount) public onlyOwner {
        require(address(this).balance > amount, "Insufficient balance");
        require(amount > 0, "Invalid amount");
        payable(to).sendValue(amount);
    }

    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

}
