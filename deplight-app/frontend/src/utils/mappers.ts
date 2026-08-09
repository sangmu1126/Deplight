import type { Plant } from '../components/AppCard';

export interface FastAPIServiceDTO {
  id: string;
  name: string;
  description?: string;
  framework?: string;
  language?: string;
  runtime?: string;
  port?: number;
  status: string;
  deployedAt: string;
  commitSha?: string;
  branch?: string;
  url?: string;
  repository?: string;
}

const mapStatus = (apiStatus: string): Plant['status'] => {
  const normalized = apiStatus.toLowerCase();
  switch (normalized) {
    case 'healthy':
    case 'success':
    case 'completed':
      return 'HEALTHY';
    case 'deploying':
    case 'in_progress':
    case 'triggered':
    case 'pending':
      return 'DEPLOYING';
    case 'failed':
    case 'error':
      return 'ERROR';
    case 'sleeping':
      return 'SLEEPING';
    default:
      return 'ERROR'; // Safe fallback
  }
};

const determinePlantType = (framework?: string): Plant['plantType'] => {
  if (!framework) return 'pot';
  const f = framework.toLowerCase();
  if (f.includes('react') || f.includes('next')) return 'rose';
  if (f.includes('python') || f.includes('fastapi') || f.includes('django')) return 'sunflower';
  return 'pot';
};

export const mapServiceToPlant = (dto: FastAPIServiceDTO): Plant => {
  return {
    id: dto.id,
    version: dto.name || 'Unknown Version',
    description: dto.description || `${dto.framework || 'Unknown'} Application`,
    status: mapStatus(dto.status),
    updatedAt: new Date(dto.deployedAt),
    gitUrl: dto.repository,
    plantType: determinePlantType(dto.framework)
  };
};
