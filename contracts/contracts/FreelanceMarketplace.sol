// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FreelanceMarketplace {
    struct Job {
        uint256 id;
        address client;
        string title;
        string description;
        uint256 totalBudget;
        uint256 milestonesCount;
        bool isActive;
        address freelancer;
        uint256 createdAt;
    }

    struct Milestone {
        uint256 id;
        uint256 jobId;
        string description;
        uint256 amount;
        bool isCompleted;
        bool isPaid;
        bool clientApproved;
        string deliverableHash; // IPFS hash
    }

    struct Proposal {
        uint256 jobId;
        address freelancer;
        string coverLetter;
        uint256 proposedAmount;
        bool isAccepted;
    }

    uint256 public jobCounter;
    uint256 public milestoneCounter;
    uint256 public proposalCounter;
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Milestone[]) public jobMilestones;
    mapping(uint256 => Proposal[]) public jobProposals;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public freelancerJobs;
    mapping(address => uint256) public userReputation;

    event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 budget);
    event ProposalSubmitted(uint256 indexed jobId, address indexed freelancer, uint256 proposalId);
    event ProposalAccepted(uint256 indexed jobId, address indexed freelancer);
    event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed jobId, uint256 amount);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 indexed jobId);
    event MilestoneApproved(uint256 indexed milestoneId, uint256 indexed jobId);
    event PaymentReleased(uint256 indexed milestoneId, address indexed freelancer, uint256 amount);
    event ReputationUpdated(address indexed user, uint256 newScore);

    // Create a new job with milestones
    function createJob(
        string memory _title,
        string memory _description,
        uint256[] memory _milestoneAmounts,
        string[] memory _milestoneDescriptions
    ) external payable {
        require(_milestoneAmounts.length == _milestoneDescriptions.length, "Milestone data mismatch");
        require(_milestoneAmounts.length > 0, "At least one milestone required");
        
        uint256 totalAmount = 0;
        for(uint256 i = 0; i < _milestoneAmounts.length; i++) {
            totalAmount += _milestoneAmounts[i];
        }
        require(msg.value >= totalAmount, "Insufficient funds sent");
        
        jobCounter++;
        uint256 jobId = jobCounter;
        
        jobs[jobId] = Job({
            id: jobId,
            client: msg.sender,
            title: _title,
            description: _description,
            totalBudget: totalAmount,
            milestonesCount: _milestoneAmounts.length,
            isActive: true,
            freelancer: address(0),
            createdAt: block.timestamp
        });
        
        // Create milestones
        for(uint256 i = 0; i < _milestoneAmounts.length; i++) {
            milestoneCounter++;
            Milestone memory newMilestone = Milestone({
                id: milestoneCounter,
                jobId: jobId,
                description: _milestoneDescriptions[i],
                amount: _milestoneAmounts[i],
                isCompleted: false,
                isPaid: false,
                clientApproved: false,
                deliverableHash: ""
            });
            jobMilestones[jobId].push(newMilestone);
            emit MilestoneCreated(milestoneCounter, jobId, _milestoneAmounts[i]);
        }
        
        clientJobs[msg.sender].push(jobId);
        emit JobCreated(jobId, msg.sender, _title, totalAmount);
        
        // Return excess funds if any
        if(msg.value > totalAmount) {
            payable(msg.sender).transfer(msg.value - totalAmount);
        }
    }
    
    // Submit proposal for a job
    function submitProposal(
        uint256 _jobId,
        string memory _coverLetter,
        uint256 _proposedAmount
    ) external {
        require(jobs[_jobId].isActive, "Job not active");
        require(jobs[_jobId].freelancer == address(0), "Job already assigned");
        require(jobs[_jobId].client != msg.sender, "Client cannot apply to own job");
        
        proposalCounter++;
        Proposal memory newProposal = Proposal({
            jobId: _jobId,
            freelancer: msg.sender,
            coverLetter: _coverLetter,
            proposedAmount: _proposedAmount,
            isAccepted: false
        });
        
        jobProposals[_jobId].push(newProposal);
        emit ProposalSubmitted(_jobId, msg.sender, proposalCounter);
    }
    
    // Accept a proposal
    function acceptProposal(uint256 _jobId, uint256 _proposalIndex) external {
        require(jobs[_jobId].client == msg.sender, "Only client can accept");
        require(jobs[_jobId].isActive, "Job not active");
        require(_proposalIndex < jobProposals[_jobId].length, "Invalid proposal");
        
        Proposal storage proposal = jobProposals[_jobId][_proposalIndex];
        proposal.isAccepted = true;
        
        jobs[_jobId].freelancer = proposal.freelancer;
        freelancerJobs[proposal.freelancer].push(_jobId);
        
        emit ProposalAccepted(_jobId, proposal.freelancer);
    }
    
    // Submit milestone deliverable
    function submitMilestone(uint256 _jobId, uint256 _milestoneIndex, string memory _deliverableHash) external {
        require(jobs[_jobId].freelancer == msg.sender, "Only assigned freelancer can submit");
        require(_milestoneIndex < jobMilestones[_jobId].length, "Invalid milestone");
        
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        require(!milestone.isCompleted, "Milestone already completed");
        
        // Check if previous milestones are completed
        if(_milestoneIndex > 0) {
            require(jobMilestones[_jobId][_milestoneIndex - 1].isPaid, "Complete previous milestone first");
        }
        
        milestone.deliverableHash = _deliverableHash;
        milestone.isCompleted = true;
        
        emit MilestoneCompleted(milestone.id, _jobId);
    }
    
    // Approve milestone and release payment
    function approveMilestone(uint256 _jobId, uint256 _milestoneIndex) external {
        require(jobs[_jobId].client == msg.sender, "Only client can approve");
        require(_milestoneIndex < jobMilestones[_jobId].length, "Invalid milestone");
        
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        require(milestone.isCompleted, "Milestone not completed");
        require(!milestone.isPaid, "Already paid");
        
        milestone.clientApproved = true;
        milestone.isPaid = true;
        
        // Transfer payment to freelancer
        address freelancer = jobs[_jobId].freelancer;
        payable(freelancer).transfer(milestone.amount);
        
        // Update reputation
        userReputation[freelancer] += 10;
        userReputation[msg.sender] += 5;
        
        emit MilestoneApproved(milestone.id, _jobId);
        emit PaymentReleased(milestone.id, freelancer, milestone.amount);
        emit ReputationUpdated(freelancer, userReputation[freelancer]);
        
        // Check if all milestones completed
        bool allCompleted = true;
        for(uint256 i = 0; i < jobMilestones[_jobId].length; i++) {
            if(!jobMilestones[_jobId][i].isPaid) {
                allCompleted = false;
                break;
            }
        }
        
        if(allCompleted) {
            jobs[_jobId].isActive = false;
        }
    }
    
    // Get job milestones
    function getJobMilestones(uint256 _jobId) external view returns (Milestone[] memory) {
        return jobMilestones[_jobId];
    }
    
    // Get job proposals
    function getJobProposals(uint256 _jobId) external view returns (Proposal[] memory) {
        return jobProposals[_jobId];
    }
    
    // Get user's jobs as client
    function getClientJobs(address _client) external view returns (uint256[] memory) {
        return clientJobs[_client];
    }
    
    // Get user's jobs as freelancer
    function getFreelancerJobs(address _freelancer) external view returns (uint256[] memory) {
        return freelancerJobs[_freelancer];
    }
    
    // Emergency refund (only if job not started)
    function cancelJob(uint256 _jobId) external {
        require(jobs[_jobId].client == msg.sender, "Only client can cancel");
        require(jobs[_jobId].freelancer == address(0), "Job already started");
        require(jobs[_jobId].isActive, "Job not active");
        
        jobs[_jobId].isActive = false;
        
        // Refund all milestone amounts
        uint256 totalRefund = 0;
        for(uint256 i = 0; i < jobMilestones[_jobId].length; i++) {
            if(!jobMilestones[_jobId][i].isPaid) {
                totalRefund += jobMilestones[_jobId][i].amount;
            }
        }
        
        if(totalRefund > 0) {
            payable(msg.sender).transfer(totalRefund);
        }
    }
}