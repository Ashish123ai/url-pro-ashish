import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Globe, Lock, Clock, MapPin, Database, ExternalLink, Calendar, Server } from 'lucide-react';
import { ScanResult } from '../services/urlScanner';
import { URLScannerService } from '../services/urlScanner';

interface ScanResultsProps {
  result: ScanResult;
}

const ScanResults: React.FC<ScanResultsProps> = ({ result }) => {
  const urlScanner = URLScannerService.getInstance();
  const safetyInfo = urlScanner.getSafetyLevel(result.safety_score || 0);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-left">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Scan Results</h2>
        <div className="flex items-center space-x-2">
          {result.is_safe ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span className="font-semibold">Safe</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-1" />
              <span className="font-semibold">Potentially Dangerous</span>
            </div>
          )}
        </div>
      </div>

      {/* URL Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Globe className="h-4 w-4 mr-2" />
          Analyzed URL (Real-time Data)
        </div>
        <p className="font-mono text-sm break-all text-gray-900">{result.url}</p>
        <p className="text-xs text-gray-500 mt-1">
          Scanned on {new Date(result.created_at).toLocaleString()}
        </p>
      </div>

      {/* Safety Score */}
      <div className={`mb-6 p-4 border rounded-lg ${safetyInfo.color}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{safetyInfo.level}</h3>
            <p className="text-sm opacity-80">Safety Score: {result.safety_score}/100</p>
            <p className="text-xs opacity-70 mt-1">{safetyInfo.description}</p>
          </div>
          <div className="text-right">
            <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${(result.safety_score || 0) >= 80 ? 'bg-green-500' : (result.safety_score || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${result.safety_score || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* SSL Certificate */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Lock className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold">SSL Certificate</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${result.ssl_valid ? 'text-green-600' : 'text-red-600'}`}>
                {result.ssl_valid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Issuer:</span>
              <span className="font-medium">{result.ssl_issuer || 'Unknown'}</span>
            </div>
            {result.ssl_expires_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className="font-medium">{new Date(result.ssl_expires_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Domain Information */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-semibold">Domain Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Age:</span>
              <span className="font-medium">
                {result.domain_age_days ? `${Math.floor(result.domain_age_days / 365)} years` : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* IP Information */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Server className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-semibold">IP Address</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium font-mono">{result.ip_address || 'Unknown'}</span>
            </div>
            {result.ip_country && (
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span className="font-medium">{result.ip_country}</span>
              </div>
            )}
          </div>
        </div>

        {/* Threat Categories */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Database className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-semibold">Threat Analysis</h3>
          </div>
          <div className="space-y-2 text-sm">
            {result.threat_categories && result.threat_categories.length > 0 ? (
              <div>
                <span className="text-gray-600">Categories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.threat_categories.map((category, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>No threats detected</span>
              </div>
            )}
            {result.ml_confidence && (
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{Math.round(result.ml_confidence * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Data Notice */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center text-sm text-blue-700">
          <Shield className="h-4 w-4 mr-2" />
          <span className="font-medium">Real-time Security Analysis</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          This report contains live data from SSL Labs, VirusTotal, WHOIS databases, IP geolocation services, and threat intelligence feeds.
        </p>
      </div>
    </div>
  );
};

export default ScanResults;