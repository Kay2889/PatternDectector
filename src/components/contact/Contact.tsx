import { useState } from 'react';
import { supabase, ContactMessage } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../layout/Header';
import {
  Mail,
  MessageSquare,
  Send,
  Loader,
  CheckCircle,
  AlertCircle,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';

export function Contact() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const { error: insertError } = await supabase.from('contact_messages').insert({
        name,
        email,
        message,
        user_id: user?.id || null,
      });

      if (insertError) throw insertError;

      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Contact" subtitle="Get in touch with our team" />

      <main className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Send us a message</h2>
                  <p className="text-sm text-slate-500">We'll get back to you within 24 hours</p>
                </div>
              </div>

              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-600 mb-6">Thank you for reaching out. We'll respond to {email} shortly.</p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-emerald-600 font-medium hover:text-emerald-700"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    {sending ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
                <p className="text-emerald-100 mb-6">
                  Have questions about dark pattern detection? Need help with your account?
                  We're here to help you navigate ethical UI design.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-200">Email us at</p>
                      <p className="font-medium">contact@darkscan.ai</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Connect with us</h3>
                <div className="flex items-center gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div className="bg-slate-100 rounded-2xl p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Office Location</h3>
                <p className="text-slate-600">
                  Accra Digital Centre<br />
                  Independence Avenue<br />
                  Accra, Ghana
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
