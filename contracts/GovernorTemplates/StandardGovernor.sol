// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/* solhint-disable  no-global-import*/
import "../OpenzeppelinUpgradeable/governance/GovernorUpgradeable.sol";
import "../OpenzeppelinUpgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "../OpenzeppelinUpgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "../OpenzeppelinUpgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "../OpenzeppelinUpgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "../OpenzeppelinUpgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";

contract StandardGovernor is
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorTimelockControlUpgradeable
{
    function initialize(
        IVotesUpgradeable token,
        TimelockControllerUpgradeable timelock,
        uint256 quorumNumerator,
        uint256 initialVotingDelay,
        uint256 initialVotingPeriod,
        uint256 initialProposalThreshold,
        string calldata name
    ) public initializer returns (bool) {
        __Governor_init(name);
        __GovernorTimelockControl_init(timelock);
        __GovernorVotes_init(token);
        __GovernorVotesQuorumFraction_init(quorumNumerator);
        __GovernorCountingSimple_init();
        __GovernorSettings_init(
            initialVotingDelay,
            initialVotingPeriod,
            initialProposalThreshold
        );

        return true;
    }

    function votingDelay()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(IGovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(
        bytes32 proposalId
    )
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        override(IGovernorUpgradeable, GovernorUpgradeable)
        returns (bytes32)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _execute(
        bytes32 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bytes32)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function hashProposalDescriptionString(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public pure returns (bytes32) {
        return
            hashProposal(
                targets,
                values,
                calldatas,
                keccak256(bytes(description))
            );
    }
}
