import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Translation from './pages/Translation';
import ContentWriting from './pages/ContentWriting';
import Contact from './pages/Contact';
import TranslatorOnboarding from './pages/TranslatorOnboarding';
import WebDevelopment from './pages/WebDevelopment';
import WebDevelopmentService from './pages/WebDevelopmentService';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/translation" element={<Translation />} />
          <Route path="/content-writing" element={<ContentWriting />} />
          <Route path="/web-development" element={<WebDevelopment />} />
          <Route path="/web-development/:serviceId" element={<WebDevelopmentService />} />
          <Route path="/join-us" element={<TranslatorOnboarding />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
      <footer className="footer">
        <p>&copy; 2026 Glossa Agency. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
