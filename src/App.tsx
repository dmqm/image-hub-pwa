import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { SearchHub } from './components/SearchHub';
import { AIGenerator } from './components/AIGenerator';
import { MemeMaker } from './components/MemeMaker';
import { CreatorSpace } from './components/CreatorSpace';
import { Studio } from './components/Studio';
import { Gallery } from './components/Gallery';
import { SettingsPanel } from './components/Settings';

const MainAppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return <SearchHub />;
      case 'ai':
        return <AIGenerator />;
      case 'meme':
        return <MemeMaker />;
      case 'creator':
        return <CreatorSpace />;
      case 'studio':
        return <Studio />;
      case 'gallery':
        return <Gallery />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <SearchHub />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
