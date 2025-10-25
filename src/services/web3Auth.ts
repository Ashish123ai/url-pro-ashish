import { supabase } from '../lib/supabase';

interface Web3User {
  id: string;
  walletAddress: string;
  chainId: number;
  lastLogin: string;
}

interface MetaMaskProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}

export class Web3AuthService {
  private static provider: MetaMaskProvider | null = null;

  static isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  static getProvider(): MetaMaskProvider | null {
    if (typeof window === 'undefined') return null;
    this.provider = window.ethereum || null;
    return this.provider;
  }

  static async connectWallet(): Promise<Web3User | null> {
    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('MetaMask not installed');
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0].toLowerCase();

      const chainIdHex = await provider.request({
        method: 'eth_chainId'
      });
      const chainId = parseInt(chainIdHex, 16);

      const nonce = this.generateNonce();

      const { data: existingUser } = await supabase
        .from('web3_users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      let user: Web3User;

      if (existingUser) {
        const { data: updatedUser } = await supabase
          .from('web3_users')
          .update({
            last_login: new Date().toISOString(),
            chain_id: chainId,
            nonce
          })
          .eq('wallet_address', walletAddress)
          .select()
          .single();

        user = {
          id: updatedUser.id,
          walletAddress: updatedUser.wallet_address,
          chainId: updatedUser.chain_id,
          lastLogin: updatedUser.last_login
        };
      } else {
        const { data: newUser } = await supabase
          .from('web3_users')
          .insert({
            wallet_address: walletAddress,
            chain_id: chainId,
            nonce
          })
          .select()
          .single();

        user = {
          id: newUser.id,
          walletAddress: newUser.wallet_address,
          chainId: newUser.chain_id,
          lastLogin: newUser.last_login
        };
      }

      await supabase
        .from('blockchain_logs')
        .insert({
          log_type: 'auth_event',
          wallet_address: walletAddress,
          data: {
            event: 'wallet_connected',
            chain_id: chainId,
            timestamp: new Date().toISOString()
          }
        });

      localStorage.setItem('web3_user', JSON.stringify(user));

      this.setupAccountChangeListener();
      this.setupChainChangeListener();

      return user;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }

  static async disconnectWallet(): Promise<void> {
    try {
      const user = this.getCurrentUser();

      if (user) {
        await supabase
          .from('blockchain_logs')
          .insert({
            log_type: 'auth_event',
            wallet_address: user.walletAddress,
            data: {
              event: 'wallet_disconnected',
              timestamp: new Date().toISOString()
            }
          });
      }

      localStorage.removeItem('web3_user');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  static getCurrentUser(): Web3User | null {
    if (typeof window === 'undefined') return null;

    try {
      const userJson = localStorage.getItem('web3_user');
      if (!userJson) return null;

      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  static async signMessage(message: string): Promise<string> {
    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('MetaMask not installed');
      }

      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No wallet connected');
      }

      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, user.walletAddress]
      });

      return signature;
    } catch (error: any) {
      console.error('Error signing message:', error);
      throw new Error(error.message || 'Failed to sign message');
    }
  }

  private static generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private static setupAccountChangeListener(): void {
    const provider = this.getProvider();
    if (!provider) return;

    provider.on('accountsChanged', async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        await this.disconnectWallet();
        window.location.reload();
      } else {
        await this.disconnectWallet();
        window.location.reload();
      }
    });
  }

  private static setupChainChangeListener(): void {
    const provider = this.getProvider();
    if (!provider) return;

    provider.on('chainChanged', (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const user = this.getCurrentUser();

      if (user) {
        const updatedUser = { ...user, chainId };
        localStorage.setItem('web3_user', JSON.stringify(updatedUser));
      }

      window.location.reload();
    });
  }

  static getChainName(chainId: number): string {
    const chains: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet'
    };

    return chains[chainId] || `Chain ID: ${chainId}`;
  }

  static formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}
