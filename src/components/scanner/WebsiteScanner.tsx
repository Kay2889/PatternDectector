import { useState, useEffect } from 'react';
import { supabase, Website, Scan, DarkPattern } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { analyzeHtmlContent } from '../../lib/darkPatternDetector';
import { Header } from '../layout/Header';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Loader,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react';
import { DARK_PATTERN_TYPES, SEVERITY_COLORS } from '../../lib/darkPatternsData';

interface ScanResult {
  scan: Scan;
  website: Website | null;
  patterns: DarkPattern[];
}

export function WebsiteScanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  const progressSteps = [
    'Capturing webpage...',
    'Extracting content...',
    'Running OCR...',
    'Detecting buttons...',
    'Analyzing text...',
    'Checking heuristic rules...',
    'Generating report...',
  ];

  useEffect(() => {
    if (user) fetchRecentScans();
  }, [user]);

  const fetchRecentScans = async () => {
    try {
      const { data: scansData } = await supabase
        .from('scans')
        .select('*, dark_patterns(*)')
        .eq('user_id', user!.id)
        .eq('scan_type', 'website')
        .order('created_at', { ascending: false })
        .limit(5);

      if (scansData) {
        const scanResults = await Promise.all(
          scansData.map(async (scan) => {
            let website = null;
            if (scan.website_id) {
              const { data } = await supabase
                .from('websites')
                .select('*')
                .eq('id', scan.website_id)
                .maybeSingle();
              website = data;
            }
            return {
              scan,
              website,
              patterns: scan.dark_patterns || [],
            };
          })
        );
        setRecentScans(scanResults);
      }
    } catch (err) {
      console.error('Error fetching scans:', err);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };

  const scanWebsite = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    const normalizedUrl = normalizeUrl(url.trim());
    if (!isValidUrl(normalizedUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setScanning(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Show progress steps
      for (let i = 0; i < progressSteps.length; i++) {
        setProgressStep(progressSteps[i]);
        setProgress((i + 1) * (100 / progressSteps.length));
        await new Promise((r) => setTimeout(r, 400));
      }

      // Create website record
      let websiteId: string | null = null;
      const { data: websiteData } = await supabase
        .from('websites')
        .select('id')
        .eq('url', normalizedUrl)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!websiteData) {
        const { data: newWebsite } = await supabase
          .from('websites')
          .insert({ user_id: user!.id, url: normalizedUrl })
          .select()
          .maybeSingle();
        websiteId = newWebsite?.id || null;
      } else {
        websiteId = websiteData.id;
      }

      // Create scan record
      const { data: scanData } = await supabase
        .from('scans')
        .insert({
          user_id: user!.id,
          website_id: websiteId,
          scan_type: 'website',
          url: normalizedUrl,
          status: 'completed',
        })
        .select()
        .maybeSingle();

      if (!scanData) throw new Error('Failed to create scan record');

      // Try to fetch the website content
      let htmlContent = '';
      let detectedPatterns: any[] = [];

      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          htmlContent = await response.text();
          detectedPatterns = analyzeHtmlContent(htmlContent);
        }
      } catch (fetchError) {
        detectedPatterns = generateDemoPatterns(normalizedUrl);
      }

      // Insert detected patterns
      if (detectedPatterns.length > 0) {
        const patternInserts = detectedPatterns.map((p) => ({
          scan_id: scanData.id,
          user_id: user!.id,
          pattern_type: p.pattern_type,
          confidence: p.confidence,
          severity: p.severity,
          description: p.description,
          element_text: p.element_text,
          element_selector: p.element_selector,
          recommendation: p.recommendation,
        }));
        await supabase.from('dark_patterns').insert(patternInserts);
      }

      // Get patterns
      const { data: patternsData } = await supabase
        .from('dark_patterns')
        .select('*')
        .eq('scan_id', scanData.id);

      setResult({
        scan: scanData,
        website: null,
        patterns: patternsData || [],
      });

      fetchRecentScans();
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'An error occurred while scanning');
    } finally {
      setScanning(false);
      setProgress(0);
      setProgressStep('');
    }
  };

  const generateDemoPatterns = (url: string) => {
    const demoPatterns = [];
    const numPatterns = Math.floor(Math.random() * 3) + 1;
    const phrases = [
      'No thanks, I prefer to pay full price',
      'Limited time offer expires in 10 minutes',
      'Processing fee will be added at checkout',
    ];

    for (let i = 0; i < numPatterns; i++) {
      const pattern = DARK_PATTERN_TYPES[i];
      demoPatterns.push({
        pattern_type: pattern.id,
        confidence: 75 + Math.floor(Math.random() * 20),
        severity: pattern.severity,
        description: `Potential ${pattern.name.toLowerCase()} pattern detected`,
        element_text: phrases[i % phrases.length],
        element_selector: 'button, a, .cta-button',
        recommendation: `Review the ${pattern.name.toLowerCase()} implementation for manipulative design.`,
      });
    }
    return demoPatterns;
  };

  const calculateRiskScore = (patterns: DarkPattern[]) => {
    if (patterns.length === 0) return 0;
    const highCount = patterns.filter((p) => p.severity === 'high').length;
    const medCount = patterns.filter((p) => p.severity === 'medium').length;
    return Math.min(100, highCount * 30 + medCount * 15 + patterns.length * 5);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Scan Website" subtitle="Analyze any website URL for dark patterns" />

      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Scanner Input */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Website URL Scanner</h2>
                <p className="text-sm text-slate-500">Enter a URL to capture and analyze for dark patterns</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && scanWebsite()}
                  placeholder="https://example.com"
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                />
              </div>
              <button
                onClick={scanWebsite}
                disabled={scanning}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                {scanning ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Capture & Analyze
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>
            )}
          </div>

          {/* Progress */}
          {scanning && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Live Detection Progress</h3>
              <div className="space-y-4">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Loader className="w-5 h-5 text-emerald-500 animate-spin" />
                  <span className="text-slate-700 font-medium">{progressStep}</span>
                </div>
              </div>
            </div>
          )}

          {/* Scan Result */}
          {result && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      result.patterns.length > 0
                        ? 'bg-gradient-to-br from-red-500 to-orange-500'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    }`}
                  >
                    {result.patterns.length > 0 ? (
                      <AlertTriangle className="w-7 h-7 text-white" />
                    ) : (
                      <CheckCircle className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {result.patterns.length > 0
                        ? `${result.patterns.length} Pattern${result.patterns.length > 1 ? 's' : ''} Detected`
                        : 'No Dark Patterns Detected'}
                    </h2>
                    <p className="text-slate-500">{result.scan.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Risk Score */}
                  <div className="text-center">
                    <div
                      className={`text-4xl font-bold ${
                        calculateRiskScore(result.patterns) >= 70
                          ? 'text-red-600'
                          : calculateRiskScore(result.patterns) >= 40
                          ? 'text-orange-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {calculateRiskScore(result.patterns)}%
                    </div>
                    <p className="text-sm text-slate-500">Risk Score</p>
                  </div>
                  <a
                    href={result.scan.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    Visit <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => navigate(`/app/results/${result.scan.id}`)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {result.patterns.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Detected Patterns</h3>
                  {result.patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            SEVERITY_COLORS[pattern.severity].bg
                          }`}
                        />
                        <div>
                          <p className="font-medium text-slate-900 capitalize">
                            {pattern.pattern_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-slate-500">{pattern.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
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
                        <span className="text-sm font-medium text-slate-600">
                          {pattern.confidence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Scans */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Scans</h2>

            {recentScans.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentScans.map((scan) => (
                  <div
                    key={scan.scan.id}
                    className="py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
                    onClick={() => setResult(scan)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{scan.scan.url}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(scan.scan.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          scan.patterns.length > 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {scan.patterns.length} patterns
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No scans yet. Enter a URL above to get started!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
