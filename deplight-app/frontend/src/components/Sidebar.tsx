import { LayoutDashboard, Rocket, Settings, CloudLightning } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
    { id: 'deploy', icon: Rocket, label: '새 앱 배포' },
    { id: 'settings', icon: Settings, label: '설정' },
  ];

  return (
    <aside className="sidebar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
      <div className="sidebar-header">
        <CloudLightning className="logo-icon" />
        <span className="logo-text">Deplight V3</span>
      </div>
      
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="nav-item-icon" />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Workspace Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
