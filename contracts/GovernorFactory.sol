// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./OpenzeppelinUpgradeable/proxy/ClonesUpgradeable.sol";
import "./OpenzeppelinUpgradeable/access/OwnableUpgradeable.sol";
import "./OpenzeppelinUpgradeable/proxy/utils/Initializable.sol";
import "./OpenzeppelinUpgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/Bytes32ToAddressMapUpgradeable.sol";
import "./interfaces/ITimelockControllerInitilizer.sol";
import "./interfaces/ITreasuryInitializer.sol";

contract GovernorFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using Bytes32ToAddressMapUpgradeable for Bytes32ToAddressMapUpgradeable.Bytes32ToAddressMap;
    using ClonesUpgradeable for address;

    Bytes32ToAddressMapUpgradeable.Bytes32ToAddressMap private governorPresets;
    Bytes32ToAddressMapUpgradeable.Bytes32ToAddressMap private voteTokenPresets;
    address public timelockController;
    address public treasury;
    uint256 public totalGovernor;
    mapping(uint256 => Governor) public governors;
    mapping(bytes32 => bool) public usedSalts;

    struct Governor {
        address governor;
        address voteToken;
        address timelock;
        address treasury;
    }

    // ========== Events ==========

    event GovernorCreated(
        uint256 id,
        address governor,
        address voteToken,
        address timelock,
        address treasury
    );

    event testing(
        address voteToken,
        bytes result,
        bool success
    );

    event testingFirst(
        address voteTokenPreset
    );

    // ========== Modifiers ==========

    modifier isValidName(string calldata name) {
        require(bytes(name).length <= 32, "GovernorFactory: invalid name");
        _;
    }

    // ========== Gorvernance ==========

    function initialize(address _timelockController, address _treasury) public initializer {
        timelockController = _timelockController;
        treasury = _treasury;
        __Ownable_init();
    }

    ///@dev required by the OZ UUPS module
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function addGovernorPreset(
        string calldata _name,
        address _governorPreset
    ) external onlyOwner isValidName(_name) {
        uint8 nameLength = uint8(bytes(_name).length);
        bytes32 bytesName = bytes32(abi.encodePacked(_name));
        governorPresets.set(bytesName, _governorPreset, nameLength);
    }

    function addVoteTokenPreset(
        string calldata _name,
        address _voteTokenPresets
    ) external onlyOwner isValidName(_name) {
        uint8 nameLength = uint8(bytes(_name).length);
        bytes32 bytesName = bytes32(abi.encodePacked(_name));
        voteTokenPresets.set(bytesName, _voteTokenPresets, nameLength);
    }

    // ========== Public functions ==========

    function createGovernor(
        string calldata _governorPreset,
        bytes calldata _governorInitializeData,
        string calldata _voteTokenPreset,
        bytes calldata _voteTokenInitializeData,
        uint256 _timelockMinDelay,
        address[] memory _timelockProposers,
        address[] memory _timelockExecutors,
        address _timelockAdmin,
        bytes32 salt
    ) external returns (address governor, address voteToken, address timelock) {
        require(!usedSalts[salt], "GovernorFactory: salt used");
        (bool governorExist, address governorPreset) = getGovernorPresetAddress(
            _governorPreset
        );
        require(governorExist, "GovernorFactory: governor preset not exist");
        governor = governorPreset.cloneDeterministic(salt);

        (
            bool voteTokenExist,
            address voteTokenPreset
        ) = getVoteTokenPresetAddress(_voteTokenPreset);
        require(voteTokenExist, "GovernorFactory: vote token preset not exist");
        voteToken = voteTokenPreset.cloneDeterministic(salt);

        timelock = timelockController.cloneDeterministic(salt);

        treasury = treasury.cloneDeterministic(salt);

        (bool success, bytes memory result) = voteToken.call(
            _voteTokenInitializeData
        );

        require(
            success,
            "GovernorFactory: failed to call initialize vote token"
        );

        bool initialized = abi.decode(result, (bool));
        require(initialized, "GovernorFactory: failed to initialize governor");

        (bool success_2, bytes memory result_2) = governor.call(
            _governorInitializeData
        );

        require(
            success_2,
            "GovernorFactory: failed to call initialize governor"
        );
        bool initialized_2 = abi.decode(result_2, (bool));
        require(
            initialized_2,
            "GovernorFactory: failed to initialize governor"
        );

        ITimelockControllerInitilizer(timelock).initialize(
            _timelockMinDelay,
            _timelockProposers,
            _timelockExecutors,
            _timelockAdmin
        );

        ITreasuryInitializer(treasury).initialize(timelock);

        uint256 governorId = totalGovernor;
        governors[governorId] = Governor(governor, voteToken, timelock, treasury);

        emit GovernorCreated(governorId, governor, voteToken, timelock, treasury);

        usedSalts[salt] = true;

        totalGovernor++;
    }

    function initializeGovernor() external {}

    // ========== View functions ==========
    function predictGovernorDeterministicAddress(
        string calldata _governorPreset,
        bytes32 _salt
    ) external view returns (bool, address) {
        (bool governorExist, address governorPreset) = getGovernorPresetAddress(
            _governorPreset
        );

        if (!governorExist) {
            return (governorExist, address(0));
        }

        return (
            governorExist,
            governorPreset.predictDeterministicAddress(_salt)
        );
    }

    function predictVoteTokenDeterministicAddress(
        string calldata _voteTokenPreset,
        bytes32 _salt
    ) external view returns (bool, address) {
        (
            bool voteTokenExist,
            address voteTokenPreset
        ) = getVoteTokenPresetAddress(_voteTokenPreset);

        if (!voteTokenExist) {
            return (voteTokenExist, address(0));
        }

        return (
            voteTokenExist,
            voteTokenPreset.predictDeterministicAddress(_salt)
        );
    }

    function predictTimelockDeterministicAddress(
        bytes32 _salt
    ) external view returns (address) {
        return timelockController.predictDeterministicAddress(_salt);
    }

    function predictTreasuryDeterministicAddress(
        bytes32 _salt
    ) external view returns (address) {
        return treasury.predictDeterministicAddress(_salt);
    }

    function getAllGovernorPresets() external view returns (string[] memory) {
        bytes[] memory keysBytes = governorPresets.keysPacked();
        string[] memory keys = new string[](keysBytes.length);
        for (uint256 i = 0; i < keysBytes.length; i++) {
            keys[i] = string(keysBytes[i]);
        }
        return keys;
    }

    function getAllVoteTokenPresets() external view returns (string[] memory) {
        bytes[] memory keysBytes = voteTokenPresets.keysPacked();
        string[] memory keys = new string[](keysBytes.length);
        for (uint256 i = 0; i < keysBytes.length; i++) {
            keys[i] = string(keysBytes[i]);
        }
        return keys;
    }

    function getGovernorPresetAddress(
        string calldata _name
    ) public view isValidName(_name) returns (bool, address) {
        bytes32 bytesName = bytes32(abi.encodePacked(_name));
        return governorPresets.tryGet(bytesName);
    }

    function getVoteTokenPresetAddress(
        string calldata _name
    ) public view isValidName(_name) returns (bool, address) {
        bytes32 bytesName = bytes32(abi.encodePacked(_name));
        return voteTokenPresets.tryGet(bytesName);
    }

    // ========== Private functions ==========
}
