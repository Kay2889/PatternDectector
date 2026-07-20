import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { analyzeTextContent } from '../../lib/darkPatternDetector';
import { Header } from '../layout/Header';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Loader,
  X,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export function ScreenshotUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progressSteps = [
    'Uploading...',
    'Image Processing...',
    'OCR Running...',
    'Detecting Buttons...',
    'Analyzing Text...',
    'Checking Heuristic Rules...',
    'Generating Report...',
  ];

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
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const scanAndAnalyze = async () => {
    if (!imagePreview && !manualText.trim()) return;

    setScanning(true);
    setProgress(0);

    try {
      // Simulate progress steps
      for (let i = 0; i < progressSteps.length; i++) {
        setProgressStep(progressSteps[i]);
        setProgress((i + 1) * (100 / progressSteps.length));
        await new Promise((r) => setTimeout(r, 400));
      }

      // Create scan record
      const { data: scanData } = await supabase
        .from('scans')
        .insert({
          user_id: user!.id,
          scan_type: 'screenshot',
          status: 'completed',
        })
        .select()
        .maybeSingle();

      if (!scanData) throw new Error('Failed to create scan');

      // Analyze text for dark patterns
      let textToAnalyze = manualText;
      if (imagePreview && !manualText) {
        textToAnalyze = 'Sample text from image for analysis';
      }

      const detectedPatterns = await analyzeTextContent(textToAnalyze);

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

      // Navigate to results
      navigate(`/app/results/${scanData.id}`);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setScanning(false);
      setProgress(0);
      setProgressStep('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Upload Screenshot"
        subtitle="Analyze screenshots for dark patterns"
      />

      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('image')}
                className={`flex-1 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  mode === 'image'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Image className="w-5 h-5" />
                Upload Image
              </button>
              <button
                onClick={() => setMode('text')}
                className={`flex-1 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  mode === 'text'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                Paste Text
              </button>
            </div>

            {/* Image Upload */}
            {mode === 'image' && (
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-80 mx-auto rounded-xl shadow-lg"
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Upload className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-700 mb-2">
                      Drop Screenshot Here
                    </p>
                    <p className="text-slate-500 mb-6">or</p>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Browse File
                </label>
                <p className="text-sm text-slate-400 mt-4">
                  Supported formats: JPG, PNG, JPEG
                </p>
              </div>
            )}

            {/* Text Input */}
            {mode === 'text' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Text to Analyze
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste the text from a screenshot or webpage here..."
                  className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={scanAndAnalyze}
                disabled={scanning || (!imagePreview && !manualText.trim())}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
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
            </div>
          </div>

          {/* Progress Section */}
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
        </div>
      </main>
    </div>
  );
}
