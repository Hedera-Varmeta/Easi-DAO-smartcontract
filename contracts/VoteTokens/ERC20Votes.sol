// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/* solhint-disable  no-global-import*/
import "../OpenzeppelinUpgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "../OpenzeppelinUpgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "../OpenzeppelinUpgradeable/access/OwnableUpgradeable.sol";

contract ERC20VotesStandard is
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable
{
    function initialize(
        string calldata name,
        string calldata symbol,
        address newOwner
    ) public initializer returns (bool) {
        __ERC20_init(name, symbol);
        __ERC20Permit_init(name);
        __ERC20Votes_init();
        __Ownable_init();
        
        transferOwnership(newOwner);
        return true;
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._burn(account, amount);
    }
}
