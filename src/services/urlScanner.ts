import { supabase } from '../lib/supabase';

export interface ScanResult {
  id: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
  safety_score?: number;
  is_safe?: boolean;
  ssl_valid?: boolean;
  ssl_issuer?: string;
  ssl_expires_at?: string;
  domain_age_days?: number;
  ip_address?: string;
  ip_country?: string;
  threat_categories?: string[];
  ml_confidence?: number;
  created_at: string;
  updated_at: string;
}

class URLScannerService {
  private static instance: URLScannerService;

  static getInstance(): URLScannerService {
    if (!URLScannerService.instance) {
      URLScannerService.instance = new URLScannerService();
    }
    return URLScannerService.instance;
  }

  normalizeURL(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  getSafetyLevel(score: number): { level: string; color: string; description: string } {
    if (score >= 80) {
      return {
        level: 'Safe',
        color: 'bg-green-50 border-green-200 text-green-800',
        description: 'This URL appears to be safe based on our comprehensive security analysis.'
      };
    } else if (score >= 50) {
      return {
        level: 'Moderate Risk',
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        description: 'This URL shows some suspicious indicators. Exercise caution when proceeding.'
      };
    } else {
      return {
        level: 'High Risk',
        color: 'bg-red-50 border-red-200 text-red-800',
        description: 'This URL has multiple security concerns. We strongly advise against visiting this site.'
      };
    }
  }

  async scanUrl(url: string): Promise<ScanResult> {
    const normalizedUrl = this.normalizeUrl(url);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/url-scanner`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: normalizedUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate scan');
    }

    return response.json();
  }

  async getScanStatus(scanId: string): Promise<ScanResult> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-status?id=${scanId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Edge Function returned a non-2xx status code');
    }

    return response.json();
  }

  async getRecentScans(limit: number = 10): Promise<ScanResult[]> {
    const { data, error } = await supabase
      .from('url_scans')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error('Failed to fetch recent scans');
    }

    return data || [];
  }

  async getThreatStatistics(): Promise<{
    totalScans: number;
    threatsDetected: number;
    safeUrls: number;
    averageSafetyScore: number;
    highRiskScans: number;
  }> {
    const { data, error } = await supabase
      .from('url_scans')
      .select('safety_score, is_safe')
      .eq('status', 'completed');

    if (error) {
      throw new Error('Failed to fetch threat statistics');
    }

    const totalScans = data.length;
    const threatsDetected = data.filter(scan => scan.is_safe === false).length;
    const safeUrls = data.filter(scan => scan.is_safe === true).length;
    const highRiskScans = data.filter(scan => (scan.safety_score || 0) < 50).length;
    const averageSafetyScore = data.reduce((sum, scan) => sum + (scan.safety_score || 0), 0) / totalScans || 0;

    return {
      totalScans,
      threatsDetected,
      safeUrls,
      averageSafetyScore: Math.round(averageSafetyScore),
      highRiskScans
    };
  }
}

export { URLScannerService };
export const urlScannerService = URLScannerService.getInstance();