import React, { useState } from 'react';
import { Shield, Menu, X, Download, ChevronDown } from 'lucide-react';
import Web3AuthButton from './Web3AuthButton';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-yellow-500 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-wide">
              PHISHDETECTOR
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Home
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              About
            </a>
            <a href="#usecases" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Usecases
            </a>
            <div className="relative">
              <button
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                className="flex items-center text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Help
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {isHelpOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <a href="#faq" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    FAQ
                  </a>
                  <a href="#guide" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    User Guide
                  </a>
                  <a href="#support" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    Support
                  </a>
                </div>
              )}
            </div>
            <Web3AuthButton />
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium">
                About
              </a>
              <a href="#usecases" className="text-gray-700 hover:text-blue-600 font-medium">
                Usecases
              </a>
              <a href="#faq" className="text-gray-700 hover:text-blue-600 font-medium">
                FAQ
              </a>
              <div className="pt-2">
                <Web3AuthButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;