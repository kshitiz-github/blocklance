import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import contract ABI (will be generated after deployment)
import contractData from './contracts/FreelanceMarketplace.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractData.address;
const CONTRACT_ABI = contractData.abi;

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [balance, setBalance] = useState('0');
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reputation, setReputation] = useState(0);
  
  // Form states
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    milestones: [{ description: '', amount: '' }]
  });
  
  const [proposalForm, setProposalForm] = useState({
    jobId: '',
    coverLetter: '',
    amount: ''
  });

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setAccount(accounts[0]);
      setProvider(provider);
      setContract(contract);
      
      // Get balance
      const balance = await provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(balance));
      
      // Get reputation
      const rep = await contract.userReputation(accounts[0]);
      setReputation(rep.toString());
      
      await loadJobs(contract);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet');
    }
  };

  // Load all jobs
  const loadJobs = async (contractInstance) => {
    try {
      setLoading(true);
      const jobCounter = await contractInstance.jobCounter();
      const jobsList = [];
      
      for (let i = 1; i <= jobCounter; i++) {
        const job = await contractInstance.jobs(i);
        const milestones = await contractInstance.getJobMilestones(i);
        const proposals = await contractInstance.getJobProposals(i);
        
        jobsList.push({
          id: i,
          client: job.client,
          title: job.title,
          description: job.description,
          budget: ethers.formatEther(job.totalBudget),
          isActive: job.isActive,
          freelancer: job.freelancer,
          milestonesCount: job.milestonesCount.toString(),
          milestones: milestones,
          proposals: proposals
        });
      }
      
      setJobs(jobsList);
      
      // Load user's jobs
      if (account) {
        const clientJobs = await contractInstance.getClientJobs(account);
        const freelancerJobs = await contractInstance.getFreelancerJobs(account);
        setMyJobs({ client: clientJobs, freelancer: freelancerJobs });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new job
  const createJob = async () => {
    try {
      if (!contract) {
        alert('Please connect wallet first');
        return;
      }
      
      setLoading(true);
      
      const milestoneAmounts = jobForm.milestones.map(m => 
        ethers.parseEther(m.amount || '0')
      );
      const milestoneDescriptions = jobForm.milestones.map(m => m.description);
      
      const totalAmount = milestoneAmounts.reduce((a, b) => a + b, 0n);
      
      const tx = await contract.createJob(
        jobForm.title,
        jobForm.description,
        milestoneAmounts,
        milestoneDescriptions,
        { value: totalAmount }
      );
      
      await tx.wait();
      alert('Job created successfully!');
      
      // Reset form
      setJobForm({
        title: '',
        description: '',
        milestones: [{ description: '', amount: '' }]
      });
      
      await loadJobs(contract);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit proposal
  const submitProposal = async () => {
    try {
      if (!contract) {
        alert('Please connect wallet first');
        return;
      }
      
      setLoading(true);
      
      const tx = await contract.submitProposal(
        proposalForm.jobId,
        proposalForm.coverLetter,
        ethers.parseEther(proposalForm.amount || '0')
      );
      
      await tx.wait();
      alert('Proposal submitted successfully!');
      
      setProposalForm({ jobId: '', coverLetter: '', amount: '' });
      await loadJobs(contract);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  // Accept proposal
  const acceptProposal = async (jobId, proposalIndex) => {
    try {
      setLoading(true);
      const tx = await contract.acceptProposal(jobId, proposalIndex);
      await tx.wait();
      alert('Proposal accepted!');
      await loadJobs(contract);
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert('Failed to accept proposal');
    } finally {
      setLoading(false);
    }
  };

  // Submit milestone
  const submitMilestone = async (jobId, milestoneIndex) => {
    try {
      const deliverableHash = prompt('Enter IPFS hash of deliverable:');
      if (!deliverableHash) return;
      
      setLoading(true);
      const tx = await contract.submitMilestone(jobId, milestoneIndex, deliverableHash);
      await tx.wait();
      alert('Milestone submitted!');
      await loadJobs(contract);
    } catch (error) {
      console.error('Error submitting milestone:', error);
      alert('Failed to submit milestone');
    } finally {
      setLoading(false);
    }
  };

  // Approve milestone
  const approveMilestone = async (jobId, milestoneIndex) => {
    try {
      setLoading(true);
      const tx = await contract.approveMilestone(jobId, milestoneIndex);
      await tx.wait();
      alert('Milestone approved and payment released!');
      await loadJobs(contract);
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Failed to approve milestone');
    } finally {
      setLoading(false);
    }
  };

  // Add milestone to form
  const addMilestone = () => {
    setJobForm({
      ...jobForm,
      milestones: [...jobForm.milestones, { description: '', amount: '' }]
    });
  };

  // Update milestone in form
  const updateMilestone = (index, field, value) => {
    const newMilestones = [...jobForm.milestones];
    newMilestones[index][field] = value;
    setJobForm({ ...jobForm, milestones: newMilestones });
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="app">
      <header>
        <h1>🔗 BlockLance - Blockchain Freelance Platform</h1>
        <div className="wallet-info">
          {account ? (
            <>
              <span>Account: {account.slice(0, 6)}...{account.slice(-4)}</span>
              <span>Balance: {parseFloat(balance).toFixed(4)} MATIC</span>
              <span>Reputation: ⭐ {reputation}</span>
            </>
          ) : (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </header>

      <nav className="tabs">
        <button 
          className={activeTab === 'jobs' ? 'active' : ''} 
          onClick={() => setActiveTab('jobs')}
        >
          Browse Jobs
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Post Job
        </button>
        <button 
          className={activeTab === 'my-jobs' ? 'active' : ''} 
          onClick={() => setActiveTab('my-jobs')}
        >
          My Jobs
        </button>
      </nav>

      {loading && <div className="loading">Loading...</div>}

      <main>
        {/* Browse Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="jobs-list">
            <h2>Available Jobs</h2>
            {jobs.filter(job => job.isActive).map(job => (
              <div key={job.id} className="job-card">
                <h3>{job.title}</h3>
                <p>{job.description}</p>
                <div className="job-details">
                  <span>Budget: {job.budget} MATIC</span>
                  <span>Milestones: {job.milestonesCount}</span>
                  <span>Client: {job.client.slice(0, 8)}...</span>
                </div>
                
                {job.freelancer === '0x0000000000000000000000000000000000000000' && (
                  <div className="proposal-section">
                    <h4>Submit Proposal</h4>
                    <input
                      type="hidden"
                      value={job.id}
                      onChange={(e) => setProposalForm({...proposalForm, jobId: e.target.value})}
                    />
                    <textarea
                      placeholder="Cover Letter"
                      value={proposalForm.jobId === job.id.toString() ? proposalForm.coverLetter : ''}
                      onChange={(e) => setProposalForm({
                        jobId: job.id.toString(),
                        coverLetter: e.target.value,
                        amount: proposalForm.amount
                      })}
                    />
                    <input
                      type="number"
                      placeholder="Proposed Amount (MATIC)"
                      value={proposalForm.jobId === job.id.toString() ? proposalForm.amount : ''}
                      onChange={(e) => setProposalForm({
                        jobId: job.id.toString(),
                        coverLetter: proposalForm.coverLetter,
                        amount: e.target.value
                      })}
                    />
                    <button onClick={submitProposal}>Submit Proposal</button>
                  </div>
                )}

                {/* Show proposals if user is client */}
                {job.client.toLowerCase() === account?.toLowerCase() && job.proposals.length > 0 && (
                  <div className="proposals-list">
                    <h4>Proposals ({job.proposals.length})</h4>
                    {job.proposals.map((prop, idx) => (
                      <div key={idx} className="proposal">
                        <p>Freelancer: {prop.freelancer.slice(0, 8)}...</p>
                        <p>{prop.coverLetter}</p>
                        <p>Amount: {ethers.formatEther(prop.proposedAmount)} MATIC</p>
                        {!prop.isAccepted && job.freelancer === '0x0000000000000000000000000000000000000000' && (
                          <button onClick={() => acceptProposal(job.id, idx)}>
                            Accept Proposal
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Show milestones */}
                {job.freelancer !== '0x0000000000000000000000000000000000000000' && (
                  <div className="milestones">
                    <h4>Milestones</h4>
                    {job.milestones.map((milestone, idx) => (
                      <div key={idx} className="milestone">
                        <p>{milestone.description}</p>
                        <p>Amount: {ethers.formatEther(milestone.amount)} MATIC</p>
                        <p>Status: {
                          milestone.isPaid ? '✅ Paid' : 
                          milestone.isCompleted ? '⏳ Pending Approval' : 
                          '⚪ Not Started'
                        }</p>
                        
                        {/* Freelancer can submit */}
                        {job.freelancer.toLowerCase() === account?.toLowerCase() && 
                         !milestone.isCompleted && (
                          <button onClick={() => submitMilestone(job.id, idx)}>
                            Submit Work
                          </button>
                        )}
                        
                        {/* Client can approve */}
                        {job.client.toLowerCase() === account?.toLowerCase() && 
                         milestone.isCompleted && !milestone.isPaid && (
                          <button onClick={() => approveMilestone(job.id, idx)}>
                            Approve & Pay
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Job Tab */}
        {activeTab === 'create' && (
          <div className="create-job">
            <h2>Post New Job</h2>
            <input
              type="text"
              placeholder="Job Title"
              value={jobForm.title}
              onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
            />
            <textarea
              placeholder="Job Description"
              value={jobForm.description}
              onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
            />
            
            <h3>Milestones</h3>
            {jobForm.milestones.map((milestone, index) => (
              <div key={index} className="milestone-form">
                <input
                  type="text"
                  placeholder="Milestone Description"
                  value={milestone.description}
                  onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Amount (MATIC)"
                  step="0.01"
                  value={milestone.amount}
                  onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                />
              </div>
            ))}
            <button onClick={addMilestone} type="button">+ Add Milestone</button>
            <button onClick={createJob} disabled={loading}>
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        )}

        {/* My Jobs Tab */}
        {activeTab === 'my-jobs' && (
          <div className="my-jobs">
            <h2>My Jobs</h2>
            <div className="my-jobs-sections">
              <div>
                <h3>As Client</h3>
                {jobs.filter(j => j.client.toLowerCase() === account?.toLowerCase()).map(job => (
                  <div key={job.id} className="job-card">
                    <h4>{job.title}</h4>
                    <p>Status: {job.isActive ? '🟢 Active' : '✅ Completed'}</p>
                    <p>Freelancer: {job.freelancer !== '0x0000000000000000000000000000000000000000' 
                      ? job.freelancer.slice(0, 8) + '...' 
                      : 'Not assigned'}</p>
                  </div>
                ))}
              </div>
              
              <div>
                <h3>As Freelancer</h3>
                {jobs.filter(j => j.freelancer.toLowerCase() === account?.toLowerCase()).map(job => (
                  <div key={job.id} className="job-card">
                    <h4>{job.title}</h4>
                    <p>Client: {job.client.slice(0, 8)}...</p>
                    <p>Status: {job.isActive ? '🟢 Active' : '✅ Completed'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;