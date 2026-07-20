import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, ContactMessage, ScanWithPatterns, Profile } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Scan,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Mail,
  Eye,
  EyeOff,
  Activity,
  Clock,
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Download,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'scans' | 'export'>('overview');
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allScans, setAllScans] = useState<ScanWithPatterns[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [scans, setScans] = useState<ScanWithPatterns[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    todayScans: 0,
    patternsFound: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchMessages(), fetchScans()]);
    setLoading(false);
  };

  const fetchExportData = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const [profilesResult, scansResult] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('scans').select('*, dark_patterns(*)').order('created_at', { ascending: false }),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (scansResult.error) throw scansResult.error;
      setAllProfiles((profilesResult.data || []) as Profile[]);
      setAllScans((scansResult.data || []) as ScanWithPatterns[]);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to load export data');
    } finally {
      setExportLoading(false);
    }
  };

  const buildUserExportRows = () => {
    const scansByUser = new Map<string, ScanWithPatterns[]>();
    for (const s of allScans) {
      const arr = scansByUser.get(s.user_id) || [];
      arr.push(s);
      scansByUser.set(s.user_id, arr);
    }
    return allProfiles.map((p) => {
      const userScans = scansByUser.get(p.id) || [];
      const totalPatterns = userScans.reduce((sum, s) => sum + (s.dark_patterns?.length || 0), 0);
      const lastScanAt = userScans.length > 0 ? userScans[0].created_at : null;
      return {
        id: p.id,
        full_name: p.full_name ?? '',
        phone: p.phone ?? '',
        role: p.role,
        total_scans: userScans.length,
        total_patterns_detected: totalPatterns,
        last_scan_at: lastScanAt ? formatDate(lastScanAt) : '',
        created_at: formatDate(p.created_at),
      };
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = buildUserExportRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (val: string) => {
      const s = String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => escape(String((r as Record<string, unknown>)[h] ?? ''))).join(',')),
    ].join('\n');
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `darkscan-users-${date}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportJSON = () => {
    const rows = buildUserExportRows();
    if (rows.length === 0) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(JSON.stringify(rows, null, 2), `darkscan-users-${date}.json`, 'application/json');
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayScanCount } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: patternCount } = await supabase
        .from('dark_patterns')
        .select('*', { count: 'exact', head: true });

      const { count: unreadCount } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      setStats({
        users: userCount || 0,
        todayScans: todayScanCount || 0,
        patternsFound: patternCount || 0,
        unreadMessages: unreadCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setMessages((data || []) as ContactMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchScans = async () => {
    try {
      const { data } = await supabase
        .from('scans')
        .select('*, dark_patterns(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      setScans((data || []) as ScanWithPatterns[]);
    } catch (error) {
      console.error('Error fetching scans:', error);
    }
  };

  const markMessageRead = async (id: string, isRead: boolean) => {
    await supabase
      .from('contact_messages')
      .update({ is_read: !isRead })
      .eq('id', id);
    fetchMessages();
    fetchStats();
  };

  const deleteMessage = async (id: string) => {
    if (confirm('Delete this message?')) {
      await supabase.from('contact_messages').delete().eq('id', id);
      fetchMessages();
      fetchStats();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-500">DarkScan AI</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'User Activity', icon: Users },
            { id: 'messages', label: 'Messages', icon: Mail },
            { id: 'scans', label: 'All Scans', icon: Scan },
            { id: 'export', label: 'Data Export', icon: Download },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === 'messages' && stats.unreadMessages > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.unreadMessages}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 p-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              navigate('/admin-login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-white">{stats.users}</p>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Scan className="w-6 h-6 text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-1">Today's Scans</p>
                      <p className="text-3xl font-bold text-white">{stats.todayScans}</p>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-1">Patterns Found</p>
                      <p className="text-3xl font-bold text-white">{stats.patternsFound}</p>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Mail className="w-6 h-6 text-purple-400" />
                        </div>
                        {stats.unreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {stats.unreadMessages} new
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-1">Messages</p>
                      <p className="text-3xl font-bold text-white">{messages.length}</p>
                    </div>
                  </div>

                  {/* Recent Messages */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Recent Messages</h3>
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="text-emerald-400 text-sm hover:text-emerald-300"
                      >
                        View all
                      </button>
                    </div>
                    {messages.slice(0, 3).map((msg) => (
                      <div key={msg.id} className="flex items-center gap-4 p-3 hover:bg-slate-700 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${msg.is_read ? 'bg-slate-600' : 'bg-emerald-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{msg.name}</p>
                          <p className="text-sm text-slate-400 truncate">{msg.email}</p>
                        </div>
                        <p className="text-xs text-slate-500">{formatDate(msg.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">User Activity</h2>

                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/50">
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">User ID</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Activity</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Type</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Patterns</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scans.map((scan) => (
                          <tr key={scan.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="py-4 px-6 text-slate-300 font-mono text-sm">
                              {scan.user_id.substring(0, 8)}...
                            </td>
                            <td className="py-4 px-6 text-white">
                              {scan.url || 'Screenshot scan'}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                scan.scan_type === 'website'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}>
                                {scan.scan_type}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-300">
                              {scan.dark_patterns?.length || 0}
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-sm">
                              {formatDate(scan.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Contact Messages</h2>
                  <p className="text-slate-400">Messages sent to contact@darkscan.ai</p>

                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`bg-slate-800 rounded-xl border ${
                          msg.is_read ? 'border-slate-700' : 'border-emerald-500/30'
                        } p-6`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Mail className="w-5 h-5 text-slate-400" />
                              <span className="font-semibold text-white">{msg.name}</span>
                              <span className="text-slate-400">&lt;{msg.email}&gt;</span>
                              {!msg.is_read && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 mt-3">{msg.message}</p>
                            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(msg.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => markMessageRead(msg.id, msg.is_read)}
                              className={`p-2 rounded-lg transition-colors ${
                                msg.is_read
                                  ? 'bg-slate-700 text-slate-400 hover:text-white'
                                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              }`}
                              title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                            >
                              {msg.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {messages.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scans Tab */}
              {activeTab === 'scans' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">All Scans</h2>

                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/50">
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Scanned URL</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Type</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Status</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Patterns</th>
                          <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scans.map((scan) => (
                          <tr key={scan.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="py-4 px-6 text-white max-w-xs truncate">
                              {scan.url || 'Screenshot'}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                scan.scan_type === 'website'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}>
                                {scan.scan_type}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                scan.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {scan.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="flex items-center gap-1 text-slate-300">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                {scan.dark_patterns?.length || 0}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-sm">
                              {formatDate(scan.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Export Tab */}
              {activeTab === 'export' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Data Export</h2>
                    <p className="text-slate-400 mt-1">
                      Download the full database of registered users and their scan activity.
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">User Database</h3>
                        <p className="text-sm text-slate-400 mt-1">
                          Includes profile info, scan counts, patterns detected, and timestamps for every registered user.
                        </p>
                      </div>
                      <button
                        onClick={fetchExportData}
                        disabled={exportLoading}
                        className="px-4 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      >
                        {exportLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Load data
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {exportError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{exportError}</span>
                    </div>
                  )}

                  {allProfiles.length > 0 && (
                    <>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Total Users</p>
                          <p className="text-2xl font-bold text-white">{allProfiles.length}</p>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Total Scans</p>
                          <p className="text-2xl font-bold text-white">{allScans.length}</p>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Patterns Detected</p>
                          <p className="text-2xl font-bold text-white">
                            {allScans.reduce((sum, s) => sum + (s.dark_patterns?.length || 0), 0)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={exportCSV}
                          className="flex-1 px-4 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <FileSpreadsheet className="w-5 h-5" />
                          Download CSV
                        </button>
                        <button
                          onClick={exportJSON}
                          className="flex-1 px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-xl font-medium hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                        >
                          <FileJson className="w-5 h-5" />
                          Download JSON
                        </button>
                      </div>

                      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-700 bg-slate-800/50">
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Name</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Phone</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Role</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Scans</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Patterns</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Joined</th>
                              </tr>
                            </thead>
                            <tbody>
                              {buildUserExportRows().map((row) => (
                                <tr key={row.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                  <td className="py-4 px-6 text-white">{row.full_name || '—'}</td>
                                  <td className="py-4 px-6 text-slate-300">{row.phone || '—'}</td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      row.role === 'admin'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-slate-600 text-slate-300'
                                    }`}>
                                      {row.role}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-slate-300">{row.total_scans}</td>
                                  <td className="py-4 px-6 text-slate-300">{row.total_patterns_detected}</td>
                                  <td className="py-4 px-6 text-slate-400 text-sm">{row.created_at}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {allProfiles.length === 0 && !exportLoading && !exportError && (
                    <div className="text-center py-12 text-slate-500">
                      <Download className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Click "Load data" to fetch the user database for export.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
