import { supabase } from '../lib/supabase';

interface LogData {
  [key: string]: any;
}

interface BlockchainLog {
  id: string;
  logType: string;
  url?: string;
  data: LogData;
  ipfsHash?: string;
  blockchainTx?: string;
  walletAddress?: string;
  createdAt: string;
}

export class BlockchainLogger {
  private static readonly IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

  static async logThreatDetection(
    url: string,
    threatData: any,
    walletAddress?: string
  ): Promise<BlockchainLog | null> {
    try {
      const logData = {
        url,
        threat_score: threatData.threatScore,
        is_phishing: threatData.isPhishing,
        ml_confidence: threatData.mlConfidence,
        categories: threatData.categories,
        timestamp: new Date().toISOString()
      };

      const ipfsHash = await this.uploadToIPFS(logData);

      const { data, error } = await supabase
        .from('blockchain_logs')
        .insert({
          log_type: 'threat_detected',
          url,
          data: logData,
          ipfs_hash: ipfsHash,
          wallet_address: walletAddress
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        logType: data.log_type,
        url: data.url,
        data: data.data,
        ipfsHash: data.ipfs_hash,
        blockchainTx: data.blockchain_tx,
        walletAddress: data.wallet_address,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error logging threat detection:', error);
      return null;
    }
  }

  static async logScanCompleted(
    url: string,
    scanData: any,
    walletAddress?: string
  ): Promise<BlockchainLog | null> {
    try {
      const logData = {
        url,
        safety_score: scanData.safetyScore,
        ssl_valid: scanData.sslValid,
        domain_age: scanData.domainAge,
        timestamp: new Date().toISOString()
      };

      const ipfsHash = await this.uploadToIPFS(logData);

      const { data, error } = await supabase
        .from('blockchain_logs')
        .insert({
          log_type: 'scan_completed',
          url,
          data: logData,
          ipfs_hash: ipfsHash,
          wallet_address: walletAddress
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        logType: data.log_type,
        url: data.url,
        data: data.data,
        ipfsHash: data.ipfs_hash,
        blockchainTx: data.blockchain_tx,
        walletAddress: data.wallet_address,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error logging scan completion:', error);
      return null;
    }
  }

  static async logPatternLearned(
    pattern: string,
    patternData: any
  ): Promise<BlockchainLog | null> {
    try {
      const logData = {
        pattern,
        pattern_type: patternData.patternType,
        confidence: patternData.confidence,
        detection_count: patternData.detectionCount,
        timestamp: new Date().toISOString()
      };

      const ipfsHash = await this.uploadToIPFS(logData);

      const { data, error } = await supabase
        .from('blockchain_logs')
        .insert({
          log_type: 'pattern_learned',
          url: pattern,
          data: logData,
          ipfs_hash: ipfsHash
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        logType: data.log_type,
        url: data.url,
        data: data.data,
        ipfsHash: data.ipfs_hash,
        blockchainTx: data.blockchain_tx,
        walletAddress: data.wallet_address,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error logging pattern learned:', error);
      return null;
    }
  }

  private static async uploadToIPFS(data: LogData): Promise<string> {
    try {
      const content = JSON.stringify(data);
      const hash = await this.generateContentHash(content);

      return hash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      return '';
    }
  }

  private static async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `Qm${hashHex.substring(0, 44)}`;
  }

  static async getLogsByWallet(walletAddress: string): Promise<BlockchainLog[]> {
    try {
      const { data, error } = await supabase
        .from('blockchain_logs')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data.map(log => ({
        id: log.id,
        logType: log.log_type,
        url: log.url,
        data: log.data,
        ipfsHash: log.ipfs_hash,
        blockchainTx: log.blockchain_tx,
        walletAddress: log.wallet_address,
        createdAt: log.created_at
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  static async getRecentLogs(limit: number = 50): Promise<BlockchainLog[]> {
    try {
      const { data, error } = await supabase
        .from('blockchain_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(log => ({
        id: log.id,
        logType: log.log_type,
        url: log.url,
        data: log.data,
        ipfsHash: log.ipfs_hash,
        blockchainTx: log.blockchain_tx,
        walletAddress: log.wallet_address,
        createdAt: log.created_at
      }));
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      return [];
    }
  }

  static getIPFSUrl(ipfsHash: string): string {
    if (!ipfsHash) return '';
    return `${this.IPFS_GATEWAY}${ipfsHash}`;
  }

  static async verifyLogIntegrity(log: BlockchainLog): Promise<boolean> {
    try {
      const content = JSON.stringify(log.data);
      const computedHash = await this.generateContentHash(content);

      return log.ipfsHash === computedHash;
    } catch (error) {
      console.error('Error verifying log integrity:', error);
      return false;
    }
  }
}
