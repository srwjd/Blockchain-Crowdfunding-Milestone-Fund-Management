// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title InnovateFund - escrow crowdfunding with sequential milestone governance.
/// @notice Approval is weighted by contributed wei and requires strictly more than 50%.
/// @dev No administrator, upgrade, arbitrary withdrawal, or external dependencies.
contract InnovateFund {
    struct Campaign {
        address payable owner;
        string title;
        string description;
        string category;
        uint256 goal;
        uint256 deadline;
        uint256 raised;
        uint256 escrow;
        uint256 released;
        uint256 refunded;
        uint256 supporterCount;
        uint256 nextMilestone;
        uint256 milestoneCount;
    }
    struct Milestone {
        string title;
        uint256 amount;
        string evidence;
        uint256 approvalWeight;
        bool requested;
        bool paid;
    }
    uint256 public campaignCount;
    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => mapping(uint256 => Milestone)) private milestones;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;
    uint256 private locked = 1;

    event CampaignCreated(uint256 indexed campaignId, address indexed owner, string title, uint256 goal, uint256 deadline);
    event Contributed(uint256 indexed campaignId, address indexed supporter, uint256 amount);
    event MilestoneRequested(uint256 indexed campaignId, uint256 indexed milestoneId, string evidence);
    event MilestoneApproved(uint256 indexed campaignId, uint256 indexed milestoneId, address indexed supporter, uint256 weight);
    event FundsReleased(uint256 indexed campaignId, uint256 indexed milestoneId, address indexed owner, uint256 amount);
    event Refunded(uint256 indexed campaignId, address indexed supporter, uint256 amount);

    modifier nonReentrant() {
        require(locked == 1, "Reentrant call");
        locked = 2;
        _;
        locked = 1;
    }
    modifier validCampaign(uint256 id) {
        require(id < campaignCount, "Campaign not found");
        _;
    }

    function createCampaign(
        string calldata title, string calldata description, string calldata category,
        uint256 goal, uint256 durationDays,
        string[] calldata milestoneTitles, uint256[] calldata milestoneAmounts
    ) external returns (uint256 id) {
        require(bytes(title).length > 0 && bytes(title).length <= 300, "Invalid title");
        require(bytes(description).length <= 6000 && bytes(category).length <= 100, "Text too long");
        require(goal > 0, "Goal must be positive");
        require(durationDays > 0 && durationDays <= 365, "Duration 1-365 days");
        uint256 count = milestoneTitles.length;
        require(count > 0 && count <= 12 && count == milestoneAmounts.length, "Invalid milestones");
        uint256 allocated;
        for (uint256 i; i < count; ++i) {
            require(bytes(milestoneTitles[i]).length > 0 && bytes(milestoneTitles[i]).length <= 300, "Invalid milestone title");
            require(milestoneAmounts[i] > 0, "Zero allocation");
            allocated += milestoneAmounts[i];
        }
        require(allocated == goal, "Allocation must equal goal");
        id = campaignCount++;
        Campaign storage c = campaigns[id];
        c.owner = payable(msg.sender);
        c.title = title;
        c.description = description;
        c.category = category;
        c.goal = goal;
        c.deadline = block.timestamp + durationDays * 1 days;
        c.milestoneCount = count;
        for (uint256 i; i < count; ++i) {
            milestones[id][i].title = milestoneTitles[i];
            milestones[id][i].amount = milestoneAmounts[i];
        }
        _emitCampaignCreated(id);
    }

    function _emitCampaignCreated(uint256 id) private {
        Campaign storage c = campaigns[id];
        emit CampaignCreated(id, c.owner, c.title, c.goal, c.deadline);
    }

    function contribute(uint256 id) external payable validCampaign(id) {
        Campaign storage c = campaigns[id];
        require(block.timestamp < c.deadline, "Funding ended");
        require(msg.sender != c.owner, "Owner cannot contribute");
        require(msg.value > 0 && c.raised + msg.value <= c.goal, "Invalid contribution or goal exceeded");
        if (contributions[id][msg.sender] == 0) ++c.supporterCount;
        contributions[id][msg.sender] += msg.value;
        c.raised += msg.value;
        c.escrow += msg.value;
        emit Contributed(id, msg.sender, msg.value);
    }

    function requestMilestone(uint256 id, uint256 milestoneId, string calldata evidence) external validCampaign(id) {
        Campaign storage c = campaigns[id];
        require(msg.sender == c.owner, "Owner only");
        require(c.raised == c.goal, "Goal not reached");
        require(milestoneId == c.nextMilestone && milestoneId < c.milestoneCount, "Wrong milestone order");
        require(bytes(evidence).length > 0 && bytes(evidence).length <= 2048, "Evidence required");
        Milestone storage m = milestones[id][milestoneId];
        require(!m.requested && !m.paid, "Already requested");
        m.requested = true;
        m.evidence = evidence;
        emit MilestoneRequested(id, milestoneId, evidence);
    }

    /// @notice The vote crossing a strict majority atomically releases the allocated ETH.
    function approveMilestone(uint256 id, uint256 milestoneId) external nonReentrant validCampaign(id) {
        Campaign storage c = campaigns[id];
        require(milestoneId == c.nextMilestone && milestoneId < c.milestoneCount, "Wrong milestone order");
        Milestone storage m = milestones[id][milestoneId];
        require(m.requested && !m.paid, "Milestone not awaiting votes");
        uint256 weight = contributions[id][msg.sender];
        require(weight > 0, "Supporters only");
        require(!hasVoted[id][milestoneId][msg.sender], "Already voted");
        hasVoted[id][milestoneId][msg.sender] = true;
        m.approvalWeight += weight;
        emit MilestoneApproved(id, milestoneId, msg.sender, weight);
        if (m.approvalWeight > c.raised / 2) {
            require(c.escrow >= m.amount, "Insufficient escrow");
            m.paid = true;
            c.escrow -= m.amount;
            c.released += m.amount;
            ++c.nextMilestone;
            (bool sent,) = c.owner.call{value: m.amount}("");
            require(sent, "Transfer failed");
            emit FundsReleased(id, milestoneId, c.owner, m.amount);
        }
    }

    function refund(uint256 id) external nonReentrant validCampaign(id) {
        Campaign storage c = campaigns[id];
        require(block.timestamp >= c.deadline && c.raised < c.goal, "Refund unavailable");
        uint256 amount = contributions[id][msg.sender];
        require(amount > 0, "Nothing to refund");
        contributions[id][msg.sender] = 0;
        c.escrow -= amount;
        c.refunded += amount;
        (bool sent,) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");
        emit Refunded(id, msg.sender, amount);
    }

    function getCampaign(uint256 id) external view validCampaign(id) returns (Campaign memory) { return campaigns[id]; }
    function getMilestone(uint256 id, uint256 milestoneId) external view validCampaign(id) returns (Milestone memory) {
        require(milestoneId < campaigns[id].milestoneCount, "Milestone not found");
        return milestones[id][milestoneId];
    }
}
