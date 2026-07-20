import { Header } from '../layout/Header';
import {
  FileText,
  BookOpen,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Shield,
  Eye,
  Cpu,
} from 'lucide-react';

export function Documentation() {
  const sections = [
    {
      icon: AlertTriangle,
      title: 'What is a Dark Pattern?',
      content: `Dark patterns are deceptive user interface design choices that trick users into doing things they didn't mean to, such as buying insurance with their purchase or signing up for recurring bills.

They exploit cognitive biases and psychological principles to manipulate users into actions that benefit the business, often at the expense of the user's best interests.

Common examples include:
- Hidden costs revealed only at checkout
- Pre-selected checkboxes for newsletter signups
- Confusing cancellation processes
- Fake urgency (limited time offers that never expire)
- Guilt-inducing language ("No thanks, I don't want to save money")`,
    },
    {
      icon: Eye,
      title: 'How Detection Works',
      content: `DarkScan AI uses a multi-layered approach to detect dark patterns:

1. OCR (Optical Character Recognition): Extracts all visible text from screenshots or webpage captures.

2. Computer Vision: Analyzes UI elements, button placements, color contrasts, and visual hierarchy to identify deceptive patterns.

3. Natural Language Processing: Analyzes the extracted text for manipulative language, guilt phrases, urgency markers, and deceptive wording.

4. Heuristic Rules: Our rule engine checks for common dark pattern templates like confirmshaming, fake countdown timers, and sneaky opt-ins.

5. Machine Learning: Advanced AI models trained on thousands of examples to recognize subtle patterns.`,
    },
    {
      icon: Cpu,
      title: 'Detection Rules',
      content: `Our system uses several heuristic rules to identify dark patterns:

**Confirmshaming Detection**
- IF button contains "No thanks" AND contains negative wording
- THEN flag as potential confirmshaming

**Hidden Costs Detection**
- IF text contains "fee" OR "charge" at checkout stage
- AND not clearly visible before payment page
- THEN flag as potential hidden costs

**Pre-selected Checkbox**
- IF checkbox is checked by default
- AND relates to marketing/data sharing
- THEN flag as pre-selected checkbox

**Fake Urgency**
- IF countdown timer resets on page reload
- OR "limited time" offer appears consistently
- THEN flag as fake urgency

**Obstruction**
- IF cancel option requires phone call
- OR multiple steps required to opt out
- THEN flag as obstruction`,
    },
    {
      icon: Shield,
      title: 'System Architecture',
      content: `DarkScan AI is built with modern, scalable technologies:

**Frontend**
- React with TypeScript
- Tailwind CSS for styling
- Real-time progress updates

**Backend**
- Supabase for database and authentication
- Edge Functions for processing
- OCR and NLP pipelines

**Detection Engine**
- Multi-stage analysis pipeline
- Confidence scoring algorithm
- Explainable AI for recommendations

**Data Storage**
- Secure user data encryption
- Scan history and results
- Pattern database for continuous improvement`,
    },
  ];

  const faqs = [
    {
      question: 'Is my data secure?',
      answer: 'Yes, all data is encrypted at rest and in transit. We never share your screenshots or analysis results with third parties.',
    },
    {
      question: 'How accurate is the detection?',
      answer: 'Our AI achieves 90%+ accuracy on known dark patterns. Each detection includes a confidence score so you can assess reliability.',
    },
    {
      question: 'Can I scan private websites?',
      answer: 'You can scan any public website or upload screenshots. Password-protected pages would need to be captured as screenshots.',
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support PNG, JPG, and JPEG images up to 10MB in size.',
    },
    {
      question: 'How can I report false positives?',
      answer: 'Use the feedback button on any detection result to help us improve our accuracy.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Documentation" subtitle="Learn about dark patterns and how DarkScan AI works" />

      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Sections */}
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            </div>
          ))}

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="group border border-slate-200 rounded-xl">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-900">{faq.question}</span>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 text-slate-600">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>

          {/* References */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">References & Resources</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="https://www.deceptive.design/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-emerald-400" />
                <span>Deceptive Design (Harry Brignull)</span>
              </a>
              <a
                href="https://www.ftc.gov/reports/bringing-dark-patterns-light"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-emerald-400" />
                <span>FTC Report on Dark Patterns</span>
              </a>
              <a
                href="https://www.nngroup.com/articles/dark-patterns-deception-ux/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-emerald-400" />
                <span>Nielsen Norman Group</span>
              </a>
              <a
                href="https://www.w3.org/TR/design-principles/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-emerald-400" />
                <span>W3C Ethical Web Principles</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
