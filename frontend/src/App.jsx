import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import contract ABI (adjust path as needed)
import contractData from './contracts/FreelanceMarketplace.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractData.address;
const CONTRACT_ABI = contractData.abi;

// Generic Dialog Component
const Dialog = ({ isOpen, onClose, title, children, type = 'info' }) => {
  if (!isOpen) return null;

  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

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
        maxWidth: '450px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{icons[type]}</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
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
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Proposal Dialog Component
const ProposalDialog = ({ isOpen, onClose, onSubmit }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!coverLetter.trim() || !amount.trim()) {
      return;
    }
    onSubmit(coverLetter, amount);
    setCoverLetter('');
    setAmount('');
  };

  const handleClose = () => {
    setCoverLetter('');
    setAmount('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Submit Proposal" type="info">
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Cover Letter
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Explain why you're the best fit for this project..."
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.875rem',
            outline: 'none',
            minHeight: '100px',
            resize: 'vertical'
          }}
          autoFocus
        />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Proposed Amount (ETH)
        </label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
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
      </div>
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
          disabled={!coverLetter.trim() || !amount.trim()}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: (coverLetter.trim() && amount.trim())
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: (coverLetter.trim() && amount.trim()) ? 'pointer' : 'not-allowed'
          }}
        >
          Submit Proposal
        </button>
      </div>
    </Dialog>
  );
};

// Milestone Submit Dialog Component
const MilestoneSubmitDialog = ({ isOpen, onClose, onSubmit, milestoneIndex, showAlert }) => {
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
        showAlert('Invalid File Type', 'Please upload a ZIP file only', 'warning');
        e.target.value = '';
      }
    }
  };

  const uploadToIPFS = async () => {
    if (!file) {
      showAlert('No File Selected', 'Please select a file first', 'warning');
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
      
      showAlert('Upload Successful', 'File uploaded to IPFS successfully! ✅', 'success');
    } catch (error) {
      console.error('IPFS upload error:', error);
      showAlert('Upload Failed', 'Failed to upload to IPFS. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!ipfsHash.trim()) {
      showAlert('Upload Required', 'Please upload your work to IPFS first', 'warning');
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
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [proposalDialog, setProposalDialog] = useState({ isOpen: false, jobId: null });
  
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

  // Show alert dialog helper
  const showAlert = (title, message, type = 'info') => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

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
        showAlert('MetaMask Required', 'Please install MetaMask to use this platform!', 'warning');
        return;
      }
      
      setLoading(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        showAlert('Wrong Network', 'Please switch to Sepolia testnet in MetaMask!', 'warning');
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
      showAlert('Connection Failed', 'Failed to connect: ' + error.message, 'error');
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
        
        // Load preview links from localStorage
        const previewLinksKey = `previewLinks_${i}`;
        const previewLinks = JSON.parse(localStorage.getItem(previewLinksKey) || '{}');
        
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
          progress: (completedMilestones / milestones.length) * 100,
          previewLinks: previewLinks
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
        showAlert('Wallet Not Connected', 'Please connect wallet first', 'warning');
        return;
      }
      
      if (!jobForm.title || !jobForm.description) {
        showAlert('Missing Information', 'Please fill in all required fields', 'warning');
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
      showAlert('Job Creation Failed', 'Failed to create job: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit proposal
  const submitProposal = async (jobId) => {
    if (!contract) {
      showAlert('Wallet Not Connected', 'Please connect wallet first', 'warning');
      return;
    }
    
    setProposalDialog({ isOpen: true, jobId });
  };

  // Handle proposal submission
  const handleProposalSubmit = async (coverLetter, amount) => {
    try {
      setProposalDialog({ isOpen: false, jobId: null });
      setLoading(true);
      
      const tx = await contract.submitProposal(
        proposalDialog.jobId,
        coverLetter,
        ethers.parseEther(amount)
      );
      
      await tx.wait();
      showSuccessNotification('Proposal submitted! 🚀');
      await loadJobs(contract, account);
      
    } catch (error) {
      console.error('Error submitting proposal:', error);
      showAlert('Proposal Failed', 'Failed to submit proposal: ' + error.message, 'error');
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
      showAlert('Acceptance Failed', 'Failed to accept proposal: ' + error.message, 'error');
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
      
      // Store preview link in local state for display (since contract only stores IPFS hash)
      const jobIndex = jobs.findIndex(j => j.id === selectedJob);
      if (jobIndex !== -1 && previewLink) {
        const updatedJobs = [...jobs];
        if (!updatedJobs[jobIndex].previewLinks) {
          updatedJobs[jobIndex].previewLinks = {};
        }
        updatedJobs[jobIndex].previewLinks[selectedMilestone] = previewLink;
        setJobs(updatedJobs);
        
        // Store in localStorage for persistence
        const previewLinksKey = `previewLinks_${selectedJob}`;
        const existingLinks = JSON.parse(localStorage.getItem(previewLinksKey) || '{}');
        existingLinks[selectedMilestone] = previewLink;
        localStorage.setItem(previewLinksKey, JSON.stringify(existingLinks));
      }
      
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
      showAlert('Submission Failed', 'Failed to submit milestone: ' + error.message, 'error');
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
      showAlert('Approval Failed', 'Failed to approve milestone: ' + error.message, 'error');
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
                                <>
                                  <div className="deliverable-section">
                                    <div className="deliverable-info">
                                      <span className="deliverable-label">📦 Submitted Work:</span>
                                      {milestone.deliverableHash && (
                                        <a 
                                          href={`https://gateway.pinata.cloud/ipfs/${milestone.deliverableHash.replace('ipfs://', '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="deliverable-link"
                                        >
                                          📥 Download Files (ZIP)
                                        </a>
                                      )}
                                      {job.previewLinks && job.previewLinks[idx] && (
                                        <a 
                                          href={job.previewLinks[idx]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="deliverable-link preview-link"
                                        >
                                          🔗 View Live Preview
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <button 
                                    className="action-btn success"
                                    onClick={() => approveMilestone(job.id, idx)}
                                  >
                                    Approve & Pay
                                  </button>
                                </>
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

      {/* Alert Dialog */}
      <Dialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        type={alertDialog.type}
      >
        <p style={{ color: '#ccc', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
          {alertDialog.message}
        </p>
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      </Dialog>

      {/* Proposal Dialog */}
      <ProposalDialog
        isOpen={proposalDialog.isOpen}
        onClose={() => setProposalDialog({ isOpen: false, jobId: null })}
        onSubmit={handleProposalSubmit}
      />

      {/* Milestone Submit Dialog */}
      <MilestoneSubmitDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onSubmit={handleMilestoneSubmit}
        milestoneIndex={selectedMilestone || 0}
        showAlert={showAlert}
      />

      {/* Floating Action Button */}
      <div className="fab" onClick={() => setActiveTab('create')}>
        <span>+</span>
      </div>

      {/* Add CSS for deliverable section */}
      <style>{`
        .deliverable-section {
          margin: 0.75rem 0;
          padding: 1rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          width: 100%;
        }

        .deliverable-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .deliverable-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #93c5fd;
          margin-bottom: 0.25rem;
        }

        .deliverable-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
          align-self: flex-start;
        }

        .deliverable-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .deliverable-link.preview-link {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .deliverable-link.preview-link:hover {
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .milestone-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default App;