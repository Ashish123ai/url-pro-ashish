import React from 'react';
import { Shield, ExternalLink, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-yellow-500 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-wide">
              PHISHDETECTOR
            </span>
          </div>

          {/* External Link */}
          <div className="mb-8">
            <a 
              href="https://phishingquiz.withgoogle.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Take a Phishing Test by GOOGLE
            </a>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-200 pt-8 space-y-4">
            <p className="text-gray-600">
              Final Year Project © 2024 All Rights Reserved
            </p>
            
            {/* Source Code Button */}
            <button className="inline-flex items-center border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
              <Github className="h-4 w-4 mr-2" />
              Source Code
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;