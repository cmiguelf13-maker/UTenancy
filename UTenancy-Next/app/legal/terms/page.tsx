import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | UTenancy',
  description: 'UTenancy Terms of Service — the rules and guidelines for using the UTenancy platform.',
}

const EFFECTIVE_DATE = 'April 8, 2025'

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen warm-grain dark-surface px-6 py-24">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors font-body text-sm mb-10">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to UTenancy
        </Link>

        {/* Header */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/50 uppercase tracking-widest mb-6">
            Legal
          </span>
          <h1 className="font-display text-5xl font-light text-white mb-4 leading-tight">
            Terms of <em className="text-sand">Service</em>
          </h1>
          <p className="font-body text-white/40 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        {/* Body */}
        <div className="prose-legal space-y-10 font-body text-white/70 leading-relaxed text-sm">

          <section>
            <p>
              Welcome to UTenancy. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the UTenancy website, mobile application, and related services (collectively, the &quot;Platform&quot;) operated by Tenancy LLC (&quot;UTenancy,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using the Platform you agree to be bound by these Terms. If you do not agree, do not access or use the Platform.
            </p>
          </section>

          <Section title="1. Eligibility">
            <p>You must be at least 18 years old and capable of forming a binding contract to use the Platform. By creating an account you represent and warrant that all information you submit is accurate and that you will maintain the accuracy of such information. Students who register must hold a valid .edu email address or otherwise demonstrate current enrollment at a participating university.</p>
          </Section>

          <Section title="2. Account Registration">
            <p>You are responsible for safeguarding your account credentials and for all activity under your account. You must notify us immediately at <a href="mailto:cfernandez@utenancy.com" className="text-sand hover:underline">cfernandez@utenancy.com</a> of any unauthorized use. We reserve the right to terminate accounts at our discretion, including for violation of these Terms.</p>
          </Section>

          <Section title="3. User Roles">
            <p>The Platform serves two primary user roles:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
              <li><strong className="text-white/80">Students:</strong> verified university students browsing, saving, and applying for housing listings.</li>
              <li><strong className="text-white/80">Landlords:</strong> property owners and managers who create and manage listings and communicate with applicants via the landlord dashboard.</li>
            </ul>
            <p className="mt-3">Each role carries distinct permissions and responsibilities described throughout these Terms and in our User Agreement.</p>
          </Section>

          <Section title="4. Listings and Content">
            <p>Landlords are solely responsible for the accuracy, legality, and completeness of their listings. You agree not to post listings that are:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
              <li>Fraudulent, deceptive, or misleading.</li>
              <li>Discriminatory in violation of the Fair Housing Act, California Fair Employment and Housing Act, or any other applicable law.</li>
              <li>Already rented, sold, or otherwise unavailable.</li>
              <li>In violation of local zoning or rental licensing requirements.</li>
            </ul>
            <p className="mt-3">UTenancy reserves the right to remove any listing that violates these Terms or our policies without notice.</p>
          </Section>

          <Section title="5. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
              <li>Scrape, crawl, or harvest data from the Platform without prior written consent.</li>
              <li>Use the Platform to transmit spam, unsolicited communications, or malware.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
              <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
              <li>Attempt to gain unauthorized access to any portion of the Platform or its related systems.</li>
              <li>Use the Platform for any unlawful purpose or in violation of any applicable regulations.</li>
            </ul>
          </Section>

          <Section title="6. Fees and Payments">
            <p>Certain features of the Platform, particularly landlord SaaS tools, may require a paid subscription. Pricing, billing cycles, and refund policies will be disclosed at the time of purchase and are incorporated into these Terms by reference. All fees are non-refundable except as required by applicable law or as expressly stated in a separate written agreement.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>The Platform and its original content, features, and functionality are and will remain the exclusive property of Tenancy LLC and its licensors. You retain ownership of content you submit, but grant UTenancy a worldwide, royalty-free, sublicensable license to use, reproduce, modify, and display your content solely to operate and improve the Platform.</p>
          </Section>

          <Section title="8. Disclaimers">
            <p>THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. UTenancy does not warrant that listings are accurate, complete, or that the Platform will be uninterrupted or error-free. UTenancy is not a party to any rental agreement between landlords and students and is not responsible for disputes arising therefrom.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, UTENANCY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES. OUR AGGREGATE LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE GREATER OF $100 OR THE AMOUNTS YOU PAID TO UTENANCY IN THE TWELVE MONTHS PRECEDING THE CLAIM.</p>
          </Section>

          <Section title="10. Indemnification">
            <p>You agree to indemnify, defend, and hold harmless UTenancy and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or in any way connected with: (a) your access to or use of the Platform; (b) your violation of these Terms; or (c) your violation of any third-party right, including any intellectual property or privacy right.</p>
          </Section>

          <Section title="11. California-Specific Rights (CCPA)">
            <p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (&quot;CCPA&quot;). Please review our <Link href="/legal/privacy" className="text-sand hover:underline">Privacy Policy</Link> for a full description of your CCPA rights, including the right to know, right to delete, right to correct, and right to opt out of the sale or sharing of personal information.</p>
          </Section>

          <Section title="12. Governing Law and Dispute Resolution">
            <p>These Terms shall be governed by the laws of the State of California, without regard to its conflict of law provisions. Any dispute arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Los Angeles County, California. You waive any objection to such jurisdiction and venue.</p>
          </Section>

          <Section title="13. Changes to Terms">
            <p>We may update these Terms from time to time. We will notify you of material changes by posting the new Terms on this page and updating the effective date. Your continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.</p>
          </Section>

          <Section title="14. Contact Us">
            <p>For questions about these Terms, please contact us at:</p>
            <address className="not-italic mt-2 text-white/50">
              Tenancy LLC<br />
              Los Angeles, California<br />
              <a href="mailto:cfernandez@utenancy.com" className="text-sand hover:underline">cfernandez@utenancy.com</a>
            </address>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6">
          <Link href="/legal/privacy" className="font-body text-white/40 text-xs hover:text-white/70 transition-colors">Privacy Policy</Link>
          <Link href="/legal/user-agreement" className="font-body text-white/40 text-xs hover:text-white/70 transition-colors">User Agreement</Link>
        </div>

      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-head font-bold text-white text-base mb-3 tracking-wide">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
