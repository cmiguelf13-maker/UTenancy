export interface BlogPost {
  slug: string
  tag: string
  title: string
  excerpt: string
  date: string
  readTime: string
  metaDescription: string
  content: string
}

export const POSTS: BlogPost[] = [
  {
    slug: 'how-to-find-off-campus-housing-los-angeles',
    tag: 'For Students',
    title: '5 Things to Look for When Finding Off-Campus Housing in Los Angeles',
    excerpt:
      'Moving off campus in LA is exciting — but the rental market moves fast. Here\'s what to check before you sign anything.',
    date: 'March 12, 2025',
    readTime: '6 min read',
    metaDescription:
      'Looking for off-campus housing in Los Angeles? Learn the 5 most important things to check before signing a lease — from proximity to campus to hidden fees.',
    content: `
<p>Finding off-campus housing in Los Angeles is one of the biggest decisions you'll make as a student. Whether you're studying at LMU, USC, UCLA, or another university, the LA rental market is competitive, expensive, and moves fast. Listings that are available today are often gone by tomorrow.</p>

<p>Before you sign anything, here are the five things every student renter should evaluate carefully.</p>

<h2>1. Distance and Commute — Not Just Miles, But Minutes</h2>

<p>In Los Angeles, a 3-mile commute can take 5 minutes or 45 minutes depending on traffic and time of day. Don't just look at the map — think about how you'll actually get there.</p>

<ul>
  <li><strong>Do you have a car?</strong> If yes, check parking costs at the apartment (many buildings charge $100–$200/month extra) and whether parking is available on campus.</li>
  <li><strong>No car?</strong> Check proximity to the Metro E Line (Expo), bus routes, or bikeable paths. LMU is close to the Westside; USC is near the Expo/Vermont station.</li>
  <li><strong>Early classes?</strong> Test the commute during rush hour, not a quiet Sunday afternoon.</li>
</ul>

<p>A 20-minute door-to-door commute is the sweet spot for most students. Beyond 40 minutes each way, commute fatigue becomes a real academic cost.</p>

<h2>2. What's Actually Included in the Rent</h2>

<p>Landlords in LA are creative about what "rent" means. The number you see advertised is often just the starting point. Before you compare two listings, make sure you're comparing apples to apples:</p>

<ul>
  <li><strong>Utilities:</strong> Are water, gas, and electricity included? A $1,200/month room with utilities included may be cheaper than a $1,050 room where you're paying $200/month in utilities.</li>
  <li><strong>Laundry:</strong> In-unit vs. shared coin-op laundry adds up. Budget $40–$80/month for a laundromat if there's no on-site option.</li>
  <li><strong>Internet:</strong> Some buildings include it; others don't. A dedicated student line runs $40–$70/month.</li>
  <li><strong>Parking:</strong> Already mentioned, but worth repeating — always ask.</li>
  <li><strong>Renter's insurance:</strong> Some landlords require it. It's cheap ($10–$20/month) but adds to the total cost.</li>
</ul>

<h2>3. Lease Flexibility for the Academic Calendar</h2>

<p>Most standard LA leases are 12 months. But as a student, you may need to leave in May, come back in August, or go home for winter break. Ask about:</p>

<ul>
  <li><strong>Lease start and end dates:</strong> Can you start in August instead of the first of the month? Can the lease end in May?</li>
  <li><strong>Subletting:</strong> Is it allowed if you leave for a semester or study abroad?</li>
  <li><strong>Month-to-month after the initial term:</strong> What happens when the lease ends? Month-to-month usually comes at a premium but gives you flexibility.</li>
  <li><strong>Early termination:</strong> What's the penalty if you need to leave early?</li>
</ul>

<p>Student-friendly landlords — especially those who list on platforms like UTenancy — are often more experienced with these needs and more willing to accommodate academic timelines.</p>

<h2>4. The Condition of the Unit (and How to Document It)</h2>

<p>Before you hand over a security deposit, document everything. California law gives landlords 21 days to return your deposit — and they can deduct for damages. Protect yourself:</p>

<ul>
  <li>Walk through the unit and photograph every scratch, stain, and scuff before you move in.</li>
  <li>Test every outlet, the stove, the refrigerator, and all faucets.</li>
  <li>Check for signs of mold (especially in bathrooms and near windows in older buildings).</li>
  <li>Look at the water heater age — older units mean cold showers and higher gas bills.</li>
  <li>Email your landlord a move-in checklist with your photos attached. That email timestamp is your legal protection.</li>
</ul>

<h2>5. The Neighborhood at Night</h2>

<p>Visit the apartment or neighborhood you're considering at night, not just during a Saturday afternoon open house. Things to observe:</p>

<ul>
  <li>Is there good street lighting on your walk from the parking spot or bus stop?</li>
  <li>How noisy is it? (Bars, clubs, and busy streets affect sleep.)</li>
  <li>Is parking on the street safe at night?</li>
  <li>What's the vibe of neighbors — are there other students, young professionals, families?</li>
</ul>

<p>Look up the neighborhood on the LA Crime Map (available through LAPD's online data portal) for reported incidents near the address. It's not about fear — it's about making an informed decision.</p>

<h2>Finding Verified Student Housing in LA</h2>

<p>UTenancy was built specifically to solve the student housing problem in LA. All listings on the platform are from verified landlords, and you can filter by proximity to your university, price, bedroom count, and room type (open room vs. group formation). It's free for students to browse and apply.</p>

<p>If you're an LMU student, check out our dedicated <a href="https://utenancy.com/housing/lmu">student housing guide for LMU</a> — it covers the best neighborhoods, average rent by area, and how to get started. Or <a href="https://utenancy.com/listings">browse all listings</a> and the LA rental market doesn't wait.</p>
    `.trim(),
  },

  {
    slug: 'lease-terms-every-student-should-understand',
    tag: 'Renting 101',
    title: 'Lease Terms Every Student Renter Should Understand',
    excerpt:
      'Signing a lease is a legal commitment. These are the clauses that trip up first-time renters most — and what they actually mean.',
    date: 'February 28, 2025',
    readTime: '7 min read',
    metaDescription:
      'First time renting? These are the lease terms and clauses students most commonly misunderstand — explained in plain English before you sign.',
    content: `
<p>Most students sign their first lease without fully understanding what they're agreeing to. That's understandable — leases are written by lawyers, not renters. But a lease is a binding legal contract, and what's in it determines your rights and responsibilities for the next 12 months (or longer).</p>

<p>Here's a plain-English breakdown of the terms that matter most.</p>

<h2>Security Deposit</h2>

<p>A security deposit is money you give the landlord upfront — typically one to two months' rent — that they hold in case you cause damage or skip out on rent. In California:</p>

<ul>
  <li>The maximum deposit is <strong>two months' rent</strong> for unfurnished units and three months for furnished ones.</li>
  <li>The landlord must return it within <strong>21 days</strong> of you moving out, with an itemized list of any deductions.</li>
  <li>Normal wear and tear (scuffs, minor carpet wear, faded paint) <strong>cannot</strong> be deducted. Only actual damage can.</li>
  <li>Always document your move-in condition in writing and photos — this is your protection.</li>
</ul>

<h2>Joint and Several Liability</h2>

<p>This is the most misunderstood clause in a roommate lease. "Joint and several" means that <strong>each tenant is individually responsible for the entire rent</strong>, not just their share.</p>

<p>Example: You share a 3-bedroom with two roommates. One roommate stops paying. You are legally on the hook for their portion too. The landlord can come after any one of you for the full amount.</p>

<p>This is why choosing trustworthy roommates matters. It's also why some students prefer open-room arrangements, where you rent a bedroom and the landlord manages each tenant individually.</p>

<h2>Rent Due Date and Grace Period</h2>

<p>Most leases specify that rent is due on the first of the month. California law allows landlords to charge a late fee after a grace period — and many leases include a 3-to-5 day grace period before fees kick in. Read your lease carefully:</p>

<ul>
  <li>What is the late fee? (Common: $50–$100 or 5% of monthly rent)</li>
  <li>Is there a grace period, or is it due strictly on the first?</li>
  <li>Can you pay online, or must you mail a check?</li>
</ul>

<h2>Subletting</h2>

<p>Subletting means temporarily renting your unit (or your room) to someone else while you're away. As a student, this matters — study abroad, internships, and long breaks can leave you paying for a room you're not using.</p>

<p>Many leases prohibit subletting entirely. Some allow it with landlord approval. A few are flexible. Always ask before you sign — and get the answer in writing.</p>

<h2>Lease Renewal and Month-to-Month Terms</h2>

<p>What happens when your lease ends? Leases usually include one of three outcomes:</p>

<ul>
  <li><strong>Auto-renewal:</strong> The lease automatically renews for another year unless you give notice (often 30–60 days before expiration). Missing this window means you're locked in.</li>
  <li><strong>Month-to-month:</strong> After the initial term, you continue on a month-to-month basis. More flexible, but the landlord can raise rent with 30-day notice.</li>
  <li><strong>End and vacate:</strong> The landlord expects you to leave when the term ends. You'll need to negotiate a new lease or find a new place.</li>
</ul>

<h2>Maintenance and Repairs</h2>

<p>California tenants have the right to a habitable unit — meaning working heat, hot water, secure windows and doors, and no significant pest infestations. If something breaks:</p>

<ul>
  <li>Report it to your landlord in writing (text or email with a timestamp).</li>
  <li>Landlords are generally required to make repairs within a reasonable time (30 days is the benchmark for non-emergency issues).</li>
  <li>For emergencies (no heat, broken plumbing), repairs must happen within 24–48 hours.</li>
</ul>

<p>Your lease may specify how to submit maintenance requests. Follow the process so there's a paper trail.</p>

<h2>Early Termination</h2>

<p>Life happens — you might need to leave before your lease ends. Early termination clauses specify the penalty, which typically is:</p>

<ul>
  <li>Forfeiture of your security deposit</li>
  <li>Payment of rent through the end of the lease (or until a new tenant is found)</li>
  <li>A flat early termination fee (often 1–2 months' rent)</li>
</ul>

<p>California law does require landlords to make a good-faith effort to re-rent the unit after you leave — they can't just let it sit empty and charge you for every remaining month. But early termination is still expensive. Know the terms before you sign.</p>

<h2>No-Pets Clause</h2>

<p>If there's a no-pets clause and you bring a pet, the landlord can evict you and charge cleaning fees from your deposit. "Emotional support animals" are a different category under fair housing law — they're not pets — but you need documentation and must notify your landlord in advance.</p>

<h2>The Bottom Line</h2>

<p>Read your lease before you sign it. If something is confusing, ask the landlord to explain it in writing. If something is important to you (subletting, early termination, pets), negotiate it before signing — not after. Once it's signed, both parties are bound by it.</p>

<p>UTenancy listings come from verified landlords and often include lease term details upfront — so you can filter by flexibility before you even reach out. <a href="https://utenancy.com/listings">Browse all listings</a>, or if you're near LMU, visit our <a href="https://utenancy.com/housing/lmu">LMU housing guide</a> for neighborhood-specific advice.</p>
    `.trim(),
  },

  {
    slug: 'how-to-attract-student-tenants-landlord-guide',
    tag: 'For Landlords',
    title: 'How to Attract and Retain Great Student Tenants as a Landlord',
    excerpt:
      'Student tenants get a bad reputation — but the right ones are reliable, respectful, and renew year after year. Here\'s how to find them.',
    date: 'February 10, 2025',
    readTime: '6 min read',
    metaDescription:
      'A landlord guide to attracting quality student tenants near universities in Los Angeles. Learn what students look for, how to screen, and how to reduce turnover.',
    content: `
<p>Student housing has a reputation problem. Mention "student tenants" to some landlords and they picture loud parties, damaged walls, and midnight maintenance calls. But that reputation is largely undeserved — and the landlords who lean into student housing often find it to be some of the most reliable rental income they earn.</p>

<p>Here's how to attract the right student tenants and build a rental relationship that lasts.</p>

<h2>Why Student Housing Is Worth It</h2>

<p>Students near universities like LMU, USC, and UCLA represent a steady, predictable demand. Every fall, thousands of students need housing — regardless of the broader economic conditions. Unlike market-rate tenants whose search is often driven by job changes or life events, student tenants operate on a fixed academic calendar. You know exactly when demand spikes (July–August for fall semester) and when units turn over (May–June).</p>

<p>The best student tenants are also highly motivated to maintain their housing. They're studying hard, building their futures, and — particularly at universities with honor codes or campus conduct rules — have real incentives to be good neighbors.</p>

<h2>What Students Actually Look For in a Rental</h2>

<p>Understanding what drives a student's decision makes it easier to position your property well:</p>

<ul>
  <li><strong>Price, above all.</strong> Students are budget-constrained. Pricing competitively — even $50–$100 below market — often means lower vacancy and less turnover, which nets you more in the long run.</li>
  <li><strong>Proximity to campus.</strong> Walking or biking distance is worth a premium. A 10-minute walk beats a 30-minute bus ride every time.</li>
  <li><strong>Fast internet.</strong> This is non-negotiable. Streaming lectures, video calls, and late-night study sessions make internet quality a hard filter for most students. List your internet speed.</li>
  <li><strong>In-unit or on-site laundry.</strong> It sounds minor, but laundromats are a genuine quality-of-life issue. This is a differentiator that gets listings clicked.</li>
  <li><strong>Furnished or partially furnished.</strong> Students moving out of dorms rarely have furniture. A furnished bedroom — even just a bed, desk, and dresser — can justify higher rent and attract more applications.</li>
  <li><strong>Flexible lease terms.</strong> Academic calendars don't match January 1st. Landlords willing to start leases in August and end them in May or June see much higher demand from students.</li>
</ul>

<h2>How to Screen Student Tenants Effectively</h2>

<p>Students often lack rental history and may not have independent income. That's not a red flag — it's normal. Adjust your screening accordingly:</p>

<ul>
  <li><strong>Accept a co-signer (guarantor).</strong> Most student leases include a parent or guardian as a co-signer, giving you a creditworthy party on the hook for the rent. This is standard practice in student housing markets.</li>
  <li><strong>Verify enrollment.</strong> A current student ID or enrollment verification letter confirms they're actually enrolled and not just nearby.</li>
  <li><strong>Check references from RAs, professors, or previous landlords.</strong> A letter from a Resident Advisor or a previous housing provider is often more informative than a credit score.</li>
  <li><strong>Meet them.</strong> A brief video or in-person conversation tells you a lot. Are they thoughtful? Do they ask good questions about the lease? Are they organized?</li>
</ul>

<h2>Setting Clear Expectations Upfront</h2>

<p>The landlord-tenant relationships that go badly usually do so because expectations weren't set clearly at the start. Be explicit about:</p>

<ul>
  <li>Quiet hours and guest policies</li>
  <li>How maintenance requests should be submitted</li>
  <li>What happens if rent is late</li>
  <li>Move-in and move-out procedures (and how deposits are handled)</li>
</ul>

<p>A well-organized move-in checklist, a clear lease, and a brief orientation to the unit go a long way toward a smooth tenancy.</p>

<h2>Reducing Turnover</h2>

<p>The most expensive part of student rentals is turnover — the cleaning, repairs, and vacancy between tenants. Here's how to minimize it:</p>

<ul>
  <li><strong>Reach out 60–90 days before the lease ends</strong> to ask if the tenant wants to renew. Students who are happy stay — they just need to be asked.</li>
  <li><strong>Keep rent increases modest at renewal.</strong> A 3–5% increase retains a proven good tenant. A 15% jump sends them searching — and leaves you with a vacant unit to fill.</li>
  <li><strong>Be responsive to maintenance requests.</strong> Students who feel ignored don't renew. A landlord who fixes things promptly earns loyalty.</li>
</ul>

<h2>Listing on the Right Platform</h2>

<p>Most student tenants in LA are not scrolling Craigslist or Zillow — they're searching platforms built for their needs. UTenancy is built specifically for the student housing market, connecting verified university students with landlords near their campus. Landlord plans include listing management, application review, and direct messaging with prospective tenants.</p>

<p>Join the UTenancy landlord waitlist at <a href="https://utenancy.com">utenancy.com</a> to be among the first to list when the platform opens for landlords in your area.</p>
    `.trim(),
  },

  {
    slug: 'renting-with-roommates-complete-guide',
    tag: 'Renting 101',
    title: 'Renting With Roommates: A Complete Guide for College Students',
    excerpt:
      'Sharing a place cuts your rent — but it comes with real risks if you\'re not careful. Here\'s how to do it right from the start.',
    date: 'January 22, 2025',
    readTime: '8 min read',
    metaDescription:
      'A complete guide to renting with roommates as a college student — from finding compatible roommates and splitting costs to handling conflicts and protecting yourself legally.',
    content: `
<p>Renting with roommates is one of the best financial decisions a student can make. In a city like Los Angeles, splitting a 3-bedroom with two others can cut your housing costs by 50–60% compared to living alone. But roommate situations that start well can fall apart quickly if you're not intentional about how you set them up.</p>

<p>This guide covers everything from finding the right people to share with, to protecting yourself legally, to handling the inevitable friction of shared living.</p>

<h2>Finding Compatible Roommates</h2>

<p>Compatibility is about more than being friends. Some of the worst roommate situations happen between people who genuinely like each other but have incompatible living habits. Before committing to live with someone, discuss:</p>

<ul>
  <li><strong>Sleep schedule:</strong> Night owl vs. early riser creates more conflict than almost anything else.</li>
  <li><strong>Cleanliness standards:</strong> What does "clean" mean to each of you? How often will you clean common areas?</li>
  <li><strong>Guest policies:</strong> How often can partners or friends stay over? For how long?</li>
  <li><strong>Noise levels:</strong> Study hours, music, TV volume — especially during finals.</li>
  <li><strong>Financial reliability:</strong> Are they actually going to pay their share on time, every month?</li>
  <li><strong>Shared vs. separate groceries:</strong> Shared grocery costs can create resentment. Separate is usually cleaner.</li>
</ul>

<p>You can find roommates through UTenancy's group formation feature, your university's housing board, or subreddits like r/LAlist and university-specific pages. Always meet in person (or video call) before agreeing to live together.</p>

<h2>Understanding the Lease Structure</h2>

<p>How you're named on the lease determines your legal exposure:</p>

<h3>All Roommates on the Same Lease</h3>
<p>Everyone signs one lease with the landlord. The advantage: everyone is directly accountable to the landlord. The risk: <strong>joint and several liability</strong> — if one person doesn't pay, the others are legally on the hook for their share. If a roommate ghosts, you may need to cover their rent to avoid eviction.</p>

<h3>One Primary Tenant, Others as Subtenants</h3>
<p>One person signs the lease and subleases to the others. The primary tenant has full liability with the landlord. The subtenants are legally accountable to the primary tenant, not the landlord. This structure concentrates risk on whoever signed the main lease.</p>

<h3>Open-Room / Per-Bedroom Leases</h3>
<p>Each person signs their own individual lease for their bedroom, and the landlord manages each tenant separately. This is the cleanest structure: you're only responsible for your room. UTenancy's "open room" listings work this way — you're applying for a specific bedroom, not the whole unit.</p>

<h2>The Roommate Agreement</h2>

<p>Even if you trust your roommates completely, write a roommate agreement. It doesn't need to be a legal document — a shared Google Doc is fine. Include:</p>

<ul>
  <li>How rent will be split (evenly? by room size?)</li>
  <li>How utilities will be split and who pays the bills</li>
  <li>Shared expenses (cleaning supplies, toilet paper, dish soap)</li>
  <li>Cleaning schedule and responsibilities</li>
  <li>Guest and overnight visitor policies</li>
  <li>Quiet hours</li>
  <li>What happens if someone wants to move out early</li>
  <li>How disputes will be handled</li>
</ul>

<p>This conversation, even if awkward, prevents 90% of roommate conflicts. The other 10% happen anyway — here's how to handle those.</p>

<h2>Splitting Costs Fairly</h2>

<p>Money is the most common source of roommate conflict. A few principles that work:</p>

<ul>
  <li><strong>Rent by room size, not equally.</strong> If one bedroom is noticeably larger or has its own bathroom, the person in that room should pay more. Agree on this before signing the lease.</li>
  <li><strong>Use a shared expense app.</strong> Splitwise, Venmo, or even a shared spreadsheet makes it easy to track who owes what and reduces "I thought you were covering that" moments.</li>
  <li><strong>Pay the landlord together.</strong> Use a shared bank account or agree on a single person who collects and pays. Venmo transfers can bounce or be late; the landlord doesn't care — the rent is due on the first.</li>
  <li><strong>Utilities on auto-pay.</strong> Whoever's name is on the bill shouldn't be floating costs for others. Set up automatic collection from roommates.</li>
</ul>

<h2>Handling Conflict</h2>

<p>Conflict is inevitable in shared living. The difference between roommate situations that work and ones that collapse is how quickly issues get addressed:</p>

<ul>
  <li><strong>Address problems early, directly, and in person.</strong> A passive-aggressive note on the fridge is worse than an awkward 10-minute conversation.</li>
  <li><strong>Assume good intent first.</strong> Most roommate friction comes from different habits, not malice. "I noticed the dishes have been piling up — can we talk about our kitchen routine?" lands better than "You never clean."</li>
  <li><strong>If direct conversation fails,</strong> some universities offer free mediation services through residential life or student affairs. Use them.</li>
  <li><strong>If someone needs to leave early,</strong> decide in advance (ideally in your roommate agreement) what the process is: finding a replacement, splitting the cost of vacancy, etc.</li>
</ul>

<h2>Protecting Yourself When a Roommate Leaves</h2>

<p>When a roommate moves out mid-lease, things can get complicated:</p>

<ul>
  <li>If they're on the lease, the landlord typically needs to agree to remove them — and a replacement may need to be added.</li>
  <li>If they're a subtenant, you (or the primary tenant) need to find someone to fill the spot or cover the cost.</li>
  <li>Clarify how the security deposit will be handled at move-out. If one roommate caused damage, who pays for it?</li>
</ul>

<p>The cleanest solution, when possible, is an open-room lease arrangement where each person's tenancy is independent.</p>

<h2>Finding Roommate-Friendly Listings</h2>

<p>UTenancy has two listing types built specifically for the roommate market: <strong>open rooms</strong> (one vacant bedroom in an existing unit) and <strong>group formations</strong> (a group of students looking to form a household together). Both are verified listings from real landlords near LA universities.</p>

<p>Browse roommate-friendly student housing at <a href="https://utenancy.com/listings">utenancy.com/listings</a>. LMU students can also check our <a href="https://utenancy.com/housing/lmu">neighborhood guide for LMU housing</a> to find the best areas for shared rentals near campus.</p>
    `.trim(),
  },

  {
    slug: 'best-neighborhoods-students-los-angeles',
    tag: 'For Students',
    title: 'The Best Neighborhoods for Students in Los Angeles (Near LMU, USC, and UCLA)',
    excerpt:
      'LA is huge. Where you live matters more than most students realize. Here\'s a neighborhood breakdown for students near the city\'s major universities.',
    date: 'January 8, 2025',
    readTime: '7 min read',
    metaDescription:
      'The best neighborhoods for college students in Los Angeles near LMU, USC, and UCLA — with rent ranges, commute times, and what makes each area great for student life.',
    content: `
<p>Los Angeles is one of the most geographically spread-out cities in the country. Where you live isn't just about your apartment — it determines your commute, your social life, your grocery options, your safety, and ultimately how much you enjoy your time as a student. The right neighborhood can make LA feel manageable. The wrong one can make it exhausting.</p>

<p>Here's a breakdown of the best neighborhoods for students near LA's major universities.</p>

<h2>Near LMU (Loyola Marymount University)</h2>

<p>LMU sits on a bluff in Westchester, a quiet residential neighborhood near LAX. The campus is self-contained, which means most LMU students live in a radius between Westchester, Playa Vista, and Culver City.</p>

<h3>Playa Vista</h3>
<p><strong>Best for:</strong> Students who want newer construction and a walkable, tech-neighborhood feel<br/>
<strong>Typical rent:</strong> $1,400–$1,900/bedroom<br/>
<strong>Commute to LMU:</strong> 5–15 min by car or bike<br/>
<strong>Highlights:</strong> Safe, well-lit, close to the Howard Hughes Center for dining and shopping. Popular with LMU students and young professionals. The Ballona Creek bike path connects Playa Vista to other Westside neighborhoods.</p>

<h3>Culver City</h3>
<p><strong>Best for:</strong> Students who want a vibrant dining and arts scene with good transit options<br/>
<strong>Typical rent:</strong> $1,200–$1,700/bedroom<br/>
<strong>Commute to LMU:</strong> 15–25 min by car<br/>
<strong>Highlights:</strong> Culver City has a genuine neighborhood feel with excellent restaurants, the Expo Line Metro (connecting to downtown and Santa Monica), and a growing creative scene. Downtown Culver City is walkable and lively.</p>

<h3>Westchester</h3>
<p><strong>Best for:</strong> Students on a tighter budget who want to walk to campus<br/>
<strong>Typical rent:</strong> $1,000–$1,500/bedroom<br/>
<strong>Commute to LMU:</strong> 5–10 min walk or bike<br/>
<strong>Highlights:</strong> Closest neighborhood to campus. Quieter and more suburban than Playa Vista, but very convenient. Rent is lower than nearby beach-adjacent areas.</p>

<h2>Near USC (University of Southern California)</h2>

<p>USC's University Park campus is in South Los Angeles, surrounded by a mix of student-focused housing and long-standing residential neighborhoods. USC has significantly invested in the surrounding area, and popular student neighborhoods extend north and west of campus.</p>

<h3>University Park / Exposition Park</h3>
<p><strong>Best for:</strong> Students who want to walk to class and maximize their budget<br/>
<strong>Typical rent:</strong> $900–$1,400/bedroom<br/>
<strong>Commute to USC:</strong> 5–15 min walk<br/>
<strong>Highlights:</strong> The highest density of student housing in any USC-adjacent area. Many properties are specifically built for or marketed to students. The Natural History Museum and Exposition Park are walkable.</p>

<h3>Koreatown</h3>
<p><strong>Best for:</strong> Students who want proximity to campus without being in the student-heavy bubble<br/>
<strong>Typical rent:</strong> $1,000–$1,500/bedroom<br/>
<strong>Commute to USC:</strong> 15–25 min by Metro or car<br/>
<strong>Highlights:</strong> K-Town has excellent 24-hour dining, multiple Metro Purple and Red Line stops, and a more urban feel. Slightly farther from campus but great transit access and more affordable than westside neighborhoods.</p>

<h3>Los Feliz / Silver Lake</h3>
<p><strong>Best for:</strong> Upperclassmen or graduate students who want LA culture and transit without paying westside prices<br/>
<strong>Typical rent:</strong> $1,100–$1,600/bedroom<br/>
<strong>Commute to USC:</strong> 25–40 min by Metro or car<br/>
<strong>Highlights:</strong> Trendy, walkable, excellent dining and coffee culture. The Sunset Junction area and Los Feliz Village are vibrant. Not ideal for first-year students who need to be close to campus.</p>

<h2>Near UCLA (University of California, Los Angeles)</h2>

<p>UCLA's Westwood campus is surrounded by some of the most expensive real estate in Los Angeles. Student-heavy neighborhoods radiate outward from campus, with most affordable options a short bus or bike ride away.</p>

<h3>Westwood</h3>
<p><strong>Best for:</strong> Students who want to walk to campus and live in a classic college-town atmosphere<br/>
<strong>Typical rent:</strong> $1,500–$2,200/bedroom<br/>
<strong>Commute to UCLA:</strong> 5–20 min walk<br/>
<strong>Highlights:</strong> The neighborhood immediately surrounding UCLA is dense with student housing, coffee shops, restaurants, and the Westwood Village retail area. Expensive but extremely convenient.</p>

<h3>Palms / Mar Vista</h3>
<p><strong>Best for:</strong> Students who want more space and lower rent without a brutal commute<br/>
<strong>Typical rent:</strong> $1,100–$1,600/bedroom<br/>
<strong>Commute to UCLA:</strong> 15–25 min by bus or car<br/>
<strong>Highlights:</strong> Palms and Mar Vista are popular student neighborhoods south of Westwood with more affordable rents, larger apartments, and easy Big Blue Bus access to UCLA. A good middle ground between price and location.</p>

<h3>Santa Monica</h3>
<p><strong>Best for:</strong> Students who prioritize lifestyle and don't mind a slightly longer commute<br/>
<strong>Typical rent:</strong> $1,400–$2,000/bedroom<br/>
<strong>Commute to UCLA:</strong> 20–35 min by Big Blue Bus or car<br/>
<strong>Highlights:</strong> Ocean access, the Third Street Promenade, excellent food, and a very livable neighborhood. Pricier than Palms but many UCLA students think it's worth it. The Big Blue Bus Line 1 runs directly to campus.</p>

<h2>How to Use This When Searching</h2>

<p>UTenancy lets you filter listings by proximity to your university — so you can see exactly how far each property is from your campus in miles, and sort by price. You don't need to know every neighborhood in advance; just browse by university and let the distance filter do the work.</p>

<p>Start exploring student-verified listings near your campus at <a href="https://utenancy.com">utenancy.com</a>.</p>
    `.trim(),
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
