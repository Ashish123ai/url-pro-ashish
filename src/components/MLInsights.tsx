import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, Database, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MLPattern {
  id: string;
  url_pattern: string;
  pattern_type: string;
  confidence_score: number;
  detection_count: number;
  last_detected: string;
}

const MLInsights: React.FC = () => {
  const [patterns, setPatterns] = useState<MLPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatterns: 0,
    phishingPatterns: 0,
    legitimatePatterns: 0,
    avgConfidence: 0
  });

  useEffect(() => {
    loadMLPatterns();
  }, []);

  const loadMLPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('ml_patterns')
        .select('*')
        .order('detection_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setPatterns(data);

        const phishing = data.filter(p => p.pattern_type === 'phishing').length;
        const legitimate = data.filter(p => p.pattern_type === 'legitimate').length;
        const avgConf = data.reduce((sum, p) => sum + p.confidence_score, 0) / data.length;

        setStats({
          totalPatterns: data.length,
          phishingPatterns: phishing,
          legitimatePatterns: legitimate,
          avgConfidence: avgConf
        });
      }
    } catch (error) {
      console.error('Error loading ML patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'phishing':
        return 'bg-red-100 text-red-700';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-700';
      case 'legitimate':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Brain className="h-6 w-6 text-purple-600 mr-2" />
        <h3 className="text-xl font-bold text-gray-900">AI/ML Pattern Recognition</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Database className="h-4 w-4 text-blue-600 mr-1" />
            <span className="text-sm text-gray-600">Total Patterns</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPatterns}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
            <span className="text-sm text-gray-600">Phishing</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.phishingPatterns}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-sm text-gray-600">Legitimate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.legitimatePatterns}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Brain className="h-4 w-4 text-purple-600 mr-1" />
            <span className="text-sm text-gray-600">Avg Confidence</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(stats.avgConfidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-700 text-sm">Top Detected Patterns</h4>
        {patterns.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No patterns detected yet</p>
        ) : (
          patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm truncate">{pattern.url_pattern}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${getPatternColor(pattern.pattern_type)}`}>
                    {pattern.pattern_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    Detected {pattern.detection_count}x
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {(pattern.confidence_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">confidence</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          The AI model continuously learns from new URL patterns to improve threat detection accuracy.
        </p>
      </div>
    </div>
  );
};

export default MLInsights;
