import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, Shield, AlertCircle } from 'lucide-react';
import { Web3AuthService } from '../services/web3Auth';

interface Web3AuthButtonProps {
  onAuthChange?: (isAuthenticated: boolean, walletAddress?: string) => void;
}

const Web3AuthButton: React.FC<Web3AuthButtonProps> = ({ onAuthChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const user = Web3AuthService.getCurrentUser();
    if (user) {
      setIsConnected(true);
      setWalletAddress(user.walletAddress);
      setChainId(user.chainId);
      onAuthChange?.(true, user.walletAddress);
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      if (!Web3AuthService.isMetaMaskInstalled()) {
        setError('MetaMask is not installed. Please install MetaMask extension.');
        window.open('https://metamask.io/download/', '_blank');
        setIsConnecting(false);
        return;
      }

      const user = await Web3AuthService.connectWallet();

      if (user) {
        setIsConnected(true);
        setWalletAddress(user.walletAddress);
        setChainId(user.chainId);
        onAuthChange?.(true, user.walletAddress);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await Web3AuthService.disconnectWallet();
    setIsConnected(false);
    setWalletAddress('');
    setChainId(1);
    onAuthChange?.(false);
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">{Web3AuthService.getChainName(chainId)}</span>
            <span className="text-sm font-mono">{Web3AuthService.formatAddress(walletAddress)}</span>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default Web3AuthButton;
