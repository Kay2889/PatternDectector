import { useState, useEffect } from 'react';
import { supabase, ScanWithPatterns } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../layout/Header';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Globe,
  Camera,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import { SEVERITY_COLORS } from '../../lib/darkPatternsData';

export function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanWithPatterns[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) fetchScans();
  }, [user]);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('scans')
        .select('*, dark_patterns(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setScans((data || []) as ScanWithPatterns[]);
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (scanId: string) => {
    await supabase.from('dark_patterns').delete().eq('scan_id', scanId);
    await supabase.from('scans').delete().eq('id', scanId);
    fetchScans();
  };

  const filteredScans = scans.filter(
    (scan) =>
      scan.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.scan_type.includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateRiskScore = (patterns: any[]) => {
    if (!patterns || patterns.length === 0) return 0;
    const highCount = patterns.filter((p) => p.severity === 'high').length;
    const medCount = patterns.filter((p) => p.severity === 'medium').length;
    return Math.min(100, highCount * 30 + medCount * 15 + patterns.length * 5);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Detection History" subtitle="View all your past scans and results" />

      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by URL or scan type..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : filteredScans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Date</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Website</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Risk Score</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Patterns</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Status</th>
                      <th className="text-right py-4 px-6 text-sm font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScans.map((scan) => {
                      const riskScore = calculateRiskScore(scan.dark_patterns);
                      return (
                        <tr key={scan.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              {formatDate(scan.created_at)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                scan.scan_type === 'website'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-purple-100 text-purple-600'
                              }`}>
                                {scan.scan_type === 'website' ? (
                                  <Globe className="w-4 h-4" />
                                ) : (
                                  <Camera className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {scan.url || 'Screenshot Scan'}
                                </p>
                                <p className="text-sm text-slate-500 capitalize">{scan.scan_type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className={`w-12 h-2 rounded-full ${
                                riskScore >= 70 ? 'bg-red-500' : riskScore >= 40 ? 'bg-orange-500' : 'bg-emerald-500'
                              }`} />
                              <span className={`font-semibold ${
                                riskScore >= 70 ? 'text-red-600' : riskScore >= 40 ? 'text-orange-600' : 'text-emerald-600'
                              }`}>
                                {riskScore}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                              <AlertTriangle className="w-4 h-4" />
                              {scan.dark_patterns?.length || 0}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              scan.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {scan.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/app/results/${scan.id}`)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-emerald-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-blue-600"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteScan(scan.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No scans found</p>
                <p className="text-slate-500 text-sm mt-1">Start by scanning a website or uploading a screenshot</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
