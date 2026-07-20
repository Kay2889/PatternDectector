import { useState, useEffect } from 'react';
import { supabase, ScanWithPatterns, DarkPattern } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
  BarChart3,
  Eye,
  Camera,
  ArrowRight,
} from 'lucide-react';
import { Header } from '../layout/Header';
import { DARK_PATTERN_TYPES, SEVERITY_COLORS } from '../../lib/darkPatternsData';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalScreenshots: number;
  totalScans: number;
  totalPatterns: number;
  avgRiskScore: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalScreenshots: 0,
    totalScans: 0,
    totalPatterns: 0,
    avgRiskScore: 0,
  });
  const [recentScans, setRecentScans] = useState<ScanWithPatterns[]>([]);
  const [patternBreakdown, setPatternBreakdown] = useState<{ type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch recent scans with patterns
      const { data: scansData } = await supabase
        .from('scans')
        .select('*, dark_patterns(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch all patterns for breakdown
      const { data: patternsData } = await supabase
        .from('dark_patterns')
        .select('pattern_type, severity, confidence')
        .eq('user_id', user!.id);

      // Calculate stats
      const screenshots = scansData?.filter((s) => s.scan_type === 'screenshot').length || 0;
      const totalScans = scansData?.length || 0;
      const totalPatterns = patternsData?.length || 0;

      // Calculate average risk score
      let avgRisk = 0;
      if (patternsData && patternsData.length > 0) {
        const totalRisk = patternsData.reduce((acc, p) => {
          const weight = p.severity === 'high' ? 30 : p.severity === 'medium' ? 15 : 5;
          return acc + weight;
        }, 0);
        avgRisk = Math.min(100, Math.round(totalRisk / patternsData.length));
      }

      setStats({
        totalScreenshots: screenshots,
        totalScans,
        totalPatterns,
        avgRiskScore: avgRisk,
      });

      // Calculate pattern breakdown
      const patternCounts: Record<string, number> = {};
      patternsData?.forEach((p) => {
        patternCounts[p.pattern_type] = (patternCounts[p.pattern_type] || 0) + 1;
      });

      const breakdown = Object.entries(patternCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setPatternBreakdown(breakdown);
      setRecentScans((scansData || []) as ScanWithPatterns[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    color,
  }: {
    icon: typeof Globe;
    label: string;
    value: number | string;
    change?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-4xl font-bold text-slate-900">{value}</p>
          {change && (
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Dashboard" subtitle="Monitor your dark pattern detection activity" />

      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Camera}
                label="Total Screenshots"
                value={stats.totalScreenshots}
                color="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              <StatCard
                icon={Globe}
                label="Total Scans"
                value={stats.totalScans}
                color="bg-gradient-to-br from-blue-500 to-indigo-600"
              />
              <StatCard
                icon={AlertTriangle}
                label="Patterns Detected"
                value={stats.totalPatterns}
                color="bg-gradient-to-br from-red-500 to-orange-500"
              />
              <StatCard
                icon={Shield}
                label="Avg Risk Score"
                value={`${stats.avgRiskScore}%`}
                color="bg-gradient-to-br from-amber-500 to-orange-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/app/upload')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-left hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-between shadow-lg shadow-emerald-500/25"
              >
                <div>
                  <h3 className="text-xl font-bold mb-1">Upload Screenshot</h3>
                  <p className="text-emerald-100">Analyze an image for dark patterns</p>
                </div>
                <Camera className="w-10 h-10 opacity-50" />
              </button>
              <button
                onClick={() => navigate('/app/website')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-left hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-between shadow-lg shadow-blue-500/25"
              >
                <div>
                  <h3 className="text-xl font-bold mb-1">Scan Website</h3>
                  <p className="text-blue-100">Enter a URL to analyze a webpage</p>
                </div>
                <Globe className="w-10 h-10 opacity-50" />
              </button>
            </div>

            {/* Charts and Lists */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Pattern Breakdown */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Pattern Breakdown</h2>
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                </div>

                {patternBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {patternBreakdown.map((item) => {
                      const patternInfo = DARK_PATTERN_TYPES.find((p) => p.id === item.type);
                      const percentage = stats.totalPatterns > 0
                        ? (item.count / stats.totalPatterns) * 100
                        : 0;
                      return (
                        <div key={item.type}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-700">
                              {patternInfo?.name || item.type}
                            </p>
                            <p className="text-sm text-slate-500">{item.count}</p>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No patterns detected yet</p>
                  </div>
                )}
              </div>

              {/* Recent Scans */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Scans</h2>
                  <button
                    onClick={() => navigate('/app/history')}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {recentScans.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentScans.slice(0, 5).map((scan) => (
                      <div
                        key={scan.id}
                        onClick={() => navigate(`/app/results/${scan.id}`)}
                        className="py-4 flex items-center justify-between first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              scan.scan_type === 'website'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-purple-100 text-purple-600'
                            }`}
                          >
                            {scan.scan_type === 'website' ? (
                              <Globe className="w-5 h-5" />
                            ) : (
                              <Camera className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {scan.url || 'Screenshot scan'}
                            </p>
                            <p className="text-sm text-slate-500">{formatDate(scan.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-slate-900">
                              {scan.dark_patterns?.length || 0} patterns
                            </p>
                            <p className="text-sm text-slate-500 capitalize">{scan.scan_type}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No scans yet. Start by scanning a website!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detection History */}
            {recentScans.filter((s) => s.dark_patterns && s.dark_patterns.length > 0).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Detections</h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Pattern Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Source</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Severity</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Confidence</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentScans.flatMap((scan) =>
                        (scan.dark_patterns || []).slice(0, 3).map((pattern: DarkPattern) => (
                          <tr key={pattern.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[pattern.severity].bg}`} />
                                <span className="font-medium text-slate-900 capitalize">
                                  {pattern.pattern_type.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-sm">{scan.url || 'Screenshot'}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  SEVERITY_COLORS[pattern.severity].light
                                } ${SEVERITY_COLORS[pattern.severity].text}`}
                              >
                                {pattern.severity}
                              </span>
                            </td>
                            <td className="py-3 px-4">
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
                                <span className="text-sm text-slate-600">{pattern.confidence}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-500">{formatDate(pattern.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
