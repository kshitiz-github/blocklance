import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import contractData from './contracts/FreelanceMarketplace.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractData.address;
const CONTRACT_ABI = contractData.abi;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// --- Modal Component ---
const CustomModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState({ client: [], freelancer: [] });
  const [loading, setLoading] = useState(false);
  const [reputation, setReputation] = useState(0);
  const [stats, setStats] = useState({ totalJobs: 0, activeJobs: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalProps, setModalProps] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const [jobForm, setJobForm] = useState({
    title: '', description: '', category: 'Smart Contract Development', milestones: [{ description: '', amount: '' }]
  });

  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
      window.ethereum.on('accountsChanged', () => window.location.reload());
    }
  }, []);

  const showModal = (type, props = {}) => {
    setModalType(type);
    setModalProps(props);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setModalProps({});
    setSelectedFile(null);
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return showModal("notification", { title: "MetaMask Not Found", message: "Please install MetaMask." });
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        setLoading(false);
        return showModal("notification", { title: "Wrong Network", message: "Please switch to the Sepolia testnet." });
      }
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setAccount(accounts[0]);
      const bal = await provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(bal));
      const rep = await contractInstance.userReputation(accounts[0]);
      setReputation(rep.toString());
      setContract(contractInstance);
      await loadJobs(contractInstance, accounts[0]);
    } catch (error) {
      showModal("notification", { title: "Connection Error", message: "Failed to connect wallet." });
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async (contractInstance, userAddress) => {
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
          id: i, client: job.client, title: job.title, description: job.description,
          budget: ethers.formatEther(job.totalBudget), isActive: job.isActive, freelancer: job.freelancer,
          milestonesCount: job.milestonesCount.toString(), milestones: milestones, proposals: proposals,
          completedMilestones: completedMilestones,
          progress: milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0
        });
      }
      const reversedJobs = jobsList.reverse();
      setJobs(reversedJobs);
      if (userAddress) {
        const clientJobs = await contractInstance.getClientJobs(userAddress);
        const freelancerJobs = await contractInstance.getFreelancerJobs(userAddress);
        setMyJobs({ client: clientJobs.map(id => id.toString()), freelancer: freelancerJobs.map(id => id.toString()) });
      }
      loadStats(reversedJobs);
    } catch (error) { console.error('Error loading jobs:', error); }
    finally { setLoading(false); }
  };

  const loadStats = (allJobs) => {
    const activeJobsCount = allJobs.filter(job => job.isActive).length;
    setStats({ activeJobs: activeJobsCount, totalJobs: allJobs.length });
  };
  
  const handleFileUploadAndSubmit = async () => {
    if (!selectedFile || !modalProps.jobId) return showModal("notification", { title: "Error", message: "Please select a file." });
    setLoading(true);
    closeModal();
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('job_id', modalProps.jobId);
    formData.append('milestone_index', modalProps.milestoneIndex);
    formData.append('uploaded_by', account);
    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('File upload failed');
      const result = await response.json();
      const tx = await contract.submitMilestone(modalProps.jobId, modalProps.milestoneIndex, result.file_url);
      await tx.wait();
      showModal("notification", { title: "Success", message: "Work submitted successfully!" });
      await loadJobs(contract, account);
    } catch (error) {
      showModal("notification", { title: "Error", message: "Failed to submit your work." });
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  const createJob = async () => {
    if (!contract) return showModal("notification", { title: "Error", message: "Please connect wallet." });
    setLoading(true);
    try {
      const milestoneAmounts = jobForm.milestones.map(m => ethers.parseEther(m.amount || '0'));
      const milestoneDescriptions = jobForm.milestones.map(m => m.description);
      const totalAmount = milestoneAmounts.reduce((a, b) => a + b, 0n);
      const tx = await contract.createJob(jobForm.title, jobForm.description, milestoneAmounts, milestoneDescriptions, { value: totalAmount });
      await tx.wait();
      showModal("notification", { title: "Success!", message: "Your job has been posted." });
      setJobForm({ title: '', description: '', category: 'Smart Contract Development', milestones: [{ description: '', amount: '' }] });
      await loadJobs(contract, account);
    } catch (error) { showModal("notification", { title: "Transaction Failed", message: error?.data?.message || error.message }); }
    finally { setLoading(false); }
  };
  
  const handleProposalSubmit = async () => {
    const coverLetter = document.getElementById('coverLetterInput').value;
    const amount = document.getElementById('amountInput').value;
    if (!coverLetter || !amount) return;
    setLoading(true);
    closeModal();
    try {
      const tx = await contract.submitProposal(modalProps.jobId, coverLetter, ethers.parseEther(amount));
      await tx.wait();
      showModal("notification", { title: "Success", message: "Proposal submitted." });
      await loadJobs(contract, account);
    } catch (error) { showModal("notification", { title: "Error", message: "Failed to submit proposal." }); }
    finally { setLoading(false); }
  };
  
  const submitProposal = (jobId) => showModal("submitProposal", { jobId });
  const submitMilestone = (jobId, milestoneIndex) => showModal("submitMilestone", { jobId, milestoneIndex });

  const acceptProposal = async (jobId, proposalIndex) => {
    setLoading(true);
    try {
      const tx = await contract.acceptProposal(jobId, proposalIndex);
      await tx.wait();
      showModal("notification", { title: "Success", message: "Proposal accepted! The project has started." });
      await loadJobs(contract, account);
    } catch (error) { showModal("notification", { title: "Error", message: "Failed to accept proposal." }); }
    finally { setLoading(false); }
  };

  const approveMilestone = async (jobId, milestoneIndex) => {
    setLoading(true);
    try {
      const tx = await contract.approveMilestone(jobId, milestoneIndex);
      await tx.wait();
      showModal("notification", { title: "Payment Released!", message: "Payment sent to the freelancer." });
      await loadJobs(contract, account);
    } catch (error) { showModal("notification", { title: "Error", message: "Failed to approve milestone." }); }
    finally { setLoading(false); }
  };

  const addMilestone = () => setJobForm(p => ({ ...p, milestones: [...p.milestones, { description: '', amount: '' }] }));
  const removeMilestone = (i) => setJobForm(p => ({ ...p, milestones: p.milestones.filter((_, idx) => i !== idx) }));
  const updateMilestone = (i, f, v) => {
    const newM = [...jobForm.milestones];
    newM[i][f] = v;
    setJobForm(p => ({ ...p, milestones: newM }));
  };
  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const renderModalContent = () => {
    switch (modalType) {
      case 'notification':
        return <p>{modalProps.message}</p>;
      case 'submitProposal':
        return (
          <div>
            <textarea id="coverLetterInput" className="modal-textarea" placeholder="Write a compelling cover letter..."></textarea>
            <input id="amountInput" type="number" step="0.01" className="modal-input" placeholder="Proposed amount in ETH" />
            <button className="modal-confirm-btn" onClick={handleProposalSubmit}>Submit</button>
          </div>
        );
      case 'submitMilestone':
        return (
          <div>
            <p>Upload your work file for this milestone.</p>
            <input type="file" className="modal-input" onChange={(e) => setSelectedFile(e.target.files[0])} />
            {selectedFile && <p className="file-name">Selected: {selectedFile.name}</p>}
            <button className="modal-confirm-btn" onClick={handleFileUploadAndSubmit} disabled={!selectedFile}>
              Upload and Submit
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <CustomModal isOpen={isModalOpen} onClose={closeModal} title={modalProps.title || modalType}>
        {renderModalContent()}
      </CustomModal>
      <div className="app">
        <header className="glass-header">
           <div className="logo">
             <div className="logo-icon">🔗</div>
             <h1>BlockLance</h1>
           </div>
           <div className="wallet-info">
             {account ? (
               <>
                 <div className="wallet-stat"><span className="stat-label">Account</span><span className="stat-value">{formatAddress(account)}</span></div>
                 <div className="wallet-stat"><span className="stat-label">Balance</span><span className="stat-value">{parseFloat(balance).toFixed(4)} ETH</span></div>
                 <div className="wallet-stat"><span className="stat-label">Reputation</span><span className="stat-value">⭐ {reputation}</span></div>
                 <button className="connect-btn connected">Connected</button>
               </>
             ) : (
               <button className="connect-btn" onClick={connectWallet} disabled={loading}>
                 {loading ? 'Connecting...' : 'Connect Wallet'}
               </button>
             )}
           </div>
        </header>
        <nav className="nav-container">
           <div className="tabs">
             <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
             <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Browse Jobs</button>
             <button className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>Post Job</button>
             <button className={`tab-btn ${activeTab === 'my-jobs' ? 'active' : ''}`} onClick={() => setActiveTab('my-jobs')}>My Work</button>
           </div>
        </nav>
        <main className="main-content">
          {loading && <div className="loading-spinner-overlay"><div className="loading-spinner"></div></div>}
          
          {activeTab === 'dashboard' && (
            <div className="tab-content">
              <h2 className="section-title">Dashboard</h2>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-number">{stats.totalJobs}</div><div className="stat-desc">Total Jobs</div></div>
                <div className="stat-card"><div className="stat-number">{stats.activeJobs}</div><div className="stat-desc">Active Jobs</div></div>
                <div className="stat-card"><div className="stat-number">{myJobs.client.length}</div><div className="stat-desc">Your Client Jobs</div></div>
                <div className="stat-card"><div className="stat-number">{myJobs.freelancer.length}</div><div className="stat-desc">Your Freelance Jobs</div></div>
              </div>
              <h3 className="section-subtitle">Recent Jobs</h3>
              <div className="job-grid">
                {jobs.slice(0, 4).map(job => (
                  <div key={job.id} className="job-card modern">
                    <div className="job-header">
                      <h3 className="job-title">{job.title}</h3>
                      <span className="job-budget">{job.budget} ETH</span>
                    </div>
                    <div className="job-meta">
                      <span className="meta-tag">{job.isActive ? '🟢 Active' : '✅ Completed'}</span>
                      <span className="meta-tag">📊 {job.milestonesCount} Milestones</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
                    {job.freelancer !== '0x0000000000000000000000000000000000000000' ? (
                      <div className="active-work">
                        <h4>Work Progress</h4>
                        {job.milestones.map((milestone, idx) => (
                          <div key={idx} className="milestone-status">
                            <span>Block {idx + 1}: {milestone.description}</span>
                            <div className="milestone-actions">
                              {milestone.isPaid && <span className="status-badge paid">✅ Paid</span>}
                              {milestone.isCompleted && !milestone.isPaid && (
                                <>
                                  <span className="status-badge pending">⏳ Pending</span>
                                  <button 
                                    className="action-btn" 
                                    onClick={() => window.open(`${BACKEND_URL}${milestone.deliverableHash}`, '_blank')}
                                  >
                                    View File
                                  </button>
                                </>
                              )}
                              {job.freelancer.toLowerCase() === account?.toLowerCase() && !milestone.isCompleted && (
                                <button className="action-btn" onClick={() => submitMilestone(job.id, idx)}>Submit Work</button>
                              )}
                              {job.client.toLowerCase() === account?.toLowerCase() && milestone.isCompleted && !milestone.isPaid && (
                                <button className="action-btn success" onClick={() => approveMilestone(job.id, idx)}>Approve & Pay</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      job.client.toLowerCase() === account?.toLowerCase() && job.proposals.length > 0 && (
                        <div className="proposals-section">
                          <h4>Proposals</h4>
                          {job.proposals.map((prop, idx) => (
                            <div key={idx} className="proposal-card">
                              <p className="proposal-freelancer">{formatAddress(prop.freelancer)}</p>
                              <p className="proposal-amount">{ethers.formatEther(prop.proposedAmount)} ETH</p>
                              <button className="action-btn success" onClick={() => acceptProposal(job.id, idx)}>Accept</button>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                    {job.freelancer === '0x0000000000000000000000000000000000000000' && job.client.toLowerCase() !== account?.toLowerCase() && (
                      <button className="action-btn primary" onClick={() => submitProposal(job.id)}>Submit Proposal</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="tab-content">
              <h2 className="section-title">Post a New Job</h2>
              <div className="form-container">
                <div className="form-group"><label>Job Title</label><input type="text" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} /></div>
                <div className="form-group"><label>Description</label><textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} /></div>
                <div className="form-group"><label>Project Milestones</label>
                  <div className="milestones-builder">
                    {jobForm.milestones.map((m, i) => (
                      <div key={i} className="milestone-form-item">
                        <span className="milestone-number-badge">Block {i + 1}</span>
                        <input type="text" placeholder="Description" value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)} />
                        <input type="number" placeholder="Amount (ETH)" value={m.amount} onChange={(e) => updateMilestone(i, 'amount', e.target.value)} />
                        {jobForm.milestones.length > 1 && <button className="remove-btn" onClick={() => removeMilestone(i)}>✕</button>}
                      </div>
                    ))}
                    <button className="add-milestone-btn" onClick={addMilestone}>+ Add Milestone</button>
                  </div>
                </div>
                <button className="submit-btn" onClick={createJob} disabled={loading || !account}>Create Job & Fund Escrow</button>
              </div>
            </div>
          )}

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
                          <span className={`status-pill ${job.isActive ? 'active' : 'completed'}`}>{job.isActive ? 'Active' : 'Completed'}</span>
                          <span className="info-text">Freelancer: {job.freelancer !== '0x0000000000000000000000000000000000000000' ? formatAddress(job.freelancer) : 'N/A'}</span>
                        </div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${job.progress}%` }}></div></div>
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
                          <span className={`status-pill ${job.isActive ? 'active' : 'completed'}`}>{job.isActive ? 'Active' : 'Completed'}</span>
                          <span className="info-text">Client: {formatAddress(job.client)}</span>
                        </div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${job.progress}%` }}></div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Added this export line
export default App;