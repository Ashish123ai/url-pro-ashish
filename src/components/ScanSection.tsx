import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Globe, Shield, Clock, Loader, Brain, Lock } from 'lucide-react';
import { URLScannerService, ScanResult } from '../services/urlScanner';
import ScanResults from './ScanResults';
import { ZeroTrustValidator } from '../services/zeroTrust';
import { BlockchainLogger } from '../services/blockchainLogger';
import { Web3AuthService } from '../services/web3Auth';

const ScanSection: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState('');

  const urlScanner = URLScannerService.getInstance();

  const handleScan = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const normalizedUrl = urlScanner.normalizeURL(trimmedUrl);
    if (!urlScanner.validateURL(normalizedUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setError(null);
    setScanProgress('Initiating scan...');

    try {
      const currentUser = Web3AuthService.getCurrentUser();

      setScanProgress('Validating request (Zero-Trust)...');
      const validation = await ZeroTrustValidator.validateScanRequest(
        normalizedUrl,
        currentUser?.walletAddress
      );

      if (!validation.isValid) {
        setError('Security validation failed. Please try again.');
        setIsScanning(false);
        return;
      }

      setScanProgress('Analyzing URL with AI/ML...');
      const result = await urlScanner.scanUrl(normalizedUrl);

      if (result.status === 'pending') {
        await pollScanResults(result.id);
      } else {
        setScanResult(result);

        if (result.safety_score < 70) {
          setScanProgress('Logging threat to blockchain...');
          await BlockchainLogger.logThreatDetection(
            normalizedUrl,
            {
              threatScore: result.safety_score,
              isPhishing: !result.is_safe,
              mlConfidence: result.ml_confidence,
              categories: result.threat_categories
            },
            currentUser?.walletAddress
          );
        }
      }
    } catch (error) {
      console.error('Scan failed:', error);
      setError(error instanceof Error ? error.message : 'Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const pollScanResults = async (scanId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        setScanProgress(`Analyzing URL... (${attempts}/30)`);
        
        const result = await urlScanner.getScanStatus(scanId);
        
        if (result.status === 'completed') {
          setScanResult(result);
          return;
        } else if (result.status === 'failed') {
          setError('Scan failed. Please try again.');
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          setError('Scan timeout. Please try again.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setError('Failed to get scan results. Please try again.');
      }
    };

    poll();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  return (
    <section id="home" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          FAKE WEBSITE DETECTION
        </h1>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Protect yourself from phishing attacks with real-time URL analysis. 
          Get comprehensive security reports including SSL certificates, domain age, and threat intelligence.
        </p>

        {/* Search Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a URL link in format http or https"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isScanning}
              />
              <Globe className="absolute right-4 top-4 h-6 w-6 text-gray-400" />
            </div>
            <button
              onClick={handleScan}
              disabled={isScanning || !url.trim()}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center min-w-[140px]"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Scan URL
                </>
              )}
            </button>
          </div>

          {/* Scanning Progress */}
          {isScanning && (
            <div className="mt-8">
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
                  <Loader className="animate-spin h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-blue-700 font-medium">{scanProgress}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-gray-600 text-sm">
                <div className="flex items-center">
                  <div className="animate-pulse h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                  SSL Validation
                </div>
                <div className="flex items-center">
                  <div className="animate-pulse h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
                  Domain Analysis
                </div>
                <div className="flex items-center">
                  <div className="animate-pulse h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  Threat Intelligence
                </div>
                <div className="flex items-center">
                  <div className="animate-pulse h-3 w-3 bg-purple-500 rounded-full mr-2"></div>
                  AI/ML Classification
                </div>
                <div className="flex items-center">
                  <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                  Zero-Trust Check
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scan Results */}
        {scanResult && <ScanResults result={scanResult} />}

        {/* Real-time Data Notice */}
        {!scanResult && !isScanning && (
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Security Analysis</h3>
              <p className="text-gray-600 mb-4">
                Our system uses AI-powered ML models and blockchain technology to provide advanced threat detection with zero-trust security validation.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Brain className="h-4 w-4 text-purple-500 mr-2" />
                  AI/ML threat classification
                </div>
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-blue-500 mr-2" />
                  Zero-trust validation
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Blockchain threat logging
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-yellow-500 mr-2" />
                  Web3 authentication
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cybersecurity Illustration */}
        {!scanResult && (
          <div className="mt-16">
            <img 
              src="https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=800" 
              alt="Cybersecurity illustration" 
              className="mx-auto max-w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ScanSection;