import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import contract ABI
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
      
      const balance = await provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(balance));
      
      const rep = await contract.userReputation(accounts[0]);
      setReputation(rep.toString());
      
      await loadJobs(contract);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet');
    }
  };

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

  const addMilestone = () => {
    setJobForm({
      ...jobForm,
      milestones: [...jobForm.milestones, { description: '', amount: '' }]
    });
  };

  const updateMilestone = (index, field, value) => {
    const newMilestones = [...jobForm.milestones];
    newMilestones[index][field] = value;
    setJobForm({ ...jobForm, milestones: newMilestones });
  };

  const removeMilestone = (index) => {
    if (jobForm.milestones.length > 1) {
      const newMilestones = jobForm.milestones.filter((_, i) => i !== index);
      setJobForm({ ...jobForm, milestones: newMilestones });
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="app">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing transaction...</p>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">💼</div>
            <h1>BlockLance</h1>
          </div>
          
          {account ? (
            <div className="wallet-info">
              <div className="info-badge">
                <span className="icon">⭐</span>
                <span>{reputation}/5</span>
              </div>
              <div className="info-badge">
                <span className="icon">💰</span>
                <span>{parseFloat(balance).toFixed(4)} MATIC</span>
              </div>
              <div className="account-badge">
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            </div>
          ) : (
            <button className="btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button 
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <span className="tab-icon">🔍</span>
          Browse Jobs
        </button>
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <span className="tab-icon">➕</span>
          Post Job
        </button>
        <button 
          className={`tab ${activeTab === 'my-jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-jobs')}
        >
          <span className="tab-icon">👤</span>
          My Jobs
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Browse Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <div className="section-header">
              <h2>Available Jobs</h2>
              <span className="job-count">{jobs.filter(j => j.isActive).length} active jobs</span>
            </div>
            
            <div className="jobs-grid">
              {jobs.filter(job => job.isActive).map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3>{job.title}</h3>
                  </div>
                  <p className="job-description">{job.description}</p>
                  
                  <div className="job-meta">
                    <div className="meta-badge budget">
                      <span className="icon">💰</span>
                      <span>{job.budget} MATIC</span>
                    </div>
                    <div className="meta-badge">
                      <span className="icon">📋</span>
                      <span>{job.milestonesCount} milestones</span>
                    </div>
                    <div className="meta-badge">
                      <span className="icon">👤</span>
                      <span>{job.client.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {job.freelancer === '0x0000000000000000000000000000000000000000' && (
                    <div className="proposal-form">
                      <h4>📨 Submit Proposal</h4>
                      <textarea
                        placeholder="Write your cover letter..."
                        value={proposalForm.jobId === job.id.toString() ? proposalForm.coverLetter : ''}
                        onChange={(e) => setProposalForm({
                          jobId: job.id.toString(),
                          coverLetter: e.target.value,
                          amount: proposalForm.amount
                        })}
                        rows="3"
                      />
                      <div className="proposal-submit">
                        <input
                          type="number"
                          placeholder="Your bid (MATIC)"
                          value={proposalForm.jobId === job.id.toString() ? proposalForm.amount : ''}
                          onChange={(e) => setProposalForm({
                            jobId: job.id.toString(),
                            coverLetter: proposalForm.coverLetter,
                            amount: e.target.value
                          })}
                        />
                        <button className="btn-primary" onClick={submitProposal}>
                          Submit
                        </button>
                      </div>
                    </div>
                  )}

                  {job.client.toLowerCase() === account?.toLowerCase() && job.proposals.length > 0 && (
                    <div className="proposals-section">
                      <h4>Proposals ({job.proposals.length})</h4>
                      {job.proposals.map((prop, idx) => (
                        <div key={idx} className="proposal-item">
                          <p><strong>Freelancer:</strong> {prop.freelancer.slice(0, 8)}...</p>
                          <p>{prop.coverLetter}</p>
                          <p><strong>Amount:</strong> {ethers.formatEther(prop.proposedAmount)} MATIC</p>
                          {!prop.isAccepted && job.freelancer === '0x0000000000000000000000000000000000000000' && (
                            <button className="btn-secondary" onClick={() => acceptProposal(job.id, idx)}>
                              Accept Proposal
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {job.freelancer !== '0x0000000000000000000000000000000000000000' && job.milestones && (
                    <div className="milestones-section">
                      <h4>Milestones</h4>
                      {job.milestones.map((milestone, idx) => (
                        <div key={idx} className="milestone-item">
                          <div className="milestone-header">
                            <span className={`status-icon ${
                              milestone.isPaid ? 'paid' : 
                              milestone.isCompleted ? 'pending' : 
                              'not-started'
                            }`}>
                              {milestone.isPaid ? '✅' : milestone.isCompleted ? '⏳' : '⚪'}
                            </span>
                            <span className="milestone-desc">{milestone.description}</span>
                          </div>
                          <div className="milestone-footer">
                            <span className="milestone-amount">{ethers.formatEther(milestone.amount)} MATIC</span>
                            
                            {job.freelancer.toLowerCase() === account?.toLowerCase() && !milestone.isCompleted && (
                              <button className="btn-small" onClick={() => submitMilestone(job.id, idx)}>
                                Submit Work
                              </button>
                            )}
                            
                            {job.client.toLowerCase() === account?.toLowerCase() && 
                             milestone.isCompleted && !milestone.isPaid && (
                              <button className="btn-small btn-approve" onClick={() => approveMilestone(job.id, idx)}>
                                Approve & Pay
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Job Tab */}
        {activeTab === 'create' && (
          <div className="create-job-section">
            <h2>Post a New Job</h2>
            
            <div className="form-card">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  placeholder="e.g., Smart Contract Development"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the job requirements..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <div className="form-group-header">
                  <label>Milestones</label>
                  <button className="btn-link" onClick={addMilestone}>
                    ➕ Add Milestone
                  </button>
                </div>
                
                <div className="milestones-form">
                  {jobForm.milestones.map((milestone, index) => (
                    <div key={index} className="milestone-form-item">
                      <div className="milestone-form-header">
                        <span>Milestone {index + 1}</span>
                        {jobForm.milestones.length > 1 && (
                          <button className="btn-remove" onClick={() => removeMilestone(index)}>
                            ✕
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Milestone description"
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
                </div>
              </div>

              <div className="form-footer">
                <div className="total-budget">
                  <span>Total Budget</span>
                  <span className="budget-amount">
                    {jobForm.milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(2)} MATIC
                  </span>
                </div>
                <button className="btn-primary btn-large" onClick={createJob} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Jobs Tab */}
        {activeTab === 'my-jobs' && (
          <div className="my-jobs-section">
            <div className="my-jobs-grid">
              <div>
                <h2>As Client</h2>
                <div className="jobs-list">
                  {jobs.filter(j => j.client.toLowerCase() === account?.toLowerCase()).map(job => (
                    <div key={job.id} className="my-job-card">
                      <h3>{job.title}</h3>
                      <div className="my-job-info">
                        <span className={`status-badge ${job.isActive ? 'active' : 'completed'}`}>
                          {job.isActive ? '🟢 Active' : '✅ Completed'}
                        </span>
                        <span className="job-budget">{job.budget} MATIC</span>
                      </div>
                      {job.freelancer !== '0x0000000000000000000000000000000000000000' && (
                        <p className="freelancer-info">
                          <strong>Freelancer:</strong> {job.freelancer.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2>As Freelancer</h2>
                <div className="jobs-list">
                  {jobs.filter(j => j.freelancer.toLowerCase() === account?.toLowerCase()).map(job => (
                    <div key={job.id} className="my-job-card">
                      <h3>{job.title}</h3>
                      <div className="my-job-info">
                        <span className={`status-badge ${job.isActive ? 'active' : 'completed'}`}>
                          {job.isActive ? '🟢 Active' : '✅ Completed'}
                        </span>
                        <span className="job-budget">{job.budget} MATIC</span>
                      </div>
                      <p className="client-info">
                        <strong>Client:</strong> {job.client.slice(0, 8)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;