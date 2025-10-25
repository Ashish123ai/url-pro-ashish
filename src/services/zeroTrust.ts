import { supabase } from '../lib/supabase';

interface ValidationResult {
  requestId: string;
  validationType: string;
  isValid: boolean;
  metadata: any;
}

export class ZeroTrustValidator {
  private static generateRequestId(): string {
    return crypto.randomUUID();
  }

  static async validateRequest(
    requestData: any,
    validationType: string
  ): Promise<ValidationResult> {
    const requestId = this.generateRequestId();

    const validations = await Promise.all([
      this.validateOrigin(requestData),
      this.validateRateLimit(requestData),
      this.validatePayload(requestData),
      this.validateTimestamp(requestData)
    ]);

    const isValid = validations.every(v => v === true);

    const metadata = {
      origin_valid: validations[0],
      rate_limit_valid: validations[1],
      payload_valid: validations[2],
      timestamp_valid: validations[3],
      user_agent: requestData.userAgent || 'unknown',
      ip_address: requestData.ipAddress || 'unknown'
    };

    await this.logValidation(requestId, validationType, isValid, metadata);

    return {
      requestId,
      validationType,
      isValid,
      metadata
    };
  }

  private static async validateOrigin(requestData: any): Promise<boolean> {
    const origin = requestData.origin || '';

    if (!origin) return false;

    const allowedOrigins = [
      window.location.origin,
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    return allowedOrigins.some(allowed => origin.startsWith(allowed));
  }

  private static async validateRateLimit(requestData: any): Promise<boolean> {
    try {
      const identifier = requestData.walletAddress || requestData.ipAddress || 'anonymous';

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('zero_trust_validations')
        .select('id')
        .eq('metadata->>identifier', identifier)
        .gte('created_at', fiveMinutesAgo);

      if (error) return true;

      const requestCount = data?.length || 0;

      const maxRequestsPer5Min = 100;
      return requestCount < maxRequestsPer5Min;
    } catch {
      return true;
    }
  }

  private static async validatePayload(requestData: any): Promise<boolean> {
    try {
      if (!requestData.payload) return true;

      const payloadStr = JSON.stringify(requestData.payload);

      if (payloadStr.length > 100000) {
        return false;
      }

      const suspiciousPatterns = [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /eval\(/gi,
        /document\.cookie/gi
      ];

      return !suspiciousPatterns.some(pattern => pattern.test(payloadStr));
    } catch {
      return false;
    }
  }

  private static async validateTimestamp(requestData: any): Promise<boolean> {
    if (!requestData.timestamp) return true;

    try {
      const requestTime = new Date(requestData.timestamp).getTime();
      const currentTime = Date.now();

      const timeDiff = Math.abs(currentTime - requestTime);

      const maxTimeDiff = 5 * 60 * 1000;

      return timeDiff <= maxTimeDiff;
    } catch {
      return false;
    }
  }

  private static async logValidation(
    requestId: string,
    validationType: string,
    isValid: boolean,
    metadata: any
  ): Promise<void> {
    try {
      await supabase
        .from('zero_trust_validations')
        .insert({
          request_id: requestId,
          validation_type: validationType,
          validation_result: isValid,
          metadata
        });
    } catch (error) {
      console.error('Error logging validation:', error);
    }
  }

  static async validateScanRequest(url: string, walletAddress?: string): Promise<ValidationResult> {
    const requestData = {
      payload: { url },
      walletAddress,
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side'
    };

    return this.validateRequest(requestData, 'scan_request');
  }

  static async validateAuthRequest(walletAddress: string): Promise<ValidationResult> {
    const requestData = {
      payload: { walletAddress },
      walletAddress,
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side'
    };

    return this.validateRequest(requestData, 'auth_request');
  }

  static async getValidationStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    try {
      const timeMap = {
        hour: 1,
        day: 24,
        week: 24 * 7
      };

      const hoursAgo = timeMap[timeRange];
      const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('zero_trust_validations')
        .select('validation_result, validation_type')
        .gte('created_at', startTime);

      if (error) throw error;

      const stats = {
        total: data.length,
        passed: data.filter(v => v.validation_result).length,
        failed: data.filter(v => !v.validation_result).length,
        byType: {} as { [key: string]: { total: number; passed: number; failed: number } }
      };

      data.forEach(validation => {
        const type = validation.validation_type;
        if (!stats.byType[type]) {
          stats.byType[type] = { total: 0, passed: 0, failed: 0 };
        }
        stats.byType[type].total++;
        if (validation.validation_result) {
          stats.byType[type].passed++;
        } else {
          stats.byType[type].failed++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching validation stats:', error);
      return null;
    }
  }
}
