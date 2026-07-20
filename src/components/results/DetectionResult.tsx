import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, DarkPattern } from '../../lib/supabase';
import { Header } from '../layout/Header';
import {
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  Target,
  BarChart3,
} from 'lucide-react';
import { DARK_PATTERN_TYPES, SEVERITY_COLORS } from '../../lib/darkPatternsData';

export function DetectionResult() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<DarkPattern[]>([]);
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  useEffect(() => {
    if (scanId) fetchResults();
  }, [scanId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data: scanData } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .maybeSingle();

      const { data: patternsData } = await supabase
        .from('dark_patterns')
        .select('*')
        .eq('scan_id', scanId);

      setScan(scanData);
      setPatterns(patternsData || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskScore = () => {
    if (patterns.length === 0) return 0;
    const highCount = patterns.filter((p) => p.severity === 'high').length;
    const medCount = patterns.filter((p) => p.severity === 'medium').length;
    return Math.min(100, highCount * 30 + medCount * 15 + patterns.length * 5);
  };

  const riskScore = calculateRiskScore();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Detection Results" subtitle="Analysis report and recommendations" />

      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </button>

          {/* Summary Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    patterns.length > 0
                      ? 'bg-gradient-to-br from-red-500 to-orange-500'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  }`}
                >
                  {patterns.length > 0 ? (
                    <AlertTriangle className="w-8 h-8 text-white" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {patterns.length > 0
                      ? `${patterns.length} Dark Pattern${patterns.length > 1 ? 's' : ''} Detected`
                      : 'No Dark Patterns Detected'}
                  </h1>
                  <p className="text-slate-600">
                    {scan?.url || 'Screenshot scan'} • {new Date(scan?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Risk Score */}
                <div className="text-center">
                  <div
                    className={`text-5xl font-bold ${
                      riskScore >= 70
                        ? 'text-red-600'
                        : riskScore >= 40
                        ? 'text-orange-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {riskScore}%
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Risk Score</p>
                </div>

                {/* Risk Level Badge */}
                <div
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    riskScore >= 70
                      ? 'bg-red-100 text-red-700'
                      : riskScore >= 40
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low'} Risk
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">Patterns Detected</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{patterns.length}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-sm text-slate-600">High Severity</p>
              </div>
              <p className="text-3xl font-bold text-red-600">
                {patterns.filter((p) => p.severity === 'high').length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600">Avg Confidence</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {patterns.length > 0
                  ? Math.round(patterns.reduce((a, p) => a + p.confidence, 0) / patterns.length)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Detected Patterns Table */}
          {patterns.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Detected Patterns</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Pattern Type</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Confidence</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Severity</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map((pattern) => (
                      <tr key={pattern.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                SEVERITY_COLORS[pattern.severity].bg
                              }`}
                            />
                            <span className="font-medium text-slate-900 capitalize">
                              {pattern.pattern_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pattern.confidence >= 80
                                    ? 'bg-emerald-500'
                                    : pattern.confidence >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${pattern.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{pattern.confidence}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              SEVERITY_COLORS[pattern.severity].light
                            } ${SEVERITY_COLORS[pattern.severity].text}`}
                          >
                            {pattern.severity}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600 max-w-xs">
                          {pattern.recommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Pattern Cards */}
          {patterns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Detailed Analysis</h2>
              {patterns.map((pattern) => (
                <div key={pattern.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedPattern(expandedPattern === pattern.id ? null : pattern.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          SEVERITY_COLORS[pattern.severity].bg
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-slate-900 capitalize">
                          {pattern.pattern_type.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-sm text-slate-500">{pattern.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{pattern.confidence}% confidence</span>
                      {expandedPattern === pattern.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {expandedPattern === pattern.id && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                      {pattern.element_text && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">Detected Text</p>
                          <p className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-sm">
                            "{pattern.element_text}"
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Explanation</p>
                        <p className="text-slate-700">{pattern.description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Recommendation</p>
                        <p className="bg-emerald-50 p-3 rounded-lg text-emerald-700">
                          {pattern.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download PDF Report
            </button>
            <button className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Results
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
