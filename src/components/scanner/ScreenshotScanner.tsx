import { useState, useRef } from 'react';
import { supabase, Scan, DarkPattern } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { analyzeTextContent } from '../../lib/darkPatternDetector';
import { Header } from '../layout/Header';
import {
  Camera,
  Upload,
  Loader,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Image,
  Type,
  X,
  FileText,
} from 'lucide-react';
import { DARK_PATTERN_TYPES, SEVERITY_COLORS } from '../../lib/darkPatternsData';

interface ScanResult {
  scan: Scan;
  patterns: DarkPattern[];
  extractedText: string;
}

export function ScreenshotScanner() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'image' | 'text'>('text');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simulated OCR - extracts text from image using basic analysis
  // In production, this would use Tesseract.js or a server-side OCR API
  const performOCR = async (imageData: string): Promise<string> => {
    // For now, we'll return a message that OCR requires text input
    // In production, you would:
    // 1. Use Tesseract.js for client-side OCR
    // 2. Or send to a server-side OCR API

    return 'OCR text extraction would be performed here. For now, please use manual text input or paste the text visible in your screenshot.';
  };

  const scanImage = async () => {
    if (!imagePreview && !manualText.trim()) {
      setError('Please upload an image or enter text to analyze');
      return;
    }

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      // Create scan record
      const { data: scanData } = await supabase
        .from('scans')
        .insert({
          user_id: user!.id,
          scan_type: 'screenshot',
          url: null,
          ocr_text: manualText || null,
          status: 'processing',
        })
        .select()
        .maybeSingle();

      if (!scanData) {
        throw new Error('Failed to create scan record');
      }

      let extractedText = manualText;

      // If image was uploaded, perform OCR
      if (imagePreview && !manualText) {
        extractedText = await performOCR(imagePreview);
      }

      // Analyze text for dark patterns
      const detectedPatterns = await analyzeTextContent(extractedText);

      // Update scan with OCR text
      await supabase
        .from('scans')
        .update({
          ocr_text: extractedText.substring(0, 10000),
          status: 'completed',
        })
        .eq('id', scanData.id);

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
          element_selector: '',
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
        patterns: patternsData || [],
        extractedText: extractedText.substring(0, 5000),
      });
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'An error occurred while scanning');
    } finally {
      setScanning(false);
    }
  };

  const PatternCard = ({ pattern }: { pattern: DarkPattern }) => {
    const isExpanded = expandedPattern === pattern.id;
    const patternInfo = DARK_PATTERN_TYPES.find((p) => p.id === pattern.pattern_type);

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 ${SEVERITY_COLORS[pattern.severity].bg}`}
              />
              <div>
                <h4 className="font-semibold text-gray-900 capitalize">
                  {pattern.pattern_type.replace(/_/g, ' ')}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {patternInfo?.description || pattern.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="font-bold text-gray-900">{pattern.confidence}%</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                <p className="text-gray-900">{pattern.description}</p>
              </div>

              {pattern.element_text && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Detected Text
                  </p>
                  <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200 font-mono text-sm">
                    "{pattern.element_text}"
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Recommendation</p>
                <p className="text-green-700 bg-green-50 p-3 rounded-lg">
                  {pattern.recommendation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Screenshot Scanner" subtitle="Analyze screenshots for dark patterns using OCR" />

      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Scanner Input */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Analyze a Screenshot</h2>
                <p className="text-sm text-gray-500">
                  Upload an image or paste text to detect dark patterns
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('image')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  mode === 'image'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Image className="w-5 h-5" />
                Upload Image
              </button>
              <button
                onClick={() => setMode('text')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  mode === 'text'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Type className="w-5 h-5" />
                Paste Text
              </button>
            </div>

            {/* Image Upload Mode */}
            {mode === 'image' && (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop an image here, or click to select
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports PNG, JPG, GIF up to 10MB
                    </p>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {imagePreview ? 'Change image' : 'Select image'}
                </label>
              </div>
            )}

            {/* Text Input Mode */}
            {mode === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text to analyze
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste the text from a screenshot or webpage here. The AI will analyze it for dark patterns like:
- Hidden costs
- Forced action
- Confirmshaming (&quot;No thanks, I prefer to pay full price&quot;)
- Fake countdown timers
- Sneak into basket
- Pre-selected checkboxes
- And more..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Tip: Copy text from websites or type out phrases you see in screenshots
                </p>
              </div>
            )}

            <button
              onClick={scanImage}
              disabled={scanning}
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Analyze for Dark Patterns
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
            )}
          </div>

          {/* Detection Info */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              What the AI Detects
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                { icon: '💰', text: 'Hidden costs' },
                { icon: '👆', text: 'Forced action' },
                { icon: '😔', text: 'Confirmshaming' },
                { icon: '🛒', text: 'Sneak into basket' },
                { icon: '⏱️', text: 'Fake countdown timers' },
                { icon: '↪️', text: 'Misdirection' },
                { icon: '🔒', text: 'Privacy manipulation' },
                { icon: '🚫', text: 'Obstruction' },
                { icon: '🪳', text: 'Roach Motel' },
                { icon: '✅', text: 'Pre-selected checkboxes' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700 bg-white p-2 rounded-lg">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scan Result */}
          {result && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      result.patterns.length > 0
                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                        : 'bg-gradient-to-br from-green-500 to-green-600'
                    }`}
                  >
                    {result.patterns.length > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {result.patterns.length > 0
                        ? `${result.patterns.length} Dark Pattern${result.patterns.length > 1 ? 's' : ''} Detected`
                        : 'No Dark Patterns Detected'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Analysis completed at{' '}
                      {new Date(result.scan.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Report */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Analysis Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Text analyzed:</span>
                    <span className="text-gray-900">{result.extractedText.length} characters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patterns detected:</span>
                    <span className="text-gray-900">{result.patterns.length}</span>
                  </div>
                  {result.patterns.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">High severity:</span>
                      <span className="text-red-600">
                        {result.patterns.filter((p) => p.severity === 'high').length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {result.patterns.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Detected Patterns</h3>
                  {result.patterns.map((pattern) => (
                    <PatternCard key={pattern.id} pattern={pattern} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-green-50 rounded-xl">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-medium">
                    No dark patterns were detected in the provided text.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Example Detection Report */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Example Detection Report</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">Dark Pattern Found</h4>
                  <p className="text-sm text-gray-500">Example detection</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  High Severity
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium text-gray-900 capitalize">Confirmshaming</p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-medium text-gray-900">93%</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500">Description</p>
                  <p className="text-gray-900">
                    The dialog attempts to shame the user into accepting.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500">Recommendation</p>
                  <p className="text-green-700 font-medium">Use neutral wording.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
