import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import LandingPage from "./LandingPage";
import MagnetLines from "./components/MagnetLines";
import TargetCursor from "./components/TargetCursor";
import contractData from "./contracts/FreelanceMarketplace.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractData.address;
const CONTRACT_ABI = contractData.abi;

const MilestoneSubmitDialog = ({ isOpen, onClose, onSubmit, milestoneIndex }) => {
  const [deliverable, setDeliverable] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(milestoneIndex, deliverable);
    setDeliverable("");
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>Submit Milestone {milestoneIndex + 1}</h3>
        <textarea
          placeholder="Describe your deliverable and provide any relevant links..."
          value={deliverable}
          onChange={(e) => setDeliverable(e.target.value)}
        />
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [balance, setBalance] = useState("0");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [showLanding, setShowLanding] = useState(true);

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    category: "Smart Contract Development",
    milestones: [{ description: "", amount: "" }],
  });

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        setAccount(accounts[0]);
        setContract(contractInstance);

        const balance = await provider.getBalance(accounts[0]);
        setBalance(ethers.formatEther(balance));
        
        // Add a smooth transition delay
        setTimeout(() => setShowLanding(false), 2000);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const loadJobs = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const jobCounter = await contract.jobCounter();
      const jobsList = [];

      for (let i = 1; i <= jobCounter; i++) {
        const job = await contract.jobs(i);
        const milestones = await contract.getJobMilestones(i);
        const completedMilestones = milestones.filter((m) => m.isPaid).length;

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
          completedMilestones: completedMilestones,
          progress: (completedMilestones / milestones.length) * 100,
        });
      }
      setJobs(jobsList);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const createJob = async () => {
    try {
      if (!contract) {
        alert("Please connect wallet first");
        return;
      }

      setLoading(true);
      const milestoneAmounts = jobForm.milestones.map((m) =>
        ethers.parseEther(m.amount || "0")
      );
      const milestoneDescriptions = jobForm.milestones.map(
        (m) => m.description || ""
      );
      const totalAmount = milestoneAmounts.reduce((a, b) => a + b, 0n);

      const tx = await contract.createJob(
        jobForm.title,
        jobForm.description,
        milestoneAmounts,
        milestoneDescriptions,
        { value: totalAmount }
      );

      await tx.wait();
      setJobForm({
        title: "",
        description: "",
        category: "Smart Contract Development",
        milestones: [{ description: "", amount: "" }],
      });
      await loadJobs();
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneSubmit = async (milestoneIndex, deliverable) => {
    // Implementation for milestone submission
    console.log("Milestone submitted:", milestoneIndex, deliverable);
  };

  const addMilestone = () => {
    setJobForm({
      ...jobForm,
      milestones: [...jobForm.milestones, { description: "", amount: "" }],
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

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    if (contract) {
      loadJobs();
    }
  }, [contract]);

  if (showLanding || !account) {
    return <LandingPage onConnect={connectWallet} account={account} />;
  }

  return (
    <>
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <MagnetLines 
        rows={20}
        columns={20}
        containerSize="100vw"
        lineColor="#d1d5db"
        lineWidth="0.5vmin"
        lineHeight="3.5vmin"
        baseAngle={0}
      />
      <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <div className="logo-cube-mini">
              <div className="cube-face-mini front">B</div>
              <div className="cube-face-mini back">L</div>
              <div className="cube-face-mini right">O</div>
              <div className="cube-face-mini left">C</div>
              <div className="cube-face-mini top">K</div>
              <div className="cube-face-mini bottom">L</div>
            </div>
          </div>
          <h1>BlockLance</h1>
        </div>
        <div className="wallet-info">
          <div className="wallet-stat">
            <div className="stat-label">Balance</div>
            <div className="stat-value">{parseFloat(balance).toFixed(4)} ETH</div>
          </div>
          <div className="wallet-stat">
            <div className="stat-label">Address</div>
            <div className="stat-value">{formatAddress(account)}</div>
          </div>
          <button className="disconnect-btn cursor-target" onClick={() => setShowLanding(true)}>
            Disconnect
          </button>
        </div>
      </header>

      <div className="nav-container">
        <nav className="tabs">
          <button
            className={`tab-btn cursor-target ${activeTab === "browse" ? "active" : ""}`}
            onClick={() => setActiveTab("browse")}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            Browse Jobs
          </button>
          <button
            className={`tab-btn cursor-target ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Job
          </button>
          <button
            className={`tab-btn cursor-target ${activeTab === "my-jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("my-jobs")}
          >
            <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,6V4H10V6H14M20,8A2,2 0 0,1 22,10V19A2,2 0 0,1 20,21H4C2.89,21 2,20.1 2,19V10C2,8.89 2.89,8 4,8H20Z"/>
            </svg>
            My Work
          </button>
        </nav>
      </div>

      <main className="main-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        {activeTab === "browse" && (
          <div className="tab-content">
            <h2 className="section-title">Available Jobs</h2>
            <div className="job-grid">
              {jobs
                .filter((job) => job.isActive)
                .map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-header">
                      <h3 className="job-title">{job.title}</h3>
                      <span className="job-budget">{job.budget} ETH</span>
                    </div>
                    <p className="job-description">{job.description}</p>
                    <div className="job-meta">
                      <span className="meta-tag">👤 {formatAddress(job.client)}</span>
                      <span className="meta-tag">📊 {job.milestonesCount} Milestones</span>
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
        )}

        {activeTab === "create" && (
          <div className="tab-content">
            <h2 className="section-title">Create New Job</h2>
            <div className="form-container">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  placeholder="Enter job title..."
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, title: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the job requirements, skills needed, and project details..."
                  value={jobForm.description}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={jobForm.category}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, category: e.target.value })
                  }
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
                <label>Project Milestones</label>
                <div className="milestones-builder">
                  {jobForm.milestones.map((milestone, index) => (
                    <div key={index} className="milestone-form-item">
                      <div className="milestone-number-badge">
                        Block {index + 1}
                      </div>
                      <input
                        type="text"
                        placeholder="Milestone description"
                        value={milestone.description}
                        onChange={(e) =>
                          updateMilestone(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount (ETH)"
                        value={milestone.amount}
                        onChange={(e) =>
                          updateMilestone(index, "amount", e.target.value)
                        }
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

                  <button
                    className="add-milestone-btn"
                    onClick={addMilestone}
                  >
                    + Add Another Milestone
                  </button>
                </div>
              </div>

              <div className="form-summary">
                <div className="summary-item">
                  <span>Total Budget:</span>
                  <span className="summary-value">
                    {jobForm.milestones
                      .reduce((sum, m) => sum + parseFloat(m.amount || 0), 0)
                      .toFixed(3)}{" "}
                    ETH
                  </span>
                </div>
                <div className="summary-item">
                  <span>Number of Milestones:</span>
                  <span className="summary-value">
                    {jobForm.milestones.length}
                  </span>
                </div>
              </div>

              <button
                className="submit-btn cursor-target"
                onClick={createJob}
                disabled={loading || !account}
              >
                {loading ? "Creating..." : "Create Job & Fund Escrow"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "my-jobs" && (
          <div className="tab-content">
            <h2 className="section-title">My Work</h2>
            <div className="my-jobs-grid">
              <div className="jobs-section">
                <h3 className="section-subtitle">As Client</h3>
                <div className="job-list">
                  {jobs
                    .filter(
                      (j) => j.client.toLowerCase() === account?.toLowerCase()
                    )
                    .map((job) => (
                      <div key={job.id} className="my-job-card">
                        <h4>{job.title}</h4>
                        <div className="job-info">
                          <span
                            className={`status-pill ${
                              job.isActive ? "active" : "completed"
                            }`}
                          >
                            {job.isActive ? "Active" : "Completed"}
                          </span>
                          <span className="info-text">
                            Freelancer:{" "}
                            {job.freelancer !==
                            "0x0000000000000000000000000000000000000000"
                              ? formatAddress(job.freelancer)
                              : "Not assigned"}
                          </span>
                          <span className="info-text">
                            Progress: {job.completedMilestones}/
                            {job.milestonesCount}
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
                  {jobs
                    .filter(
                      (j) =>
                        j.freelancer.toLowerCase() === account?.toLowerCase()
                    )
                    .map((job) => (
                      <div key={job.id} className="my-job-card">
                        <h4>{job.title}</h4>
                        <div className="job-info">
                          <span
                            className={`status-pill ${
                              job.isActive ? "active" : "completed"
                            }`}
                          >
                            {job.isActive ? "In Progress" : "Completed"}
                          </span>
                          <span className="info-text">
                            Client: {formatAddress(job.client)}
                          </span>
                          <span className="info-text">
                            Earnings:{" "}
                            {job.milestones
                              .filter((m) => m.isPaid)
                              .reduce(
                                (sum, m) =>
                                  sum +
                                  parseFloat(ethers.formatEther(m.amount)),
                                0
                              )
                              .toFixed(3)}{" "}
                            ETH
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

      <MilestoneSubmitDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onSubmit={handleMilestoneSubmit}
        milestoneIndex={selectedMilestone || 0}
      />
      </div>
    </>
  );
}

export default App;