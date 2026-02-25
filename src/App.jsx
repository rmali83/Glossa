import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Translation from './pages/Translation';
import LanguageDetail from './pages/LanguageDetail';
import ContentWriting from './pages/ContentWriting';
import Contact from './pages/Contact';
import TranslatorOnboarding from './pages/TranslatorOnboarding';
import WebDevelopment from './pages/WebDevelopment';
import WebDevelopmentService from './pages/WebDevelopmentService';

// Dashboard Components
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import Profile from './pages/dashboard/Profile';
import Jobs from './pages/dashboard/Jobs';
import Payments from './pages/dashboard/Payments';
import Settings from './pages/dashboard/Settings';
import Onboarding from './pages/Onboarding';

import './App.css';

import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public Routes with Navbar */}
        <Route path="*" element={
          <>
            <Navbar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/translation" element={<Translation />} />
                <Route path="/translation/language/:languageName" element={<LanguageDetail />} />
                <Route path="/content-writing" element={<ContentWriting />} />
                <Route path="/web-development" element={<WebDevelopment />} />
                <Route path="/web-development/:serviceId" element={<WebDevelopmentService />} />
                <Route path="/join-us" element={<TranslatorOnboarding />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </div>
            <footer className="footer">
              <p>&copy; 2026 Glossa Agency. All rights reserved.</p>
            </footer>
          </>
        } />

        {/* Dashboard Routes (No Navbar/Footer) */}
        <Route path="/dashboard/*" element={
          <PrivateRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </DashboardLayout>
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
