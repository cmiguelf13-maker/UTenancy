'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    // Simulate submission — replace with real endpoint when ready
    await new Promise((r) => setTimeout(r, 800))
    setStatus('success')
  }

  return (
    <main className="min-h-screen warm-grain dark-surface px-6 py-24">
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors font-body text-sm mb-10">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to UTenancy
        </Link>

        {/* Header */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/50 uppercase tracking-widest mb-6">
            Contact
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
            Get in <em className="text-sand">touch.</em>
          </h1>
          <p className="font-body text-white/60 text-lg leading-relaxed">
            Questions, feedback, partnership inquiries — we read everything. You can also reach us directly at{' '}
            <a href="mailto:hello@utenancy.com" className="text-sand hover:text-sand/80 transition-colors">
              hello@utenancy.com
            </a>.
          </p>
        </div>

        {status === 'success' ? (
          <div className="border border-white/10 rounded-2xl p-10 bg-white/5 text-center">
            <span className="material-symbols-outlined text-sand text-5xl mb-4 block">check_circle</span>
            <p className="font-head font-bold text-white text-lg mb-2">Message sent!</p>
            <p className="font-body text-white/50 text-sm">We&apos;ll get back to you within 1–2 business days.</p>
            <button
              onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }) }}
              className="mt-6 font-body text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-head font-bold text-white/50 text-xs uppercase tracking-widest mb-2">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-body text-white placeholder-white/25 text-sm focus:outline-none focus:border-sand/40 transition-colors"
                />
              </div>
              <div>
                <label className="block font-head font-bold text-white/50 text-xs uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-body text-white placeholder-white/25 text-sm focus:outline-none focus:border-sand/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-head font-bold text-white/50 text-xs uppercase tracking-widest mb-2">Subject</label>
              <select
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-body text-white text-sm focus:outline-none focus:border-sand/40 transition-colors appearance-none"
              >
                <option value="" disabled className="bg-stone">Select a topic…</option>
                <option value="general" className="bg-stone">General inquiry</option>
                <option value="support" className="bg-stone">Support</option>
                <option value="landlord" className="bg-stone">Landlord / listing question</option>
                <option value="partnership" className="bg-stone">Partnership</option>
                <option value="press" className="bg-stone">Press</option>
                <option value="other" className="bg-stone">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-head font-bold text-white/50 text-xs uppercase tracking-widest mb-2">Message</label>
              <textarea
                required
                rows={5}
                placeholder="Tell us what's on your mind…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-body text-white placeholder-white/25 text-sm focus:outline-none focus:border-sand/40 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full clay-grad text-white py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30 disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending…' : 'Send message'}
            </button>

          </form>
        )}

        {/* Alternative contact channels */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: 'mail', label: 'General', value: 'hello@utenancy.com', href: 'mailto:hello@utenancy.com' },
            { icon: 'support_agent', label: 'Support', value: 'support@utenancy.com', href: 'mailto:support@utenancy.com' },
          ].map(({ icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              className="border border-white/10 rounded-2xl p-5 bg-white/5 hover:bg-white/[0.08] transition-colors flex items-center gap-4"
            >
              <span className="material-symbols-outlined text-sand text-2xl">{icon}</span>
              <div>
                <p className="font-head font-bold text-white/40 text-xs uppercase tracking-widest mb-0.5">{label}</p>
                <p className="font-body text-white/70 text-sm">{value}</p>
              </div>
            </a>
          ))}
        </div>

      </div>
    </main>
  )
}
