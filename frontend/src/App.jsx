// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import contract ABI (adjust path as needed)
import contractData from './contracts/FreelanceMarketplace.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractData.address;
const CONTRACT_ABI = contractData.abi;

// Milestone Submit Dialog Component
const MilestoneSubmitDialog = ({ isOpen, onClose, onSubmit, milestoneIndex }) => {
  const [previewLink, setPreviewLink] = useState('');
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/zip' || 
          selectedFile.type === 'application/x-zip-compressed' ||
          selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
      } else {
        alert('Please upload a ZIP file only');
        e.target.value = '';
      }
    }
  };

  const uploadToIPFS = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      // Using Pinata API - Replace with your API keys
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': '55654dc7fbc5c3faa2d6',
          'pinata_secret_api_key': 'ef306d60e30929aa28f1189d9cb62e6b9a8037361d9c5598586e013c32a61e83',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const hash = `ipfs://${data.IpfsHash}`;
      setIpfsHash(hash);
      
      alert('File uploaded to IPFS successfully! ✅');
    } catch (error) {
      console.error('IPFS upload error:', error);
      alert('Failed to upload to IPFS. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!ipfsHash.trim()) {
      alert('Please upload your work to IPFS first');
      return;
    }
    
    onSubmit(ipfsHash, previewLink);
    setPreviewLink('');
    setFile(null);
    setIpfsHash('');
  };

  const handleClose = () => {
    setPreviewLink('');
    setFile(null);
    setIpfsHash('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>
            Submit Milestone {milestoneIndex + 1}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* File Upload Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              📦 Upload Work (ZIP file) *
            </label>
            
            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.3s'
            }}>
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                <div style={{ fontSize: '0.875rem', color: '#ccc', marginBottom: '0.25rem' }}>
                  {file ? file.name : 'Click to select ZIP file'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  Maximum file size: 100MB
                </div>
              </label>
            </div>

            {file && !ipfsHash && (
              <button
                onClick={uploadToIPFS}
                disabled={uploading}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: uploading ? '#666' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {uploading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Uploading to IPFS...
                  </>
                ) : (
                  <>
                    📤 Upload to IPFS
                  </>
                )}
              </button>
            )}

            {ipfsHash && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem' }}>✅</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#22c55e',
                      marginBottom: '0.25rem'
                    }}>
                      Upload Successful!
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#86efac',
                      wordBreak: 'break-all',
                      margin: 0
                    }}>
                      {ipfsHash}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Link Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              🔗 Preview Link (Optional)
            </label>
            <input
              type="url"
              value={previewLink}
              onChange={(e) => setPreviewLink(e.target.value)}
              placeholder="https://your-preview-link.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <p style={{
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: '#999'
            }}>
              Add a live preview link if available (deployed site, demo, etc.)
            </p>
          </div>

          {/* Info Box */}
          <div style={{
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📤</span>
              <div style={{ fontSize: '0.875rem', color: '#93c5fd' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Submission Guidelines:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem' }}>
                  <li>Compress all deliverables into a single ZIP file</li>
                  <li>Files are stored permanently on IPFS</li>
                  <li>Include README with setup instructions</li>
                  <li>Optionally provide a live preview link</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!ipfsHash.trim()}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: ipfsHash.trim() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: ipfsHash.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Submit Work
            </button>
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

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
  
  // Dialog states
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  
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
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        alert('Please switch to Sepolia testnet in MetaMask!');
        return;
      }
      
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setAccount(accounts[0]);
      setProvider(provider);
      setContract(contractInstance);
      
      const bal = await provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(bal));
      
      const rep = await contractInstance.userReputation(accounts[0]);
      setReputation(rep.toString());
      
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
      
      showSuccessNotification('Job created successfully! 🎉');
      
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

  // Submit milestone - Updated to open dialog
  const submitMilestone = async (jobId, milestoneIndex) => {
    setSelectedJob(jobId);
    setSelectedMilestone(milestoneIndex);
    setIsSubmitDialogOpen(true);
  };

  // Handle milestone submission from dialog
  const handleMilestoneSubmit = async (ipfsHash, previewLink) => {
    try {
      setLoading(true);
      setIsSubmitDialogOpen(false);
      
      const tx = await contract.submitMilestone(
        selectedJob,
        selectedMilestone,
        ipfsHash
      );
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

      {/* Milestone Submit Dialog */}
      <MilestoneSubmitDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onSubmit={handleMilestoneSubmit}
        milestoneIndex={selectedMilestone || 0}
      />

      {/* Floating Action Button */}
      <div className="fab" onClick={() => setActiveTab('create')}>
        <span>+</span>
      </div>
    </div>
  );
}

export default App;