import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'User Agreement | UTenancy',
  description: 'UTenancy User Agreement — role-specific rules and responsibilities for students and landlords on the platform.',
}

const EFFECTIVE_DATE = 'April 8, 2025'

export default function UserAgreementPage() {
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
            User <em className="text-sand">Agreement</em>
          </h1>
          <p className="font-body text-white/40 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>

        {/* Body */}
        <div className="space-y-10 font-body text-white/70 leading-relaxed text-sm">

          <section>
            <p>
              This User Agreement (&quot;Agreement&quot;) supplements the UTenancy <Link href="/legal/terms" className="text-sand hover:underline">Terms of Service</Link> and <Link href="/legal/privacy" className="text-sand hover:underline">Privacy Policy</Link>. It sets out the specific responsibilities, conduct standards, and platform rules applicable to each type of user — Students and Landlords — when using UTenancy. By creating an account and selecting a user role, you agree to the role-specific provisions below in addition to the general Terms of Service.
            </p>
          </section>

          <Section title="1. General Conduct">
            <p>All users, regardless of role, agree to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
              <li>Treat all other Platform users with respect and dignity.</li>
              <li>Provide accurate, truthful information in their profiles and communications.</li>
              <li>Use the Platform only for its intended purpose of facilitating student housing connections.</li>
              <li>Refrain from posting or sending harassing, abusive, threatening, defamatory, or discriminatory content.</li>
              <li>Comply with all applicable federal, state, and local laws, including fair housing laws.</li>
              <li>Not share their account credentials or allow others to access their account.</li>
            </ul>
          </Section>

          <Section title="2. Student-Specific Terms">
            <SubSection title="a) Verification and Eligibility">
              <p>Students must register with a valid .edu email address or otherwise verify current enrollment at a recognized university. Providing false enrollment information is a material breach of this Agreement and may result in immediate account termination.</p>
            </SubSection>

            <SubSection title="b) Profile and Preferences">
              <p>Students are responsible for maintaining an accurate profile, including lifestyle preferences used for matching purposes. UTenancy uses this information to surface relevant listings and potential roommate matches. We do not guarantee any specific matches or listing availability.</p>
            </SubSection>

            <SubSection title="c) Communication with Landlords">
              <p>When a student expresses interest in a listing, their contact information (as provided in their profile) may be shared with the listing landlord. Students are responsible for exercising due diligence before engaging in any off-platform communication or entering into any rental agreement.</p>
            </SubSection>

            <SubSection title="d) No Rental Guarantee">
              <p>UTenancy facilitates connections between students and landlords but is not a party to any rental transaction. We do not guarantee that any listing will remain available, that a landlord will accept an application, or that any housing arrangement will be completed. Students should independently verify all listing details before signing any rental agreement.</p>
            </SubSection>

            <SubSection title="e) Safe Practices">
              <p>UTenancy strongly recommends that students:</p>
              <ul className="list-disc list-inside space-y-1 mt-1 text-white/60">
                <li>Tour properties in person before committing.</li>
                <li>Never send payment (deposits, rent) before signing a written lease.</li>
                <li>Verify the landlord&apos;s identity and ownership of the property.</li>
                <li>Report suspicious listings or behavior using the in-platform reporting tools or by emailing <a href="mailto:support@utenancy.com" className="text-sand hover:underline">support@utenancy.com</a>.</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="3. Landlord-Specific Terms">
            <SubSection title="a) Account and Identity Verification">
              <p>Landlords must provide accurate contact and property ownership information. UTenancy may, at its discretion, require identity or ownership verification documents before activating listings. Failure to provide accurate information is a material breach of this Agreement.</p>
            </SubSection>

            <SubSection title="b) Listing Accuracy">
              <p>Landlords are solely responsible for the accuracy, completeness, and legality of all listing content. Listings must:</p>
              <ul className="list-disc list-inside space-y-1 mt-1 text-white/60">
                <li>Accurately represent the property&apos;s condition, amenities, price, and availability.</li>
                <li>Include only original photos or photos for which the landlord holds the right to use.</li>
                <li>Be updated promptly if the property becomes unavailable, is rented, or if material details change.</li>
                <li>Comply with all applicable local rental licensing, zoning, and disclosure requirements.</li>
              </ul>
            </SubSection>

            <SubSection title="c) Non-Discrimination">
              <p>Landlords must comply with the Federal Fair Housing Act, the California Fair Employment and Housing Act (FEHA), and all applicable local fair housing ordinances. Listings and communications must not discriminate against any person on the basis of race, color, national origin, religion, sex, familial status, disability, sexual orientation, gender identity, source of income, or any other characteristic protected by law. Violation of fair housing laws is a material breach of this Agreement and may result in immediate removal from the Platform and referral to relevant authorities.</p>
            </SubSection>

            <SubSection title="d) Student Data Usage">
              <p>Landlords who receive student contact information through the Platform agree to use it solely to respond to housing inquiries. Landlords may not use student information for unsolicited marketing, share it with third parties, or use it for any purpose other than the specific housing transaction facilitated through the Platform.</p>
            </SubSection>

            <SubSection title="e) Dashboard and SaaS Features">
              <p>Access to the UTenancy landlord dashboard and SaaS tools is subject to applicable subscription fees and the Platform&apos;s acceptable use policies. Landlords agree not to share dashboard access with unauthorized parties or attempt to circumvent usage limits.</p>
            </SubSection>

            <SubSection title="f) Listing Status">
              <p>Listings may be in &quot;active&quot; or &quot;draft&quot; status. Active listings are publicly visible to students. Landlords are responsible for ensuring active listings are current and available. UTenancy reserves the right to convert any listing to draft or remove it if it violates Platform policies.</p>
            </SubSection>
          </Section>

          <Section title="4. Messaging System">
            <p>The in-Platform messaging system is provided to facilitate communication between students and landlords regarding listed properties. Users agree not to use the messaging system to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
              <li>Send spam, promotional content, or irrelevant communications.</li>
              <li>Harass, threaten, or intimidate other users.</li>
              <li>Request or share personal financial information such as full credit card or bank account numbers.</li>
              <li>Solicit payment outside of an established and verified rental agreement.</li>
            </ul>
            <p className="mt-3">UTenancy may monitor messages to detect fraud, abuse, and policy violations. Please see our <Link href="/legal/privacy" className="text-sand hover:underline">Privacy Policy</Link> for details on how message data is handled.</p>
          </Section>

          <Section title="5. Reporting and Enforcement">
            <p>Users may report violations of this Agreement by contacting <a href="mailto:support@utenancy.com" className="text-sand hover:underline">support@utenancy.com</a>. UTenancy will investigate reported violations and may take action including warnings, listing removal, account suspension, or permanent termination, at our sole discretion. We are not obligated to take action on every report, and our enforcement decisions are final.</p>
          </Section>

          <Section title="6. Amendments">
            <p>UTenancy may amend this Agreement from time to time. We will notify you of material changes by posting the revised Agreement on this page and updating the effective date. Continued use of the Platform after changes become effective constitutes your acceptance of the revised Agreement.</p>
          </Section>

          <Section title="7. Governing Law">
            <p>This Agreement is governed by and construed in accordance with the laws of the State of California without regard to its conflict-of-law provisions. All disputes arising under this Agreement are subject to the exclusive jurisdiction of courts in Los Angeles County, California.</p>
          </Section>

          <Section title="8. Contact">
            <p>Questions about this Agreement may be directed to:</p>
            <address className="not-italic mt-2 text-white/50">
              UTenancy, Inc.<br />
              Los Angeles, California<br />
              <a href="mailto:legal@utenancy.com" className="text-sand hover:underline">legal@utenancy.com</a>
            </address>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6">
          <Link href="/legal/terms" className="font-body text-white/40 text-xs hover:text-white/70 transition-colors">Terms of Service</Link>
          <Link href="/legal/privacy" className="font-body text-white/40 text-xs hover:text-white/70 transition-colors">Privacy Policy</Link>
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
