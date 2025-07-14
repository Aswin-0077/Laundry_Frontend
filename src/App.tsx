import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNavBar from './components/TopNavBar';
import SideBar from './components/SideBar';
// import Page from './pages/Page.tsx';
import Home from './pages/Home.tsx';
import LinenManagement from './pages/LinenManagement.tsx';
import WashItem from './pages/WashItem.tsx';
import VendorMapping from './pages/VendorMapping.tsx';
import OutsideWash from './pages/OutsideWash.tsx';
import DisposeItem from './pages/DisposeItem.tsx';
import { ToastContainer } from 'react-toastify';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';


const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const toggleSidebar = (): void => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#d9e0e7' }}>
        {/* Horizontal Top Nav Bar */}
        <TopNavBar />

        {/* Main content with Sidebar + Page content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* <SideBar collapsed={sidebarCollapsed} /> */}
          <SideBar collapsed={sidebarCollapsed}/>
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
          <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator />

            <Routes>
              {/* <Route path="/dashboard" element={<Page/>} /> */}
              <Route path="/home" element={<Home/>} />
              <Route path="/linen" element={<LinenManagement sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}/>} />
              <Route path="/wash-items" element={<WashItem sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}/>} />
              <Route path="/outside-wash" element={<OutsideWash sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}/>} />
              <Route path="/dispose-items" element={<DisposeItem sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}/>} />
              <Route path="/vendorMap" element={<VendorMapping sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}/>} />
            </Routes>
            <Footer />

          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={1500} />
    </Router> 
  );
};

export default App; 