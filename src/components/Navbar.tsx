import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, Sparkles, Laugh, Palette, Sliders, Image, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'search', label: '搜图中心', icon: Search },
    { id: 'ai', label: 'AI 生图', icon: Sparkles },
    { id: 'meme', label: '表情包制作', icon: Laugh },
    { id: 'creator', label: '创意画坊', icon: Palette },
    { id: 'studio', label: '图像处理', icon: Sliders },
    { id: 'gallery', label: '我的画廊', icon: Image },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="brand-logo">IH</div>
        <span className="brand-name">ImageHub</span>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <div
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
