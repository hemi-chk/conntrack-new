import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const currentRoute = useLocation();

  const handleMenuClick = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="min-h-screen bg-surface-light">
      <Header onMenuClick={handleMenuClick} />
      
      <Sidebar 
        isOpen={isSidebarVisible} 
        currentPath={currentRoute.pathname}
      />
      
      {/* Shift main content container depending on sidebar state */}
      <main className={`
        pt-20 transition-all duration-300
        ${isSidebarVisible ? 'ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}