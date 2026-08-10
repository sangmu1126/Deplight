
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import './PipelineMonitor.css';

interface PipelineMonitorProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
  status: string;
}

const PipelineMonitor = ({ progress, currentStep, status }: PipelineMonitorProps) => {
  const steps = [
    'Git Clone',
    'AI Analysis',
    'Test & Build',
    'Docker Image Push',
    'ECS Infrastructure',
    'Deploy Service',
    'Health Check',
    'Finish'
  ];

  return (
    <div className="pipeline-monitor">
      <div className="pipeline-header">
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>배포 진행 상황</h3>
        <span className="pipeline-progress-text">{Math.round(progress)}%</span>
      </div>
      
      <div className="pipeline-progress-bar-container">
        <div className="pipeline-progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="pipeline-steps-grid">
        {steps.map((stepName, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep || status === 'HEALTHY' || progress === 100;
          const isCurrent = stepNum === currentStep && status !== 'HEALTHY' && progress < 100;
          
          let icon = <Circle size={14} className="step-pending" />;
          let textClass = 'step-text-pending';
          
          if (isCompleted) {
            icon = <CheckCircle2 size={14} className="step-completed" />;
            textClass = 'step-text-completed';
          } else if (isCurrent) {
            icon = <Loader2 size={14} className="step-current animate-spin" />;
            textClass = 'step-text-current';
          }

          return (
            <div key={index} className="pipeline-step-item">
              <div className="step-icon-wrapper">{icon}</div>
              <span className={textClass}>{stepName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineMonitor;
