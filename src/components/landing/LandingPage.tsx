import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Upload,
  Globe,
  ArrowRight,
  CheckCircle,
  Zap,
  Eye,
  FileText,
  Target,
  BarChart3,
  AlertTriangle,
  Camera,
  MousePointer,
  DollarSign,
  Timer,
  Lock,
  ShoppingCart,
  ChevronRight,
  Github,
  Mail,
  FileQuestion,
  Scale,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const darkPatterns = [
    { name: 'Hidden Costs', icon: DollarSign, checked: true },
    { name: 'Confirm Shaming', icon: AlertTriangle, checked: true },
    { name: 'Forced Continuity', icon: Lock, checked: true },
    { name: 'Sneak Into Basket', icon: ShoppingCart, checked: true },
    { name: 'Pre-selected Checkboxes', icon: CheckCircle, checked: true },
    { name: 'Misdirection', icon: MousePointer, checked: true },
    { name: 'Disguised Ads', icon: Eye, checked: true },
    { name: 'Visual Interference', icon: Target, checked: true },
    { name: 'Obstruction', icon: FileText, checked: true },
  ];

  const whyChooseFeatures = [
    { icon: Zap, title: 'Fast Detection', description: 'Instantly analyze UI elements and text patterns' },
    { icon: Eye, title: 'AI + OCR', description: 'Advanced image recognition and text extraction' },
    { icon: FileText, title: 'Explainable Results', description: 'Clear explanations for every detection' },
    { icon: Camera, title: 'Screenshot Analysis', description: 'Upload screenshots for instant analysis' },
    { icon: Target, title: 'Ethical UI Recommendations', description: 'Get actionable suggestions for improvement' },
    { icon: BarChart3, title: 'Confidence Scores', description: 'Know how reliable each detection is' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                DarkScan AI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-slate-600 hover:text-emerald-600 transition-colors">About</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-emerald-600 transition-colors">How It Works</a>
              <a href="#patterns" className="text-slate-600 hover:text-emerald-600 transition-colors">Patterns</a>
              <a href="#why-choose" className="text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin-login')}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors text-sm"
              >
                Admin
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Automated Dark Pattern Detection
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Detect Dark Patterns
            <br />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Protect Users
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            AI-powered platform that identifies manipulative UI design patterns in websites
            and applications, promoting ethical interface design across Ghana's digital ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-3"
            >
              <Upload className="w-5 h-5" />
              Upload Screenshot
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold text-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center gap-3"
            >
              <Globe className="w-5 h-5" />
              Analyze Website
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 text-emerald-600 font-semibold text-lg hover:text-emerald-700 transition-colors flex items-center gap-2"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">About Dark Patterns</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Understanding manipulative design and why it matters
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">What Are Dark Patterns?</h3>
              <p className="text-slate-600 leading-relaxed">
                Deceptive UI/UX designs that trick users into actions they didn't intend,
                often benefiting the business at the user's expense.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Why They Matter</h3>
              <p className="text-slate-600 leading-relaxed">
                Dark patterns exploit cognitive biases, erode user trust,
                violate privacy, and can lead to financial harm and emotional manipulation.
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">How We Detect</h3>
              <p className="text-slate-600 leading-relaxed">
                Our AI combines OCR, computer vision, and NLP to analyze
                UI elements, text patterns, and visual cues systematically.
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border border-amber-100">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ghana's Digital Future</h3>
              <p className="text-slate-600 leading-relaxed">
                Promoting ethical design in Ghana's rapidly growing
                digital ecosystem, protecting consumers and building trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Simple 4-step process to analyze any interface</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Upload Screenshot', description: 'Drag and drop or select an image of the interface', icon: Upload, color: 'from-blue-500 to-cyan-500' },
              { step: '02', title: 'OCR Extracts Text', description: 'Advanced OCR identifies all text elements', icon: FileText, color: 'from-purple-500 to-pink-500' },
              { step: '03', title: 'Computer Vision', description: 'AI analyzes UI elements and layout patterns', icon: Eye, color: 'from-orange-500 to-red-500' },
              { step: '04', title: 'Report Generated', description: 'Comprehensive dark pattern analysis report', icon: BarChart3, color: 'from-emerald-500 to-teal-500' },
            ].map((item, index) => (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-slate-300" />
                )}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-bold text-emerald-600 mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Dark Patterns */}
      <section id="patterns" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Supported Dark Patterns</h2>
            <p className="text-xl text-slate-600">Our AI can detect these manipulative patterns</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {darkPatterns.map((pattern, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <pattern.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-medium text-slate-900">{pattern.name}</span>
                <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose DarkScan */}
      <section id="why-choose" className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose DarkScan AI?</h2>
            <p className="text-xl text-slate-400">Powerful features for ethical UI analysis</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-emerald-500/50 transition-colors"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Detecting Dark Patterns Today
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Join thousands of users protecting themselves and others from manipulative design
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-10 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl flex items-center gap-3 mx-auto"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">DarkScan AI</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Automated dark pattern detection for ethical user interface design.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  <FileQuestion className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">
            <p>&copy; 2024 DarkScan AI. All rights reserved. Promoting ethical design in Ghana's digital ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
