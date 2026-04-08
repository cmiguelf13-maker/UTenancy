import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | UTenancy',
  description: 'UTenancy Privacy Policy — how we collect, use, and protect your personal information, including your rights under CCPA.',
}

const EFFECTIVE_DATE = 'April 8, 2025'

export default function PrivacyPolicyPage() {
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
            Privacy <em className="text-sand">Policy</em>
          </h1>
          <p className="font-body text-white/40 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        {/* Body */}
        <div className="space-y-10 font-body text-white/70 leading-relaxed text-sm">

          <section>
            <p>
              UTenancy, Inc. (&quot;UTenancy,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Platform. It also describes your rights under the California Consumer Privacy Act (&quot;CCPA&quot;) and other applicable laws. Please read this policy carefully. If you do not agree with its terms, please do not use the Platform.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <p>We collect information you provide directly, information collected automatically, and information from third parties.</p>
            <SubSection title="a) Information You Provide">
              <ul className="list-disc list-inside space-y-1 text-white/60">
                <li><strong className="text-white/80">Account data:</strong> name, email address, role (student or landlord), and password.</li>
                <li><strong className="text-white/80">Profile data:</strong> university affiliation, .edu email, lifestyle preferences, profile photo.</li>
                <li><strong className="text-white/80">Listing data (landlords):</strong> property address, photos, rent amount, description, availability.</li>
                <li><strong className="text-white/80">Communications:</strong> messages sent through the in-platform messaging system.</li>
                <li><strong className="text-white/80">Payment data:</strong> billing information processed by our third-party payment provider (we do not store full card numbers).</li>
                <li><strong className="text-white/80">Waitlist data:</strong> email address and role preference submitted before account creation.</li>
              </ul>
            </SubSection>
            <SubSection title="b) Information Collected Automatically">
              <ul className="list-disc list-inside space-y-1 text-white/60">
                <li><strong className="text-white/80">Usage data:</strong> pages viewed, features used, clicks, and session duration.</li>
                <li><strong className="text-white/80">Device data:</strong> IP address, browser type, operating system, and device identifiers.</li>
                <li><strong className="text-white/80">Location data:</strong> approximate geographic location derived from IP address and, with your permission, precise device location for distance-to-campus calculations.</li>
                <li><strong className="text-white/80">Cookies and similar technologies:</strong> session tokens and functional cookies used to keep you signed in and remember preferences.</li>
              </ul>
            </SubSection>
            <SubSection title="c) Information from Third Parties">
              <p>We receive authentication information from Supabase when you sign in and may receive information from university verification services to confirm student enrollment status.</p>
            </SubSection>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
              <li>Create and manage your account and authenticate your identity.</li>
              <li>Display and match housing listings to students based on location, preferences, and proximity to campus.</li>
              <li>Facilitate communication between students and landlords via the Platform messaging system.</li>
              <li>Process subscription payments for landlord dashboard features.</li>
              <li>Send transactional emails (account confirmations, password resets, listing updates).</li>
              <li>Improve the Platform, conduct analytics, and develop new features.</li>
              <li>Detect, investigate, and prevent fraud, abuse, and security incidents.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-3">We do <strong className="text-white/80">not</strong> sell your personal information to third parties for monetary consideration. We do not use personal information for behavioral advertising by third parties.</p>
          </Section>

          <Section title="3. How We Share Your Information">
            <p>We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
              <li><strong className="text-white/80">Service providers:</strong> Supabase (database and authentication), Vercel (hosting), payment processors, and email delivery services — solely to operate the Platform.</li>
              <li><strong className="text-white/80">Other users:</strong> landlords can see student-provided contact information when a student expresses interest in their listing; students can view landlord contact information displayed on listings.</li>
              <li><strong className="text-white/80">Legal authorities:</strong> when required by law, court order, or to protect the rights and safety of UTenancy or others.</li>
              <li><strong className="text-white/80">Business transfers:</strong> in connection with a merger, acquisition, or sale of all or substantially all of our assets, subject to standard confidentiality obligations.</li>
            </ul>
          </Section>

          <Section title="4. Cookies and Tracking">
            <p>We use strictly necessary cookies to maintain your session and authenticate you. We do not use third-party advertising or tracking cookies. You can configure your browser to refuse cookies, but some features of the Platform may not function properly as a result.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your personal information for as long as your account is active or as needed to provide services. We retain de-identified analytics data indefinitely. Upon account deletion, we remove or anonymize your personal information within 30 days, except where retention is required by law or to resolve disputes.</p>
          </Section>

          <Section title="6. Data Security">
            <p>We implement industry-standard security measures including encrypted data transmission (TLS), secure storage via Supabase with row-level security policies, and access controls. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security and encourage you to use strong passwords and keep your credentials confidential.</p>
          </Section>

          <Section title="7. Children&apos;s Privacy">
            <p>The Platform is not directed to individuals under 18. We do not knowingly collect personal information from children under 18. If you believe we have inadvertently collected such information, please contact us and we will promptly delete it.</p>
          </Section>

          <Section title="8. Your California Privacy Rights (CCPA)">
            <p>If you are a California resident, you have the following rights under the CCPA and California Privacy Rights Act (&quot;CPRA&quot;):</p>

            <SubSection title="Right to Know">
              <p>You have the right to request that we disclose: the categories and specific pieces of personal information we have collected about you; the categories of sources from which we collected it; the business or commercial purpose for collecting it; and the categories of third parties with whom we share it.</p>
            </SubSection>

            <SubSection title="Right to Delete">
              <p>You have the right to request that we delete personal information we have collected from you, subject to certain exceptions (e.g., where retention is necessary to complete a transaction, detect security incidents, or comply with legal obligations).</p>
            </SubSection>

            <SubSection title="Right to Correct">
              <p>You have the right to request correction of inaccurate personal information we maintain about you.</p>
            </SubSection>

            <SubSection title="Right to Opt Out of Sale or Sharing">
              <p>We do not sell or share your personal information for cross-context behavioral advertising. If this ever changes, we will update this policy and provide a prominent &quot;Do Not Sell or Share My Personal Information&quot; link.</p>
            </SubSection>

            <SubSection title="Right to Limit Use of Sensitive Personal Information">
              <p>We collect certain categories of sensitive personal information (e.g., account login credentials). We use this information only to perform services reasonably expected by you and do not use it for inferring characteristics unrelated to the purposes described in this Policy.</p>
            </SubSection>

            <SubSection title="Right to Non-Discrimination">
              <p>We will not discriminate against you for exercising any of your CCPA rights. We will not deny you goods or services, charge you different prices, or provide a lower quality of service because you exercised your rights.</p>
            </SubSection>

            <SubSection title="How to Submit a Request">
              <p>To exercise any of the rights above, please submit a verifiable consumer request to <a href="mailto:privacy@utenancy.com" className="text-sand hover:underline">privacy@utenancy.com</a> or by contacting us at the address below. We will respond within 45 days of receipt (extendable by an additional 45 days with notice). We may need to verify your identity before processing your request.</p>
            </SubSection>

            <SubSection title="Authorized Agent">
              <p>You may designate an authorized agent to make a CCPA request on your behalf. We will require written proof of the agent&apos;s authorization and may verify your identity directly.</p>
            </SubSection>
          </Section>

          <Section title="9. Categories of Personal Information Collected (CCPA Disclosure)">
            <p>In the past 12 months we have collected the following categories of personal information as defined by the CCPA:</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-white/60 border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-head font-bold text-white/50 uppercase tracking-wider">Category</th>
                    <th className="text-left py-2 pr-4 font-head font-bold text-white/50 uppercase tracking-wider">Examples</th>
                    <th className="text-left py-2 font-head font-bold text-white/50 uppercase tracking-wider">Collected?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['Identifiers', 'Name, email, IP address', 'Yes'],
                    ['Personal records', 'Account profile, billing info', 'Yes'],
                    ['Protected characteristics', 'None intentionally collected', 'No'],
                    ['Commercial info', 'Subscription history', 'Yes'],
                    ['Internet/network activity', 'Usage logs, session data', 'Yes'],
                    ['Geolocation data', 'Approximate location (IP-derived)', 'Yes'],
                    ['Inferences', 'Housing preferences', 'Yes'],
                    ['Sensitive personal info', 'Account credentials', 'Yes'],
                  ].map(([cat, ex, col]) => (
                    <tr key={cat}>
                      <td className="py-2 pr-4 text-white/70">{cat}</td>
                      <td className="py-2 pr-4">{ex}</td>
                      <td className="py-2">{col}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy periodically. We will notify you of material changes by posting the revised policy on this page and updating the effective date. Your continued use of the Platform after changes take effect constitutes acceptance of the revised policy.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>For privacy-related inquiries or to exercise your rights, please contact:</p>
            <address className="not-italic mt-2 text-white/50">
              UTenancy, Inc. — Privacy Team<br />
              Los Angeles, California<br />
              <a href="mailto:privacy@utenancy.com" className="text-sand hover:underline">privacy@utenancy.com</a>
            </address>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6">
          <Link href="/legal/terms" className="font-body text-white/40 text-xs hover:text-white/70 transition-colors">Terms of Service</Link>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="font-head font-semibold text-white/70 text-sm mb-1">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
