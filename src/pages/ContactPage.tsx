import React, { useState } from 'react';
import { MapPin, Phone, MessageSquare, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setLoading(true);
    setError('');
    try {
      await api.submitContact({
        name,
        email,
        phone,
        subject: subject || 'General Ritual Inquiry',
        message,
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (e: any) {
      setError(e.message || 'We could not send your enquiry. Please try again or contact us by phone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="contact-atelier-page" className="min-h-screen py-12 sm:py-20 bg-[#F8F5FF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#7C3AED] font-semibold bg-[#7C3AED]/10 px-3.5 py-1 rounded-full border border-[#7C3AED]/20 inline-block">
            ATELIER &amp; CARE
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl text-[#1E1630] font-normal leading-tight">
            Connect With <span className="gradient-text">GlowWithSH</span>
          </h1>
          <p className="font-sans text-base text-[#6B5F82] max-w-xl mx-auto leading-relaxed">
            Ask about a product, delivery or an existing order. Include your order reference when you need help with a purchase.
          </p>
        </div>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
        {/* Contact Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Official Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-8 rounded-2xl border border-[#DDD6F3] shadow-sm space-y-6">
              <h3 className="font-serif text-2xl text-[#1E1630]">Studio Information</h3>

              <div className="space-y-4 text-sm font-sans text-[#6B5F82]">
                {/* Physical Atelier Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#EDE8F9] flex items-center justify-center text-[#7C3AED] shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E1630] block text-xs uppercase tracking-wider">
                      Atelier Address
                    </span>
                    <p className="text-xs leading-relaxed mt-0.5">
                      E Block street no 08 pahadi mandir wali gali, Subhash Vihar, Delhi 110053, India
                    </p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#EDE8F9] flex items-center justify-center text-[#7C3AED] shrink-0 mt-0.5">
                    <Phone size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E1630] block text-xs uppercase tracking-wider">
                      Telephone &amp; Care
                    </span>
                    <a
                      href="tel:+917303490594"
                      className="text-xs text-[#1E1630] hover:text-[#7C3AED] transition-colors"
                    >
                      +91 7303490594
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#EDE8F9] flex items-center justify-center text-[#7C3AED] shrink-0 mt-0.5">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E1630] block text-xs uppercase tracking-wider">
                      Instant WhatsApp
                    </span>
                    <a
                      href="https://wa.me/917303490594"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#1E1630] hover:text-[#7C3AED] transition-colors font-medium"
                    >
                      +91 7303490594 (Direct WhatsApp Concierge)
                    </a>
                  </div>
                </div>

                {/* Studio Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#EDE8F9] flex items-center justify-center text-[#7C3AED] shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E1630] block text-xs uppercase tracking-wider">
                      Studio Hours
                    </span>
                    <p className="text-xs leading-relaxed mt-0.5">
                      Monday – Saturday: 10:00 AM – 7:00 PM IST
                      <br />
                      Sunday: Reserved for Formulation &amp; Rest
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Note card */}
            <div className="bg-linear-to-br from-[#1E1630] to-[#2D1B4E] text-white p-6 rounded-2xl border border-[#7C3AED]/30 space-y-2 shadow-lg">
              <p className="font-serif italic text-base sm:text-lg text-purple-100">
                "We read every inquiry directly. Your trust and skin wellness are our atelier's top priorities."
              </p>
              <p className="text-xs uppercase tracking-wider text-[#A78BFA] font-sans font-medium">
                — Shagufi Hussain, Founder
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="glass-card p-8 sm:p-10 rounded-2xl border border-[#DDD6F3] shadow-sm">
              <h3 className="font-serif text-2xl text-[#1E1630] mb-2">Send a Message</h3>
              <p className="text-xs font-sans text-[#6B5F82] mb-6">
                Fill in the details below and a concierge will reply within 24 hours.
              </p>

              {submitted ? (
                <div className="p-6 bg-purple-50/80 backdrop-blur-md text-[#1E1630] rounded-xl border border-purple-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#7C3AED] mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-serif text-xl">Thank you for writing to us</h4>
                  <p className="text-xs font-sans max-w-sm mx-auto leading-relaxed text-[#6B5F82]">
                    Your message has been received by Shagufi Hussain &amp; the GlowWithSH team. We will get back to you shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-xs uppercase tracking-wider font-sans font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contactpage-field-1" className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                        Full Name *
                      </label>
                      <input id="contactpage-field-1"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-3.5 py-2.5 text-xs font-sans bg-white/70 border border-[#DDD6F3] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30 transition-all text-[#1E1630]"
                      />
                    </div>
                    <div>
                      <label htmlFor="contactpage-field-2" className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                        Email Address *
                      </label>
                      <input id="contactpage-field-2"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full px-3.5 py-2.5 text-xs font-sans bg-white/70 border border-[#DDD6F3] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30 transition-all text-[#1E1630]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contactpage-field-3" className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                        Phone / WhatsApp Number
                      </label>
                      <input id="contactpage-field-3"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 text-xs font-sans bg-white/70 border border-[#DDD6F3] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30 transition-all text-[#1E1630]"
                      />
                    </div>
                    <div>
                      <label htmlFor="contactpage-field-4" className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                        Inquiry Subject
                      </label>
                      <input id="contactpage-field-4"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Skin routine advice or order help"
                        className="w-full px-3.5 py-2.5 text-xs font-sans bg-white/70 border border-[#DDD6F3] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30 transition-all text-[#1E1630]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contactpage-field-5" className="block text-xs font-sans font-medium text-[#1E1630] mb-1">
                      Message *
                    </label>
                    <textarea id="contactpage-field-5"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help your daily beauty ritual today?"
                      className="w-full px-3.5 py-2.5 text-xs font-sans bg-white/70 border border-[#DDD6F3] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30 transition-all text-[#1E1630]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 glass-btn-primary rounded-xl text-xs uppercase font-sans font-semibold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{loading ? 'Sending...' : 'Send Message to Atelier'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
