import React, { useState, useEffect } from 'react';
import './GithubActionModal.css';
import { apiFetch } from '../api';

interface Step {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
}

interface Job {
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  steps?: Step[];
}

interface Props {
  deploymentId: string;
  onClose: () => void;
}

const GithubActionModal: React.FC<Props> = ({ deploymentId, onClose }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runUrl, setRunUrl] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await apiFetch(`/deploy/${deploymentId}/github-actions`);
        const data = await response.json();
        
        if (data.success) {
          if (data.jobs && data.jobs.length > 0) {
            setJobs(data.jobs);
            setRunUrl(data.url);
          }
          setLoading(false);
        } else {
          setError(data.error || 'Failed to fetch GitHub Actions');
          setLoading(false);
        }
      } catch {
        setError('Network error');
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [deploymentId]);

  return (
    <div className="github-modal-overlay">
      <div className="github-modal-content">
        <div className="github-modal-header">
          <h2><span className="github-icon"></span> GitHub Actions Pipeline</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="github-modal-body">
          {loading && jobs.length === 0 ? (
            <div className="github-loading">Loading pipeline data...</div>
          ) : error ? (
            <div className="github-error">{error}</div>
          ) : jobs.length === 0 ? (
            <div className="github-waiting">Waiting for GitHub Actions to start...</div>
          ) : (
            <div className="github-jobs-list">
              {jobs.map((job, idx) => (
                <div key={idx} className="github-job-container">
                  <div className={`github-job ${job.status} ${job.conclusion || ''}`}>
                    <div className="job-status-icon">
                      {job.status === 'in_progress' && <div className="spinner"></div>}
                      {job.conclusion === 'success' && <span className="success-icon">✓</span>}
                      {job.conclusion === 'failure' && <span className="failure-icon">✗</span>}
                      {job.status === 'queued' && <span className="queued-icon">○</span>}
                    </div>
                    <div className="job-details">
                      <div className="job-name">{job.name}</div>
                      <div className="job-time">
                        {job.started_at && new Date(job.started_at).toLocaleTimeString()} 
                        {job.completed_at && ` - ${new Date(job.completed_at).toLocaleTimeString()}`}
                      </div>
                    </div>
                    <div className="job-state-text">
                      {job.status === 'in_progress' ? 'In Progress' : job.conclusion || job.status}
                    </div>
                  </div>
                  
                  {job.steps && job.steps.length > 0 && (
                    <div className="job-steps">
                      {job.steps.map((step, sIdx) => (
                        <div key={sIdx} className={`job-step ${step.status} ${step.conclusion || ''}`}>
                          <div className="step-icon">
                            {step.status === 'in_progress' && <div className="spinner-small"></div>}
                            {step.conclusion === 'success' && <span className="success-icon-small">✓</span>}
                            {step.conclusion === 'failure' && <span className="failure-icon-small">✗</span>}
                            {step.status === 'queued' && <span className="queued-icon-small">○</span>}
                          </div>
                          <div className="step-name">{step.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {runUrl && (
          <div className="github-modal-footer">
            <a href={runUrl} target="_blank" rel="noopener noreferrer" className="github-link-btn">
              View on GitHub
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubActionModal;
