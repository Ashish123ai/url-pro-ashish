    import React, { useEffect, useState } from 'react';
import { Link, Shield, Clock, ExternalLink } from 'lucide-react';
import { BlockchainLogger } from '../services/blockchainLogger';
import { Web3AuthService } from '../services/web3Auth';

interface Log {
  id: string;
  logType: string;
  url?: string;
  data: any;
  ipfsHash?: string;
  createdAt: string;
}

const BlockchainLogs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user'>('all');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let logsData: Log[];

      if (filter === 'user') {
        const user = Web3AuthService.getCurrentUser();
        if (user) {
          logsData = await BlockchainLogger.getLogsByWallet(user.walletAddress);
        } else {
          logsData = [];
        }
      } else {
        logsData = await BlockchainLogger.getRecentLogs(20);
      }

      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'threat_detected':
        return 'bg-red-100 text-red-700';
      case 'scan_completed':
        return 'bg-green-100 text-green-700';
      case 'pattern_learned':
        return 'bg-purple-100 text-purple-700';
      case 'auth_event':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatLogType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const currentUser = Web3AuthService.getCurrentUser();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-bold text-gray-900">Blockchain Threat Logs</h3>
        </div>
        {currentUser && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilter('user')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Logs
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No blockchain logs yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getLogTypeColor(log.logType)}`}>
                      {formatLogType(log.logType)}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(log.createdAt)}
                    </div>
                  </div>

                  {log.url && (
                    <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {log.url}
                    </p>
                  )}

                  {log.ipfsHash && (
                    <a
                      href={BlockchainLogger.getIPFSUrl(log.ipfsHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on IPFS: {log.ipfsHash.substring(0, 12)}...
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <p className="text-xs text-green-700">
          All threat detections are logged to an immutable blockchain ledger for transparency and auditability.
        </p>
      </div>
    </div>
  );
};

export default BlockchainLogs;   
