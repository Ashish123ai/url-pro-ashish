import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, Globe, Lock, Clock, MapPin, Database, Info, Download, ExternalLink, ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import Header from './components/Header';
import ScanSection from './components/ScanSection';
import Dashboard from './components/Dashboard';
import FAQSection from './components/FAQSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <Header />
      <main>
        <ScanSection />
        <Dashboard />
        <FAQSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;