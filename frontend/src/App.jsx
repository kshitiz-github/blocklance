// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import contract ABI (adjust path as needed)
import contractData from './contracts/FreelanceMarketplace.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractData.address;
const CONTRACT_ABI = contractData.abi;

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [balance, setBalance] = useState('0');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState({ client: [], freelancer: [] });
  const [loading, setLoading] = useState(false);
  const [reputation, setReputation] = useState(0);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalEarned: '0',
    jobsCompleted: 0,
    successRate: 0
  });
  
  // Form states
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    category: 'Smart Contract Development',
    milestones: [{ description: '', amount: '' }]
  });
  
  const [proposalForm, setProposalForm] = useState({
    jobId: '',
    coverLetter: '',
    amount: ''
  });

  // Initialize particles on mount
  useEffect(() => {
    createParticles();
    // Auto-connect if possible
    if (window.ethereum) {
      connectWallet();
    }
  }, []);

  // Create floating particles
  const createParticles = () => {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.width = Math.random() * 4 + 2 + 'px';
      particle.style.height = particle.style.width;
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
      particlesContainer.appendChild(particle);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to use this platform!');
        return;
      }
      
      setLoading(true);
      
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      // Verify we're on Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        alert('Please switch to Sepolia testnet in MetaMask!');
        return;
      }
      
      // Create contract instance
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setAccount(accounts[0]);
      setProvider(provider);
      setContract(contractInstance);
      
      // Get balance
      const bal = await provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(bal));
      
      // Get reputation
      const rep = await contractInstance.userReputation(accounts[0]);
      setReputation(rep.toString());
      
      // Load jobs and stats
      await loadJobs(contractInstance, accounts[0]);
      await loadStats(contractInstance, accounts[0]);
      
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async (contractInstance, userAddress) => {
    try {
      const clientJobs = await contractInstance.getClientJobs(userAddress);
      const freelancerJobs = await contractInstance.getFreelancerJobs(userAddress);
      
      let totalEarned = 0n;
      let completed = 0;
      
      for (const jobId of freelancerJobs) {
        const milestones = await contractInstance.getJobMilestones(jobId);
        for (const milestone of milestones) {
          if (milestone.isPaid) {
            totalEarned += milestone.amount;
            completed++;
          }
        }
      }
      
      setStats({
        activeJobs: clientJobs.length + freelancerJobs.length,
        totalEarned: ethers.formatEther(totalEarned),
        jobsCompleted: completed,
        successRate: freelancerJobs.length > 0 ? Math.round((completed / freelancerJobs.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load all jobs
  const loadJobs = async (contractInstance, userAddress = null) => {
    try {
      setLoading(true);
      const jobCounter = await contractInstance.jobCounter();
      const jobsList = [];
      
      for (let i = 1; i <= jobCounter; i++) {
        const job = await contractInstance.jobs(i);
        const milestones = await contractInstance.getJobMilestones(i);
        const proposals = await contractInstance.getJobProposals(i);
        
        const completedMilestones = milestones.filter(m => m.isPaid).length;
        
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
          proposals: proposals,
          completedMilestones: completedMilestones,
          progress: (completedMilestones / milestones.length) * 100
        });
      }
      
      setJobs(jobsList);
      
      // Load user's jobs
      if (userAddress) {
        const clientJobs = await contractInstance.getClientJobs(userAddress);
        const freelancerJobs = await contractInstance.getFreelancerJobs(userAddress);
        setMyJobs({ 
          client: clientJobs.map(id => id.toString()), 
          freelancer: freelancerJobs.map(id => id.toString()) 
        });
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
      
      if (!jobForm.title || !jobForm.description) {
        alert('Please fill in all required fields');
        return;
      }
      
      setLoading(true);
      
      const milestoneAmounts = jobForm.milestones.map(m => 
        ethers.parseEther(m.amount || '0')
      );
      const milestoneDescriptions = jobForm.milestones.map(m => m.description || '');
      
      const totalAmount = milestoneAmounts.reduce((a, b) => a + b, 0n);
      
      const tx = await contract.createJob(
        jobForm.title,
        jobForm.description,
        milestoneAmounts,
        milestoneDescriptions,
        { value: totalAmount }
      );
      
      await tx.wait();
      
      // Success animation
      showSuccessNotification('Job created successfully! 🎉');
      
      // Reset form
      setJobForm({
        title: '',
        description: '',
        category: 'Smart Contract Development',
        milestones: [{ description: '', amount: '' }]
      });
      
      await loadJobs(contract, account);
      await loadStats(contract, account);
      
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit proposal
  const submitProposal = async (jobId) => {
    try {
      if (!contract) {
        alert('Please connect wallet first');
        return;
      }
      
      const coverLetter = prompt('Enter your cover letter:');
      const amount = prompt('Enter your proposed amount (ETH):');
      
      if (!coverLetter || !amount) return;
      
      setLoading(true);
      
      const tx = await contract.submitProposal(
        jobId,
        coverLetter,
        ethers.parseEther(amount)
      );
      
      await tx.wait();
      showSuccessNotification('Proposal submitted! 🚀');
      await loadJobs(contract, account);
      
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
      showSuccessNotification('Proposal accepted! 🤝');
      await loadJobs(contract, account);
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
      const deliverableHash = prompt('Enter deliverable description or IPFS hash:');
      if (!deliverableHash) return;
      
      setLoading(true);
      const tx = await contract.submitMilestone(jobId, milestoneIndex, deliverableHash);
      await tx.wait();
      showSuccessNotification('Milestone submitted! ✅');
      await loadJobs(contract, account);
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
      showSuccessNotification('Payment released! 💰');
      await loadJobs(contract, account);
      await loadStats(contract, account);
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Failed to approve milestone');
    } finally {
      setLoading(false);
    }
  };

  // Success notification
  const showSuccessNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // Add milestone
  const addMilestone = () => {
    setJobForm({
      ...jobForm,
      milestones: [...jobForm.milestones, { description: '', amount: '' }]
    });
  };

  // Update milestone
  const updateMilestone = (index, field, value) => {
    const newMilestones = [...jobForm.milestones];
    newMilestones[index][field] = value;
    setJobForm({ ...jobForm, milestones: newMilestones });
  };

  // Remove milestone
  const removeMilestone = (index) => {
    if (jobForm.milestones.length > 1) {
      const newMilestones = jobForm.milestones.filter((_, i) => i !== index);
      setJobForm({ ...jobForm, milestones: newMilestones });
    }
  };

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="app-container">
      <div className="background-animation"></div>
      <div className="particles" id="particles"></div>
      
      <div className="app">
        <header className="glass-header">
          <div className="logo">
            <div className="logo-icon">⛓️</div>
            <h1>BlockLance</h1>
          </div>
          <div className="wallet-info">
            {account ? (
              <>
                <div className="wallet-stat">
                  <span className="stat-label">Account</span>
                  <span className="stat-value">{formatAddress(account)}</span>
                </div>
                <div className="wallet-stat">
                  <span className="stat-label">Balance</span>
                  <span className="stat-value">{parseFloat(balance).toFixed(4)} ETH</span>
                </div>
                <div className="wallet-stat">
                  <span className="stat-label">Reputation</span>
                  <span className="stat-value">⭐ {reputation}</span>
                </div>
                {/* <button className="connect-btn connected">
                  Connected to Sepolia
                </button> */}
              </>
            ) : (
              <button className="connect-btn" onClick={connectWallet}>
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </header>

        <nav className="nav-container">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              Browse Jobs
            </button>
            <button 
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Post Job
            </button>
            <button 
              className={`tab-btn ${activeTab === 'my-jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-jobs')}
            >
              My Work
            </button>
          </div>
        </nav>

        <main className="main-content">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="tab-content">
              <h2 className="section-title">Welcome to BlockLance</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.activeJobs}</div>
                  <div className="stat-desc">Active Jobs</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.totalEarned} ETH</div>
                  <div className="stat-desc">Total Earned</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.jobsCompleted}</div>
                  <div className="stat-desc">Milestones Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.successRate}%</div>
                  <div className="stat-desc">Success Rate</div>
                </div>
              </div>

              <h3 className="section-subtitle">Recent Jobs</h3>
              <div className="job-grid">
                {jobs.slice(0, 4).map(job => (
                  <div key={job.id} className="job-card modern">
                    <div className="job-header">
                      <h3 className="job-title">{job.title}</h3>
                      <span className="job-budget">{job.budget} ETH</span>
                    </div>
                    <p className="job-description">{job.description}</p>
                    <div className="job-meta">
                      <span className="meta-tag">
                        {job.isActive ? '🟢 Active' : '✅ Completed'}
                      </span>
                      <span className="meta-tag">
                        📊 {job.milestonesCount} Milestones
                      </span>
                    </div>
                    <div className="milestone-progress">
                      <div className="progress-header">
                        <span>Progress</span>
                        <span>{job.completedMilestones}/{job.milestonesCount}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="tab-content">
              <h2 className="section-title">Available Jobs</h2>
              
              <div className="job-grid">
                {jobs.filter(job => job.isActive).map(job => (
                  <div key={job.id} className="job-card expandable">
                    <div className="job-header">
                      <h3 className="job-title">{job.title}</h3>
                      <span className="job-budget">{job.budget} ETH</span>
                    </div>
                    <p className="job-description">{job.description}</p>
                    
                    <div className="job-meta">
                      <span className="meta-tag">👤 {formatAddress(job.client)}</span>
                      <span className="meta-tag">📊 {job.milestonesCount} Blocks</span>
                      <span className="meta-tag">📝 {job.proposals.length} Proposals</span>
                    </div>

                    {/* Milestones Preview */}
                    <div className="milestones-preview">
                      <h4>Project Blocks:</h4>
                      {job.milestones.map((milestone, idx) => (
                        <div key={idx} className="milestone-item">
                          <span className="milestone-number">Block {idx + 1}</span>
                          <span className="milestone-desc">{milestone.description}</span>
                          <span className="milestone-amount">
                            {ethers.formatEther(milestone.amount)} ETH
                          </span>
                        </div>
                      ))}
                    </div>

                    {job.freelancer === '0x0000000000000000000000000000000000000000' && 
                     job.client.toLowerCase() !== account?.toLowerCase() && (
                      <button 
                        className="action-btn primary"
                        onClick={() => submitProposal(job.id)}
                      >
                        Submit Proposal
                      </button>
                    )}

                    {/* Show proposals if user is client */}
                    {job.client.toLowerCase() === account?.toLowerCase() && 
                     job.proposals.length > 0 && (
                      <div className="proposals-section">
                        <h4>Proposals:</h4>
                        {job.proposals.map((prop, idx) => (
                          <div key={idx} className="proposal-card">
                            <p className="proposal-freelancer">
                              {formatAddress(prop.freelancer)}
                            </p>
                            <p className="proposal-letter">{prop.coverLetter}</p>
                            <p className="proposal-amount">
                              {ethers.formatEther(prop.proposedAmount)} ETH
                            </p>
                            {!prop.isAccepted && job.freelancer === '0x0000000000000000000000000000000000000000' && (
                              <button 
                                className="action-btn success"
                                onClick={() => acceptProposal(job.id, idx)}
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Active work section */}
                    {job.freelancer !== '0x0000000000000000000000000000000000000000' && (
                      <div className="active-work">
                        <h4>Active Work Progress:</h4>
                        {job.milestones.map((milestone, idx) => (
                          <div key={idx} className="milestone-status">
                            <span>Block {idx + 1}: {milestone.description}</span>
                            <div className="milestone-actions">
                              {milestone.isPaid && <span className="status-badge paid">✅ Paid</span>}
                              {milestone.isCompleted && !milestone.isPaid && 
                                <span className="status-badge pending">⏳ Pending</span>}
                              {!milestone.isCompleted && <span className="status-badge">⚪ Not Started</span>}
                              
                              {job.freelancer.toLowerCase() === account?.toLowerCase() && 
                               !milestone.isCompleted && (idx === 0 || job.milestones[idx-1].isPaid) && (
                                <button 
                                  className="action-btn"
                                  onClick={() => submitMilestone(job.id, idx)}
                                >
                                  Submit Work
                                </button>
                              )}
                              
                              {job.client.toLowerCase() === account?.toLowerCase() && 
                               milestone.isCompleted && !milestone.isPaid && (
                                <button 
                                  className="action-btn success"
                                  onClick={() => approveMilestone(job.id, idx)}
                                >
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
            <div className="tab-content create-job-content">
              <h2 className="section-title">Post a New Job</h2>
              
              <div className="form-container">
                <div className="form-group">
                  <label>Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Smart Contract Developer Needed"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe the job requirements, skills needed, and project details..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={jobForm.category}
                    onChange={(e) => setJobForm({...jobForm, category: e.target.value})}
                  >
                    <option>Smart Contract Development</option>
                    <option>Frontend Development</option>
                    <option>Backend Development</option>
                    <option>UI/UX Design</option>
                    <option>Audit & Security</option>
                    <option>Content Writing</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Project Milestones (Blocks)</label>
                  <div className="milestones-builder">
                    {jobForm.milestones.map((milestone, index) => (
                      <div key={index} className="milestone-form-item">
                        <div className="milestone-number-badge">Block {index + 1}</div>
                        <input
                          type="text"
                          placeholder="Milestone description"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount (ETH)"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                        />
                        {jobForm.milestones.length > 1 && (
                          <button 
                            className="remove-btn"
                            onClick={() => removeMilestone(index)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button className="add-milestone-btn" onClick={addMilestone}>
                      + Add Another Milestone
                    </button>
                  </div>
                </div>
                
                <div className="form-summary">
                  <div className="summary-item">
                    <span>Total Budget:</span>
                    <span className="summary-value">
                      {jobForm.milestones.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0).toFixed(3)} ETH
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>Number of Blocks:</span>
                    <span className="summary-value">{jobForm.milestones.length}</span>
                  </div>
                </div>
                
                <button 
                  className="submit-btn"
                  onClick={createJob}
                  disabled={loading || !account}
                >
                  {loading ? 'Creating...' : 'Create Job & Fund Escrow'}
                </button>
              </div>
            </div>
          )}

          {/* My Jobs Tab */}
          {activeTab === 'my-jobs' && (
            <div className="tab-content">
              <h2 className="section-title">My Work</h2>
              
              <div className="my-jobs-grid">
                <div className="jobs-section">
                  <h3 className="section-subtitle">As Client</h3>
                  <div className="job-list">
                    {jobs.filter(j => j.client.toLowerCase() === account?.toLowerCase()).map(job => (
                      <div key={job.id} className="my-job-card">
                        <h4>{job.title}</h4>
                        <div className="job-info">
                          <span className={`status-pill ${job.isActive ? 'active' : 'completed'}`}>
                            {job.isActive ? 'Active' : 'Completed'}
                          </span>
                          <span className="info-text">
                            Freelancer: {job.freelancer !== '0x0000000000000000000000000000000000000000' 
                              ? formatAddress(job.freelancer) 
                              : 'Not assigned'}
                          </span>
                          <span className="info-text">
                            Progress: {job.completedMilestones}/{job.milestonesCount}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="jobs-section">
                  <h3 className="section-subtitle">As Freelancer</h3>
                  <div className="job-list">
                    {jobs.filter(j => j.freelancer.toLowerCase() === account?.toLowerCase()).map(job => (
                      <div key={job.id} className="my-job-card">
                        <h4>{job.title}</h4>
                        <div className="job-info">
                          <span className={`status-pill ${job.isActive ? 'active' : 'completed'}`}>
                            {job.isActive ? 'In Progress' : 'Completed'}
                          </span>
                          <span className="info-text">
                            Client: {formatAddress(job.client)}
                          </span>
                          <span className="info-text">
                            Earnings: {
                              job.milestones
                                .filter(m => m.isPaid)
                                .reduce((sum, m) => sum + parseFloat(ethers.formatEther(m.amount)), 0)
                                .toFixed(3)
                            } ETH
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <div className="fab" onClick={() => setActiveTab('create')}>
        <span>+</span>
      </div>
    </div>
  );
}

export default App;