import { supabase } from '../lib/supabase';

interface MLFeatures {
  urlLength: number;
  numDots: number;
  numHyphens: number;
  numDigits: number;
  numSpecialChars: number;
  hasIpAddress: boolean;
  hasSuspiciousKeywords: boolean;
  entropyScore: number;
  subdomainCount: number;
  pathDepth: number;
}

interface MLPrediction {
  isPhishing: boolean;
  confidence: number;
  threatProbability: number;
  predictedCategories: string[];
  model: string;
}

const SUSPICIOUS_KEYWORDS = [
  'login', 'verify', 'account', 'update', 'secure', 'banking',
  'password', 'confirm', 'suspended', 'locked', 'urgent',
  'click', 'winner', 'prize', 'free', 'security'
];

export class MLURLClassifier {
  private static calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies: { [key: string]: number } = {};

    for (let i = 0; i < len; i++) {
      const char = str[i];
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
      const p = frequencies[char] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  private static extractFeatures(url: string): MLFeatures {
    const urlLower = url.toLowerCase();

    const numDots = (url.match(/\./g) || []).length;
    const numHyphens = (url.match(/-/g) || []).length;
    const numDigits = (url.match(/\d/g) || []).length;
    const numSpecialChars = (url.match(/[^a-zA-Z0-9.-]/g) || []).length;

    const hasIpAddress = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url);
    const hasSuspiciousKeywords = SUSPICIOUS_KEYWORDS.some(keyword =>
      urlLower.includes(keyword)
    );

    const entropyScore = this.calculateEntropy(url);

    let hostname = '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      hostname = urlObj.hostname;
    } catch {
      hostname = url.split('/')[0];
    }

    const subdomainCount = hostname.split('.').length - 2;
    const pathDepth = (url.split('/').length - 3);

    return {
      urlLength: url.length,
      numDots,
      numHyphens,
      numDigits,
      numSpecialChars,
      hasIpAddress,
      hasSuspiciousKeywords,
      entropyScore,
      subdomainCount: Math.max(0, subdomainCount),
      pathDepth: Math.max(0, pathDepth)
    };
  }

  private static calculateThreatScore(features: MLFeatures): number {
    let score = 0;

    if (features.urlLength > 75) score += 15;
    if (features.urlLength > 100) score += 10;

    if (features.numHyphens > 2) score += 10;
    if (features.numDigits > 8) score += 10;
    if (features.numSpecialChars > 5) score += 15;

    if (features.hasIpAddress) score += 25;
    if (features.hasSuspiciousKeywords) score += 20;

    if (features.entropyScore > 4.5) score += 15;
    if (features.subdomainCount > 3) score += 15;
    if (features.pathDepth > 5) score += 10;

    return Math.min(100, score);
  }

  static async classifyURL(url: string): Promise<MLPrediction> {
    const features = this.extractFeatures(url);

    const threatScore = this.calculateThreatScore(features);
    const threatProbability = threatScore / 100;

    const predictedCategories: string[] = [];
    if (features.hasIpAddress) predictedCategories.push('IP-based URL');
    if (features.hasSuspiciousKeywords) predictedCategories.push('Suspicious keywords');
    if (features.urlLength > 100) predictedCategories.push('Abnormally long URL');
    if (features.subdomainCount > 3) predictedCategories.push('Excessive subdomains');
    if (features.entropyScore > 4.5) predictedCategories.push('High entropy');

    const historicalPatterns = await this.checkHistoricalPatterns(url);

    let adjustedProbability = threatProbability;
    let confidence = 0.75;

    if (historicalPatterns) {
      adjustedProbability = (threatProbability + historicalPatterns.confidence_score) / 2;
      confidence = Math.min(0.95, confidence + 0.15);

      if (historicalPatterns.pattern_type === 'phishing') {
        predictedCategories.push('Known phishing pattern');
      }
    }

    await this.updateMLPatterns(url, features, adjustedProbability);

    return {
      isPhishing: adjustedProbability > 0.5,
      confidence,
      threatProbability: adjustedProbability,
      predictedCategories,
      model: 'ensemble'
    };
  }

  private static async checkHistoricalPatterns(url: string): Promise<any> {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

      const { data } = await supabase
        .from('ml_patterns')
        .select('*')
        .ilike('url_pattern', `%${domain}%`)
        .order('confidence_score', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data;
    } catch {
      return null;
    }
  }

  private static async updateMLPatterns(
    url: string,
    features: MLFeatures,
    threatProbability: number
  ): Promise<void> {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

      const patternType = threatProbability > 0.7 ? 'phishing' :
                         threatProbability > 0.4 ? 'suspicious' : 'legitimate';

      const { data: existing } = await supabase
        .from('ml_patterns')
        .select('*')
        .eq('url_pattern', domain)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ml_patterns')
          .update({
            detection_count: existing.detection_count + 1,
            last_detected: new Date().toISOString(),
            confidence_score: (existing.confidence_score + threatProbability) / 2,
            features: features
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ml_patterns')
          .insert({
            url_pattern: domain,
            pattern_type: patternType,
            confidence_score: threatProbability,
            detection_count: 1,
            features: features
          });
      }

      await supabase
        .from('blockchain_logs')
        .insert({
          log_type: 'pattern_learned',
          url: domain,
          data: {
            pattern_type: patternType,
            threat_probability: threatProbability,
            features
          }
        });
    } catch (error) {
      console.error('Error updating ML patterns:', error);
    }
  }

  static async saveThreatPrediction(
    urlId: string,
    prediction: MLPrediction
  ): Promise<void> {
    try {
      await supabase
        .from('threat_predictions')
        .insert({
          url_id: urlId,
          prediction_model: prediction.model,
          threat_probability: prediction.threatProbability,
          predicted_categories: prediction.predictedCategories,
          feature_importance: {
            confidence: prediction.confidence,
            is_phishing: prediction.isPhishing
          }
        });
    } catch (error) {
      console.error('Error saving threat prediction:', error);
    }
  }
}
