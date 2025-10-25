import React, { useState, useEffect } from 'react';
import { BarChart3, Shield, AlertTriangle, TrendingUp, Clock, Database } from 'lucide-react';
import { URLScannerService, ScanResult } from '../services/urlScanner';
import MLInsights from './MLInsights';
import BlockchainLogs from './BlockchainLogs';

const Dashboard: React.FC = () => {
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [statistics, setStatistics] = useState({
    totalScans: 0,
    safeUrls: 0,
    averageSafetyScore: 0,
    highRiskScans: 0
  });
  const [loading, setLoading] = useState(true);

  const urlScanner = URLScannerService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [scansData, statsData] = await Promise.all([
        urlScanner.getRecentScans(10),
        urlScanner.getThreatStatistics()
      ]);
      
      setRecentScans(scansData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Dashboard</h2>
          <p className="text-lg text-gray-600">Real-time threat intelligence and scan analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalScans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Safe URLs</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.safeUrls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3 mr-4">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Safety Score</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.averageSafetyScore}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3 mr-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.highRiskScans}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ML Insights and Blockchain Logs */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <MLInsights />
          <BlockchainLogs />
        </div>

        {/* Recent Scans */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safety Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No scans available yet. Start by scanning a URL above.
                    </td>
                  </tr>
                ) : (
                  recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {scan.url}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSafetyColor(scan.safety_score || 0)}`}>
                          {scan.safety_score || 0}/100
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {scan.is_safe ? (
                            <>
                              <Shield className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-600 font-medium">Safe</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-sm text-red-600 font-medium">Risky</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(scan.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;