# Web Presence Plan

**Status:** IN PROGRESS
**Created:** 2025-12-12
**Updated:** 2026-01-03
**Priority:** Execute after PR #76 is merged

---

## Progress Update (2026-01-03)

### ✅ Completed
- Created GitHub repository: `p2p4vsc.com`
- Created GitHub repository: `g2t.cc`
- Created GitHub repository: `cov.llc` (Note: Business name is "Coven LLC", domain is `cov.llc`)
- Designed structure for `appliedmedia/.github` (org-wide infrastructure repo)
- Created automation script: `scripts/enable-github-pages.sh`
- **NOTE:** This plan will be moved to `appliedmedia/.github/docs/plans/` once that repo is created

### 🔄 Next Actions (Priority Order)

1. **Create the `appliedmedia/.github` repository**
   - Run: `gh repo create appliedmedia/.github --public`
   - This is a special GitHub org repository for infrastructure
   - See full setup instructions at the end of this document

2. **Populate the `.github` repository**
   - Add the automation script and documentation
   - Files are prepared in `/tmp/appliedmedia-github/` on the agent machine
   - Follow the SETUP.md instructions

3. **Run the automation script to enable GitHub Pages**
   - Clone `appliedmedia/.github` repository  
   - Run: `./scripts/enable-github-pages.sh`
   - Script will enable GitHub Pages and create CNAME files for all three repos

2. **Configure DNS for all domains**
   - Point `p2p4vsc.com` A records to GitHub Pages IPs
   - Point `g2t.cc` A records to GitHub Pages IPs
   - Point `cov.llc` A records to GitHub Pages IPs
   - GitHub Pages IPs: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153

3. **Create minimal landing pages**
   - Build simple `index.html` for each site
   - Start with basic structure: hero section + trust messaging + CTA
   - Apply consistent Applied Media branding

4. **Set up mailing list (Mailchimp)**
   - Create Mailchimp account
   - Create audience: "Applied Media Software Updates"
   - Generate embed code for both software sites

5. **Configure domain redirects** (After main domains work)
   - Set up DNS redirects for `.info`, `.dev`, `.support` domains (if owned)

### 📋 Tracking Phase Completion

**Phase 1: Decisions & Preparation**
- [x] Platform Decisions: Confirmed GitHub Pages for all three sites
- [x] Domain Inventory: Repos created for `p2p4vsc.com`, `g2t.cc`, `cov.llc`
- [x] Infrastructure Design: Designed `appliedmedia/.github` structure for org-wide resources
- [ ] Create `appliedmedia/.github` repository
- [ ] Approve Plan & Budget: ~$90-160/year for domains
- [ ] Mailing List: Create Mailchimp account

**Phase 2: Repository & Domain Setup**
- [x] Create Repo `p2p4vsc.com`
- [x] Create Repo `g2t.cc`
- [x] Create Repo `cov.llc`
- [x] Create automation script `enable-github-pages.sh`
- [ ] Create and populate `appliedmedia/.github` repo
- [ ] Run script to enable GitHub Pages on all three repos
- [ ] Run script to add CNAME files to each repo
- [ ] DNS Configuration (Primary): Point A records to GitHub Pages IPs
- [ ] DNS Configuration (Redirects): Configure `.info`, `.dev`, `.support` if domains owned

**Phase 3-5:** Not yet started

---

## Execution Plan

### Phase 1: Decisions & Preparation

- [x] **Platform Decisions:** Confirmed GitHub Pages for all three sites.
- [x] **Domain Inventory:** Repos created for `p2p4vsc.com`, `g2t.cc`, `cov.llc`.
- [ ] **Approve Plan & Budget:** Confirm ~$90-160/year budget for domains.
- [ ] **Mailing List:** Create Mailchimp account (Free Tier).

### Phase 2: Repository & Domain Setup (One-to-One)

- [x] **Create Repo `p2p4vsc.com`:** Repository created.
- [x] **Create Repo `g2t.cc`:** Repository created.
- [x] **Create Repo `cov.llc`:** Repository created (Note: Business name is "Coven LLC").
- [ ] **Enable GitHub Pages:** Configure GitHub Pages in repo settings for all three.
- [ ] **Add CNAME files:** Add CNAME file with domain name to each repo.
- [ ] **DNS Configuration (Primary):** Point A records for all 3 domains to GitHub Pages IPs.
- [ ] **DNS Configuration (Redirects):** Configure `.info`, `.dev`, `.support` redirects in DNS provider (if domains owned).

### Phase 3: Content & Assets

- [ ] **Visual Identity:** Create Applied Media logo and consistent favicon.
- [ ] **Copywriting (cov.llc):** Draft bio, services, and contact info.
- [ ] **Copywriting (p2p4vsc):** Draft landing page, installation steps, and features.
- [ ] **Copywriting (g2t):** Draft landing page, usage guide, and trust messaging.
- [ ] **Media:** Capture screenshots and record workflow GIFs for both extensions.

### Phase 4: Implementation

- [ ] **Develop `cov.llc`:** Build simple static site (bio + contact). Deploy.
- [ ] **Develop `p2p4vsc.com`:** Build marketing site + docs. Integrate Mailchimp. Deploy.
- [ ] **Develop `g2t.cc`:** Build marketing site + docs. Integrate Mailchimp. Deploy.
- [ ] **Cross-Linking:** Ensure all sites link to "Applied Media" and each other where appropriate.

### Phase 5: Launch & Updates

- [ ] **Verification:** Test SSL, redirects, and form submissions on all sites.
- [ ] **Update Metadata:** Update `package.json` and `manifest.json` homepage fields.
- [ ] **Update Listings:** Update VS Code Marketplace and Chrome Web Store profiles.
- [ ] **Announce:** Send welcome email to any initial subscribers.

---

## Overview

Establish professional web presence for three Applied Media initiatives:

1. **Print2Paper4VSCode (p2p4vsc)** - VS Code extension for printing code with syntax highlighting
2. **gmail2trello (g2t)** - Chrome extension for converting Gmail threads to Trello cards
3. **cov.llc** - Primary site for fractional CTO consulting work

Each project gets:

- Clear domain structure
- Professional landing page with trust/transparency messaging
- Applied Media branding where appropriate
- Email signup for future updates (software projects)
- Contact/Lead generation (consulting)

---

## Repository Strategy

### Decision: One-to-One Mapping (One Repository per Website)

We will create **separate repositories** for the web hosting (e.g., `p2p4vsc.com`, `g2t.cc`, `cov.llc`).

**Why?**

1. **GitHub Pages Limitation:** GitHub Pages allows only **one custom domain per repository**. You cannot map `p2p4vsc.com` and `g2t.cc` to the same repo without complex workarounds.
2. **Decoupling:** Keeps marketing content (HTML/CSS) separate from application code. This prevents the main extension repos from being cluttered with website assets.
3. **Clarity:** Naming the repo after the domain (e.g., `p2p4vsc.com`) makes the mapping obvious.

**Proposed Repos:**

1. `appliedmedia/p2p4vsc.com` ✅ Created (Source for [https://p2p4vsc.com](https://p2p4vsc.com))
2. `appliedmedia/g2t.cc` ✅ Created (Source for [https://g2t.cc](https://g2t.cc))
3. `appliedmedia/cov.llc` ✅ Created (Source for [https://cov.llc](https://cov.llc))

**Note:** Business name is "Coven LLC", domain is `cov.llc`.

**Alternative Considered: `docs/` folder in existing Extension Repos**

- **Pros:** fewer repos to manage.
- **Cons:**
  - **Branch bloat:** Marketing assets (images, videos) bloat the extension repo size.
  - **Release Cycle:** Website updates shouldn't require touching the extension code or triggering CI/CD pipelines for the extension.
  - **Domain Mapping:** GitHub Pages on `main` branch usually publishes to `username.github.io/repo-name`. While custom domains work, managing 3 distinct custom domains (com, cc, llc) is cleaner with 3 distinct repos.
  - **Access Control:** You might want a designer or content writer to edit the site without giving them commit access to the extension source code.

---

## Domain Structure

### Print2Paper4VSCode Domains

**p2p4vsc.com** - Main Marketing Website

- **Purpose:** Professional landing page and marketing site
- **Repo:** `appliedmedia/p2p4vsc.com`
- **User Action:** Point DNS to GitHub Pages

**p2p4vsc.info** - VS Code Marketplace Redirect

- **Purpose:** Direct link to VS Code Marketplace extension listing
- **Target:** `https://marketplace.visualstudio.com/items?itemName=acoven.print2paper4vscode`
- **Benefit:** Easy-to-remember install URL for users
- **User Action:** Configure DNS redirect

**p2p4vsc.dev** - Developer Documentation

- **Purpose:** Direct link to GitHub repository and technical docs
- **Target:** `https://github.com/appliedmedia/print2paper4vscode`
- **Content:** README, code, issues, pull requests
- **User Action:** Configure DNS redirect

**p2p4vsc.support** - Support Portal

- **Purpose:** Easy-to-remember support entry point
- **Target:** `https://github.com/appliedmedia/print2paper4vscode/issues/new`
- **Benefit:** Non-technical users don't need to navigate GitHub
- **User Action:** Configure DNS redirect

---

### gmail2trello Domains

**g2t.cc** - Main Marketing Website

- **Purpose:** Professional landing page and marketing site
- **Repo:** `appliedmedia/g2t.cc`
- **User Action:** Point DNS to GitHub Pages

**g2t.info** - Chrome Web Store Redirect

- **Purpose:** Direct link to Chrome Web Store extension listing
- **Target:** Chrome Web Store URL for gmail2trello
- **Benefit:** Easy-to-remember install URL
- **User Action:** Configure DNS redirect

**g2t.dev** - Developer Documentation

- **Purpose:** Direct link to GitHub repository
- **Target:** `https://github.com/appliedmedia/gmail2trello` (or actual repo URL)
- **Content:** README, code, issues, pull requests
- **User Action:** Configure DNS redirect

**g2t.support** - Support Portal

- **Purpose:** Support entry point
- **Target:** GitHub issues page for gmail2trello
- **User Action:** Configure DNS redirect

---

### Consulting Domain

**cov.llc** - Fractional CTO Consulting

- **Purpose:** Primary site for fractional CTO work
- **Repo:** `appliedmedia/cov.llc`
- **Platform:** GitHub Pages
- **Content:** Professional profile, services, case studies, contact form
- **User Action:** Point DNS to GitHub Pages

---

## Website Pages

### Print2Paper4VSCode Pages

#### Page 1: Landing Page (p2p4vsc.com)

##### Key Messages

**Hero Section:**

```text
Print Code. Trust the Source.

Sometimes you need code on paper. Whether it's reviewing algorithms
away from screens, annotating for team reviews, or archiving critical
snippets—Print2Paper4VSCode makes it simple and safe.
```

**Trust & Transparency:**

- ⚠️ **Security Story:** Reference [real incident of malicious VSCode extensions removed from marketplace](https://www.bleepingcomputer.com/news/security/microsoft-finds-dozens-of-malicious-vs-code-extensions/)
- ✅ **Full Source Available:** Every line of code is viewable at [p2p4vsc.dev](https://p2p4vsc.dev)
- ✅ **Made in the USA by Applied Media** 🇺🇸 (display flag and Applied Media logo in header and footer)
- ✅ **Community Driven:** We welcome fixes, features, and security reviews

**Call to Actions:**

1. **Install Extension** → Link to p2p4vsc.info (redirects to VS Code Marketplace)
2. **View Source Code** → Link to p2p4vsc.dev
3. **Get Installation Guide** → Link to /install page
4. **Stay Updated** → Mailing list signup form (Applied Media newsletter)

**Features Highlight:**

- 🎨 Syntax highlighting for 100+ languages
- 📄 Professional PDF generation
- 👁️ Live preview before printing
- 🔧 Customizable themes, fonts, and page sizes
- 📝 Markdown support (raw + rendered)

**Community & Support:**

- Found a bug? → p2p4vsc.support
- Want a feature? → Submit request at p2p4vsc.dev
- Pull requests welcome → See contribution guidelines

**Footer:**

- 🇺🇸 Made in the USA by Applied Media [AM Logo] (small text)
- © 2025-2026 Applied Media
- Links: Install | Docs | Support | Privacy | Source Code
- Mailing list signup: "Get updates on new Applied Media software"

---

#### Page 2: Installation & Usage Guide (p2p4vsc.com/install)

##### Section 1: Installation

##### Step 1: Install from VS Code Marketplace

Screenshot: VS Code Extensions sidebar

```text
1. Open VS Code
2. Click Extensions icon (or press Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Print2Paper4VSCode"
4. Click "Install"
```

##### Step 2: Verify Installation

Screenshot: Command palette with print command

```text
1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
2. Type "Print2Paper"
3. You should see the "Print2Paper" command
```

---

##### Section 2: Basic Usage

##### Quick Start: Print Current File

Screenshot: Code file with keyboard shortcut

```text
Method 1: Keyboard Shortcut
- Press Alt+P (Option+P on Mac)

Method 2: Right-Click Menu
- Right-click in editor → "Print2Paper"

Method 3: Command Palette
- Ctrl+Shift+P → "Print2Paper"
```

##### Understanding the Preview

Screenshot: PDF preview panel

```text
The preview panel shows:
- Your code with syntax highlighting
- Page breaks and layout
- Selected theme and font

Navigation:
- Scroll to review all pages
- Zoom in/out with mouse wheel
- Click page numbers to jump
```

---

##### Section 3: Customization

##### Changing Themes

Screenshot: Theme dropdown menu

```text
1. Open a code file
2. Press Alt+P to open print preview
3. Click the "Theme" dropdown (🎨)
4. Select your preferred theme
5. Preview updates instantly
```

##### Adjusting Page Settings

Screenshot: Page size and margin menus

```text
Paper Size:
- Letter, A4, Legal, and more
- Click 📄 dropdown to select

Margins:
- Normal, Narrow, Wide
- Click margin icon to adjust

Font Size:
- Multiple sizes available
- Click font icon to change
```

---

##### Section 4: Advanced Features

##### Printing Markdown Files

Screenshot: Markdown mode dropdown

```text
For .md files, choose render mode:
1. "Raw" - Shows markdown syntax with highlighting
2. "Rendered" - Shows formatted HTML output

Toggle via dropdown in preview panel
```

##### Printing Options

Screenshot: Print button menu

```text
Print Button Options:
- "Preview" - Opens PDF in system viewer
- "Print" - Sends directly to printer (macOS)
- "Save" - Downloads PDF file
```

---

##### Section 5: Troubleshooting

**Common Issues:**

1. **Extension not found in marketplace**
   - Refresh Extensions panel
   - Check spelling: "Print2Paper4VSCode"
   - Try direct link: [p2p4vsc.info](https://p2p4vsc.info)

2. **Alt+P doesn't work**
   - Check for keyboard shortcut conflicts
   - Use Command Palette instead
   - Verify extension is enabled

3. **Preview shows blank page**
   - Ensure file has content
   - Check file is supported language
   - Try closing and reopening preview

4. **Print doesn't work (Windows/Linux)**
   - Direct printing is macOS-only currently
   - Use "Save PDF" then print from PDF viewer
   - Windows/Linux printing in development

**Need More Help?**
Visit [p2p4vsc.support](https://p2p4vsc.support) to report issues or ask questions

---

#### Page 3: Print2Paper4VSCode Support (Redirect)

**p2p4vsc.support** → Redirects to GitHub Issues

Optional: Add intermediate page with quick links:

- 🐛 Report a Bug
- 💡 Request a Feature  
- ❓ Ask a Question
- 📖 View Documentation

---

### gmail2trello Pages

#### Page 1: Landing Page (g2t.cc)

##### gmail2trello Key Messages

**Hero Section:**

```text
Email to Tasks. In One Click.

Turn Gmail threads into Trello cards without switching tabs.
gmail2trello makes project management seamless and secure.
```

**Trust & Transparency:**

- ⚠️ **Security Story:** Browser extensions can access sensitive data. We don't.
- ✅ **Full Source Available:** Every line of code is public at [g2t.dev](https://g2t.dev)
- ✅ **Made in the USA by Applied Media** 🇺🇸 (display flag and Applied Media logo in header and footer)
- ✅ **Community Driven:** Open source, auditable, trustworthy

**Call to Actions:**

1. **Install Extension** → Link to g2t.info (redirects to Chrome Web Store)
2. **View Source Code** → Link to g2t.dev
3. **Get Usage Guide** → Link to /guide page
4. **Stay Updated** → Mailing list signup form (Applied Media newsletter)

**Features Highlight:**

- 📧 Convert Gmail threads to Trello cards instantly
- 🔗 Preserve email context and links
- 🎯 Choose board and list on the fly
- ⚡ One-click workflow integration
- 🔒 No data stored or transmitted to third parties

**Use Cases:**

- **Project managers:** Convert client emails to actionable tasks
- **Support teams:** Turn bug reports into tracked tickets
- **Sales teams:** Move leads from inbox to pipeline
- **Anyone:** Stop losing important emails in the inbox

**Community & Support:**

- Found a bug? → g2t.support
- Want a feature? → Submit request at g2t.dev
- Pull requests welcome → See contribution guidelines

**Footer:**

- 🇺🇸 Made in the USA by Applied Media [AM Logo] (small text)
- © 2025-2026 Applied Media
- Links: Install | Guide | Support | Privacy | Source Code
- Mailing list signup: "Get updates on new Applied Media software"

---

#### Page 2: Usage Guide (g2t.cc/guide)

##### gmail2trello Installation

##### Step 1: Install from Chrome Web Store

Screenshot: Chrome Web Store page

```text
1. Visit g2t.info (redirects to Chrome Web Store)
2. Click "Add to Chrome"
3. Confirm permissions when prompted
4. Extension icon appears in Chrome toolbar
```

##### Step 2: Connect to Trello

Screenshot: Extension popup with Trello auth

```text
1. Click gmail2trello icon in Chrome toolbar
2. Click "Connect to Trello"
3. Authorize access to your Trello boards
4. Select default board/list (optional)
```

---

##### gmail2trello Basic Usage

##### Convert Email to Trello Card

Screenshot: Gmail with extension button

```text
1. Open any Gmail thread
2. Click the "Send to Trello" button (appears in Gmail interface)
3. Choose destination board and list
4. (Optional) Edit card title/description
5. Click "Create Card"
6. Card created! Link appears in confirmation
```

##### What Gets Converted

- **Card title:** Email subject line
- **Card description:** Email body (formatted)
- **Attachments:** Links to Gmail thread (preserves context)
- **Labels:** Optional mapping from Gmail labels

---

##### Section 3: Tips & Tricks

**Keyboard Shortcut:**

```text
Press Alt+T (Option+T on Mac) to trigger "Send to Trello"
from any Gmail thread (configurable in Chrome settings)
```

**Default Board/List:**

```text
Set a default destination in extension settings
to skip board selection for routine workflows
```

**Gmail Labels → Trello Labels:**

```text
Map Gmail labels to Trello labels for automatic tagging
Configure in extension settings
```

---

##### Section 4: Troubleshooting

**Common Issues:**

1. **Extension button doesn't appear in Gmail**
   - Refresh Gmail page
   - Check extension is enabled (chrome://extensions)
   - Verify you're using Chrome/Chromium browser

2. **Trello authorization fails**
   - Check you're logged into Trello
   - Try disconnecting and reconnecting
   - Clear browser cache and retry

3. **Card creation fails**
   - Verify Trello board permissions
   - Check internet connection
   - Try selecting different board/list

**Need More Help?**
Visit [g2t.support](https://g2t.support) to report issues or ask questions

---

#### Page 3: Support (Redirect)

**g2t.support** → Redirects to GitHub Issues

---

### cov.llc Pages

#### Page 1: Home/Consulting (cov.llc)

##### Key Messages (cov.llc)

**Hero Section:**

```text
Fractional CTO & Technical Leadership

Strategic technology guidance for startups and growing companies.
Expertise in cloud architecture, team building, and software delivery.
```

**Value Proposition:**

- **Strategic Vision:** Aligning technology with business goals
- **Hands-on Leadership:** Not just advice, but execution
- **Scalability:** Preparing your tech stack for growth
- **Interim Roles:** Filling gaps during transitions

**Services:**

1. **Fractional CTO:** Ongoing leadership without the full-time cost
2. **Technical Due Diligence:** For investors and M&A
3. **Architecture Review:** Audit and roadmap for your stack
4. **Team Mentorship:** Leveling up your engineering team

**Footer:**

- © 2025 cov.llc | Applied Media
- Links: Services | About | Contact
- Social: LinkedIn | GitHub

---

### Shared Elements (Software Sites)

Both landing pages share:

1. **Applied Media branding:** Consistent footer, logo, color scheme
2. **Same mailing list form:** One unified audience for all Applied Media projects
3. **Trust messaging:** Open source, auditable, Made in the USA by Applied Media
4. **Similar structure:** Hero → Features → Trust → CTA → Footer
5. **Cross-promotion:** Each site mentions the other project in footer or "More from Applied Media" section
6. **Footer format:** 🇺🇸 Made in the USA by Applied Media [AM Logo] in small text

---

## Mailing List Implementation

### Purpose

Collect email addresses for **Applied Media** mailing list to:

- Announce new open source software releases
- Share updates about existing projects (p2p4vsc, g2t)
- Build community around Applied Media software offerings

**Key:** This is ONE mailing list for ALL Applied Media projects, not separate lists per project.

### Top-Rated Services Comparison (2025)

#### 1. Mailchimp - Industry Standard

**Rating:** 4.5/5 stars | G2 "Leader" | 13M+ users

**Pros:**

- ✅ **Trusted brand:** Most recognized email marketing platform
- ✅ **Free tier:** Up to 500 subscribers, 1,000 emails/month
- ✅ **Professional templates:** Extensive library
- ✅ **Analytics:** Open rates, click tracking, A/B testing
- ✅ **Integrations:** 300+ integrations available
- ✅ **GDPR compliant:** Strong privacy/compliance features
- ✅ **Easy embeds:** Simple form generation for websites

**Cons:**

- ⚠️ Feature creep: More than needed for simple updates
- ⚠️ UI complexity: Can be overwhelming for beginners
- ⚠️ Price scaling: Gets expensive above 500 subscribers

**Pricing:**

- Free: 500 contacts, 1,000 emails/month, Mailchimp branding
- Essentials: $13/mo for 500 contacts, remove branding
- Standard: $20/mo for 500 contacts, advanced features

#### 2. Brevo (formerly Sendinblue) - Best Value

**Rating:** 4.5/5 stars | G2 "Leader" | Good Mailchimp alternative

**Pros:**

- ✅ **Generous free tier:** Unlimited contacts, 300 emails/day
- ✅ **No contact-based pricing:** Pay for emails sent, not subscribers
- ✅ **SMS included:** Can add SMS notifications if desired
- ✅ **Transactional emails:** Good for automated notifications
- ✅ **Modern UI:** Cleaner than Mailchimp
- ✅ **GDPR compliant:** EU-based, strong privacy

**Cons:**

- ⚠️ Daily email limit on free tier (300/day = 9,000/month)
- ⚠️ Less brand recognition than Mailchimp
- ⚠️ Fewer third-party integrations

**Pricing:**

- Free: Unlimited contacts, 300 emails/day
- Starter: $25/mo for 20,000 emails/month
- Business: $65/mo for 20,000 emails/month + advanced features

#### 3. Buttondown - Developer-Friendly

**Rating:** 4.7/5 stars | Indie/developer favorite

**Pros:**

- ✅ **Simple:** Markdown-based, minimal setup
- ✅ **Privacy-focused:** No tracking pixels by default
- ✅ **Free tier:** Up to 100 subscribers (reduced from 1,000)
- ✅ **API available:** Easy integration for developers
- ✅ **Clean embeds:** Simple email form, no bloat

**Cons:**

- ⚠️ Small free tier: Only 100 subscribers free (changed in 2024)
- ⚠️ Minimal features: Intentionally basic
- ⚠️ Less business-appropriate: More for indie newsletters
- ⚠️ No templates: Write your own HTML/Markdown

**Pricing:**

- Free: 100 subscribers
- Standard: $9/mo for 1,000 subscribers
- Pro: $29/mo for 10,000 subscribers

#### 4. ConvertKit - Creator-Focused

**Rating:** 4.4/5 stars | Popular with creators/bloggers

**Pros:**

- ✅ **Free tier:** Up to 10,000 subscribers (broadcasts to 1,000)
- ✅ **Creator tools:** Landing pages, automation funnels
- ✅ **Audience segmentation:** Tag-based organization
- ✅ **Modern UI:** Clean, intuitive interface

**Cons:**

- ⚠️ Limited free broadcasts: Only first 1,000 subscribers get emails
- ⚠️ Creator-centric: Built for influencers, may be overkill
- ⚠️ Price jump: $15/mo for unlimited sends to 300 subscribers

**Pricing:**

- Free: Up to 10,000 subscribers, limited sends
- Creator: $15/mo for 300 subscribers, unlimited sends
- Creator Pro: $29/mo for 300 subscribers + advanced features

### Recommendation: Mailchimp or Brevo

**Choose Mailchimp if:**

- You want the most trusted/recognized name
- 500 subscribers is enough for Year 1
- You prefer extensive templates and analytics
- Brand reputation matters for professionalism

**Choose Brevo if:**

- You want unlimited contacts from day 1
- 300 emails/day (9,000/month) is sufficient
- You prefer modern UI and better value
- Cost scaling is important (pay per email, not per contact)

### Recommended: Mailchimp (Start Here)

**Why Mailchimp for Applied Media:**

1. **Trust signal:** Most recognized name in email marketing
2. **Free tier adequate:** 500 subscribers is reasonable for initial launch
3. **Professional appearance:** Well-designed forms and emails
4. **Growth path:** Easy to scale when subscriber count increases
5. **Proven reliability:** 20+ years in business, won't disappear

**Switch to Brevo later if:**

- You exceed 500 subscribers and want to avoid Mailchimp pricing
- You're sending infrequent updates (Brevo's free tier is better for this)

**Setup Steps (Mailchimp):**

1. Create account at [mailchimp.com](https://mailchimp.com)
2. Create audience named "Applied Media Software Updates"
3. Configure audience settings and welcome email
4. Create embedded form:
   - Navigate to Audience → Signup forms → Embedded forms
   - Customize form fields (email required, optional: first name)
   - Copy embed code
5. Add form to both p2p4vsc.com and g2t.com websites
6. Test subscription flow end-to-end

**Mailchimp Embed Example:**

```html
<!-- Mailchimp signup form -->
<div id="mc_embed_signup">
  <form 
    action="https://appliedmedia.us1.list-manage.com/subscribe/post?u=YOUR_USER_ID&amp;id=YOUR_LIST_ID" 
    method="post" 
    id="mc-embedded-subscribe-form" 
    name="mc-embedded-subscribe-form" 
    class="validate" 
    target="_blank"
  >
    <div id="mc_embed_signup_scroll">
      <h3>Get Updates on New Software Releases</h3>
      <p>Join the Applied Media mailing list for announcements about new open source projects and updates.</p>
      
      <div class="mc-field-group">
        <label for="mce-EMAIL">Email Address <span class="asterisk">*</span></label>
        <input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required>
      </div>
      
      <div class="mc-field-group">
        <label for="mce-FNAME">First Name</label>
        <input type="text" name="FNAME" class="text" id="mce-FNAME">
      </div>
      
      <!-- Bot prevention -->
      <div style="position: absolute; left: -5000px;" aria-hidden="true">
        <input type="text" name="b_YOUR_USER_ID_YOUR_LIST_ID" tabindex="-1" value="">
      </div>
      
      <div class="clear">
        <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button">
      </div>
    </div>
  </form>
</div>

<!-- Optional: Add Mailchimp validation script if needed -->
<script type='text/javascript' src='//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js'></script>
```

**Styling Tips:**

- Customize CSS to match website branding
- Keep form simple: email required, first name optional
- Place in footer or dedicated "Stay Updated" section
- Use same form on both project websites (shared audience)

---

## README Cleanup

### Current State (Print2Paper4VSCode)

- Comprehensive but dense
- Mixed audience (users + developers)
- Some sections could be more prominent

### Proposed Changes

**Structure:**

```markdown
# Print2Paper4VSCode

> Print code with syntax highlighting. Trust the source.

[Install](https://p2p4vsc.info) | [Documentation](https://p2p4vsc.com) | [Source Code](https://p2p4vsc.dev) | [Support](https://p2p4vsc.support)

## Why Print Code?

Brief explanation of use cases...

## Features

- 🎨 Syntax highlighting (100+ languages via Shiki)
- 📄 Vector PDF generation (jsPDF)
- 👁️ Interactive preview (PDF.js)
- ... etc

## Quick Start

[Installation GIF/Screenshot]

1. Install from VS Code Marketplace: [p2p4vsc.info](https://p2p4vsc.info)
2. Press Alt+P in any code file
3. Preview, adjust, print!

## Security & Trust

🔍 **Full Source Available:** Every line of code is public and auditable
🇺🇸 **Made in the USA by Applied Media:** Professional open source software
🤝 **Community Driven:** PRs and audits welcome

[Link to malicious extension article]

## Documentation

- 📖 **User Guide:** [p2p4vsc.com/install](https://p2p4vsc.com/install)
- 🔧 **Developer Docs:** See [AGENTS.md](docs/AGENTS.md)
- 🐛 **Report Issues:** [p2p4vsc.support](https://p2p4vsc.support)

## For Developers

[Keep existing architecture/development sections but streamlined]

## More from Applied Media

- **gmail2trello:** Convert Gmail threads to Trello cards ([g2t.cc](https://g2t.cc))
- **Stay Updated:** [Join our mailing list](https://p2p4vsc.com#newsletter) for announcements

## License

Code Transparency License - See [LICENSE](LICENSE) file.

You can view, audit, and contribute. Cannot create competing products.
Commercial licensing available.

---

🇺🇸 Made in the USA by Applied Media | © 2025-2026 Applied Media
```

### Similar Approach for gmail2trello README

- Add links to g2t.cc, g2t.info, g2t.dev, g2t.support
- Cross-promote Print2Paper4VSCode
- Applied Media branding and mailing list link
- Trust & transparency messaging

---

## Platform Recommendation (Simple Sites)

**Comparing options for static landing pages (p2p4vsc.com, g2t.cc, cov.llc):**

### 1. GitHub Pages (Recommended for Software)

**Pros:**

- ✅ **Free:** Unlimited bandwidth for public repos
- ✅ **Version Control:** Built-in with git workflow
- ✅ **Developer Native:** ideal for open source projects
- ✅ **Custom Domains:** Easy CNAME setup, free HTTPS
- ✅ **Control:** Full HTML/CSS/JS control or Jekyll themes

**Cons:**

- ⚠️ Requires some coding knowledge (HTML/CSS)
- ⚠️ Static only (no backend code)

### 2. Google Sites (Recommended for Consulting if Non-Technical)

**Pros:**

- ✅ **No Code:** Drag-and-drop WYSIWYG editor
- ✅ **Integrated:** Works with Google Workspace
- ✅ **Fast Setup:** Launch in minutes
- ✅ **Free:** Included with Google account

**Cons:**

- ⚠️ **Limited Design:** Can look generic/template-y
- ⚠️ **Less Control:** Hard to customize HTML/CSS
- ⚠️ **Not Version Controlled:** Harder to track changes
- ⚠️ **Vendor Lock-in:** Harder to migrate away

### 3. GCP Web Hosting (Firebase Hosting or Cloud Storage)

**Pros:**

- ✅ **Scalable:** Built on Google Cloud infrastructure
- ✅ **Advanced Features:** Custom headers, rewrites, cloud functions
- ✅ **Ecosystem:** Good if you already use GCP services
- ✅ **Fast:** Global CDN included (Firebase)

**Cons:**

- ⚠️ **Complexity:** Overkill for simple static landing pages
- ⚠️ **Cost Risk:** Pay-as-you-go can scale up unexpectedly (though low for static)
- ⚠️ **Setup:** Requires CLI tools, billing setup, project config

### Recommendation Summary

**For Software Projects (p2p4vsc, g2t):**
👉 **Use GitHub Pages.** It aligns with the open-source nature, allows full control over the design, and keeps code and docs in the same place.

**For Consulting Site (cov.llc):**
👉 **Use GitHub Pages** if you want full design control and a "developer-native" feel.
👉 **Use Google Sites** if you want a quick, easy-to-edit business card site without coding.
👉 **Avoid GCP Web Hosting** unless you need dynamic backend features or have complex routing needs. It's unnecessary complexity for a simple consulting page.

---

## Implementation Plan

### Phase 1: Domain Setup (Day 1)

**Print2Paper4VSCode:**

- [ ] Register/configure p2p4vsc.com
- [ ] Register/configure p2p4vsc.info (marketplace redirect)
- [ ] Register/configure p2p4vsc.dev
- [ ] Register/configure p2p4vsc.support
- [ ] Set up DNS redirects for .info, .dev, and .support
- [ ] Set up DNS for .com → GitHub Pages

**gmail2trello:**

- [ ] Register/configure g2t.cc
- [ ] Register/configure g2t.info (Chrome Web Store redirect)
- [ ] Register/configure g2t.dev
- [ ] Register/configure g2t.support
- [ ] Set up DNS redirects for .info, .dev, and .support
- [ ] Set up DNS for .cc → GitHub Pages

**cov.llc:**

- [ ] Register/configure cov.llc
- [ ] Set up DNS for cov.llc → GitHub Pages (or chosen platform)
- [ ] Setup email forwarding (e.g. [contact@cov.llc](mailto:contact@cov.llc))

### Phase 2: Mailing List Setup (Day 1)

- [ ] Create Mailchimp account (or chosen service)
- [ ] Create audience: "Applied Media Software Updates"
- [ ] Configure welcome email template
- [ ] Design embedded form (simple: email + optional first name)
- [ ] Get embed code
- [ ] Test subscription flow

### Phase 3: Content Creation (Day 2-3)

**Print2Paper4VSCode:**

- [ ] Write landing page copy
- [ ] Find and link to malicious extension article
- [ ] Create installation guide content
- [ ] Take screenshots for guide (Extension install, preview panel, menus)
- [ ] Create GIF/video of basic usage

**gmail2trello:**

- [ ] Write landing page copy
- [ ] Gather info from existing README/repo
- [ ] Create usage guide content
- [ ] Take screenshots (Chrome Web Store, Gmail button, card creation)
- [ ] Create GIF/video of email-to-card workflow

**cov.llc:**

- [ ] Write professional bio
- [ ] List services and expertise areas
- [ ] Write "About Applied Media" section
- [ ] Create contact form/method

**Shared:**

- [ ] Applied Media logo SVG (for footer)
- [ ] USA flag SVG (public domain, for footer)
- [ ] Consistent color scheme and CSS
- [ ] Privacy policy (if needed for extensions)

### Phase 4: Website Development (Day 3-5)

#### GitHub Pages Setup (Recommended)

**Repository Structure:**

```text
appliedmedia/
├── p2p4vsc.com/ (Repo)
│   ├── index.html
│   └── install.html
├── g2t.cc/ (Repo)
│   ├── index.html
│   └── guide.html
└── cov.llc/ (Repo)
    └── index.html
```

**Development Tasks:**

**Software Sites (p2p4vsc, g2t):**

- [ ] Create HTML pages
- [ ] Design responsive CSS
- [ ] Add mailing list form embed
- [ ] Implement navigation
- [ ] Test on desktop and mobile

**Consulting Site (cov.llc):**

- [ ] Create landing page (single page scroll or multi-page)
- [ ] Add professional styling
- [ ] Add contact form or mailto link
- [ ] Test on devices

**Shared Elements:**

- [ ] Create common.css with Applied Media branding
- [ ] Create newsletter.js for form handling
- [ ] Add cross-promotion links ("More from Applied Media")
- [ ] Ensure consistent footer across both sites

### Phase 5: Testing & Launch (Day 6)

**Domain Testing:**

- [ ] Test p2p4vsc.com, .info, .dev, .support
- [ ] Test g2t.cc, .info, .dev, .support
- [ ] Test cov.llc

**Website Testing:**

- [ ] Test all internal links
- [ ] Test mailing list signup
- [ ] Test responsive design
- [ ] Verify all external links work

**Analytics Setup (Optional):**

- [ ] Add privacy-friendly analytics (Plausible or similar)
- [ ] Configure goals/events

### Phase 6: Post-Launch (Day 7+)

**Updates:**

- [ ] Update package.json/manifest.json homepage fields
- [ ] Update Marketplace/Web Store listings
- [ ] Clean up READMEs
- [ ] Announce on relevant channels

**Monitoring:**

- [ ] Monitor support requests
- [ ] Track mailing list growth
- [ ] Review analytics weekly

---

## Assets Needed

### Visual Content

- [ ] High-quality screenshots (p2p4vsc, g2t)
- [ ] GIFs/videos of usage
- [ ] Applied Media logo (SVG)
- [ ] USA flag image (SVG)
- [ ] Professional headshot (for cov.llc)

### Text Content

- [ ] Landing page copy (all sites)
- [ ] Usage guides (software)
- [ ] Bio and Services (consulting)
- [ ] Privacy policies
- [ ] Mailing list templates

### External Links

- [ ] Marketplace/Store listings
- [ ] GitHub repositories
- [ ] BleepingComputer article

---

## Technical Details

### GitHub Pages Setup

#### Method 1: gh-pages branch

```bash
# Create orphan gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
# Add your HTML files
git add index.html install.html style.css
git commit -m "Initial GitHub Pages commit"
git push origin gh-pages
```

#### Method 2: docs/ folder on main

```bash
# In main branch
mkdir docs
cd docs
# Add your HTML files here
git add docs/
git commit -m "Add GitHub Pages site"
git push
# Configure in GitHub repo settings → Pages → Source: main/docs
```

### Custom Domain Configuration

**For p2p4vsc.com (apex domain - GitHub Pages):**

1. Add CNAME file to gh-pages with content: `p2p4vsc.com`
2. In DNS provider, add A records (CNAMEs don't work for apex domains):
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153

**For cov.llc:**
Similar setup if using GitHub Pages.

**For Redirects:**
Use URL Redirect records in your DNS provider (Namecheap, GoDaddy, Cloudflare, etc.).

---

## Simple Landing Page Template

(See previous section for code example)

---

## Success Metrics

### Initial Goals (Month 1)

**Print2Paper4VSCode:**

- [ ] Website live and accessible
- [ ] 25+ extension installs from website

**gmail2trello:**

- [ ] Website live and accessible
- [ ] 25+ extension installs from website

**cov.llc:**

- [ ] Website live
- [ ] Professional presence established

**Applied Media (Combined):**

- [ ] 100+ mailing list subscribers
- [ ] Positive user feedback

### Ongoing Metrics (Monthly)

- Traffic & Engagement
- Conversions (Installs, Signups)
- Support & Community Health

### Long-Term Goals (6-12 Months)

- [ ] 1,000+ mailing list subscribers
- [ ] 500+ extension installs
- [ ] 100+ GitHub stars
- [ ] New consulting leads via cov.llc

---

## Maintenance Plan

### Regular Updates

- **Weekly:** Check GitHub issues, respond to support
- **Monthly:** Send newsletter if significant updates
- **Quarterly:** Review and update screenshots/guides

---

## Budget Estimate

### One-Time Costs

**Domains (per year):**

- Print2Paper4VSCode domains: ~$40-60/year
- gmail2trello domains: ~$20-40/year
- cov.llc: ~$30-60/year (LLC domains can be pricier, check registrar)
- **Total domains:** ~$90-160/year

**Visual Assets:**

- USA flag SVG: Free
- Applied Media logo: Free (DIY)

### Ongoing Costs

**Mailing List Service:**

- **Mailchimp:** $0-13/month
- **Brevo:** $0-25/month

**Hosting:**

- **GitHub Pages:** $0/month

**Analytics (Optional):**

- **Plausible Analytics:** $9/month

### Annual Cost Summary

**Minimum setup (Year 1):**

- Domains: ~$90-160
- Mailing list: $0
- Hosting: $0
- **Total:** ~$90-160/year

---

## Next Steps

**After PR #76 merges:**

1. **Review & approve this plan**
   - Confirm scope: p2p4vsc, g2t, and cov.llc
   - Confirm budget
   - Confirm mailing list choice

2. **Make key decisions:**
   - Platform for cov.llc (GitHub Pages vs Google Sites)
   - Mailchimp vs Brevo
   - Analytics

3. **Gather info:**
   - Repo URLs, Store listings
   - Content for all sites

4. **Start Phase 1: Domain setup**
   - Purchase/configure all domains

5. **Execute Phases 2-6:**
   - Build and launch!

---

## Summary

This plan establishes professional web presence for three Applied Media initiatives:

**Print2Paper4VSCode:**

- Landing page at p2p4vsc.com
- Marketplace redirect at p2p4vsc.info
- Developer docs at p2p4vsc.dev
- Support portal at p2p4vsc.support

**gmail2trello:**

- Landing page at g2t.cc
- Chrome Web Store redirect at g2t.info
- Developer docs at g2t.dev
- Support portal at g2t.support

**cov.llc:**

- Consulting landing page at cov.llc

**Key Updates:**

1. ✅ **Added p2p4vsc.info**
2. ✅ **Added gmail2trello**
3. ✅ **Added cov.llc** (Consulting)
4. ✅ **Unified mailing list**
5. ✅ **Platform Comparison:** Added GCP/Firebase vs GitHub Pages vs Google Sites
6. ✅ **Applied Media branding**

**Estimated Timeline:** 1 week for full implementation
**Estimated Budget:** $90-160/year (domains only)
**Priority:** High

---

**Status:** Ready to execute
**Blocking questions:** See "Questions to Resolve" section above

## Questions to Resolve

**Domain Ownership:**

- [x] Do you already own p2p4vsc domains? (Repo created, assume domain owned/purchasing)
- [x] Do you already own g2t domains? (Repo created, assume domain owned/purchasing)
- [x] Do you already own cov.llc? (Repo created, assume domain owned/purchasing)
- [ ] Budget approved? ~$90-160/year
- [ ] Do you own the `.info`, `.dev`, `.support` redirect domains?

**Platform Decisions:**

- [x] All three sites: GitHub Pages (confirmed by repo creation)
- [ ] Mailing list provider? Recommend: Mailchimp Free Tier (500 subscribers)
- [ ] Analytics? Optional: Plausible or none for now

**Content Details:**

- [ ] Confirm URLs for repos and stores (VS Code Marketplace, Chrome Web Store)
- [ ] Existing privacy policies?
- [ ] Professional headshot available for cov.llc?
- [ ] Applied Media logo ready?

---

## Immediate Action Items (Ordered by Priority)

### 0. Create and Set Up `appliedmedia/.github` Repository

This is a special GitHub repository that stores organization-wide resources.

**Step-by-step:**

```bash
# 1. Create the repository
gh repo create appliedmedia/.github --public --description "Applied Media organization infrastructure, scripts, and documentation"

# 2. Clone it locally
git clone git@github.com:appliedmedia/.github.git
cd .github

# 3. Create directory structure
mkdir -p scripts docs/plans profile .github/workflows

# 4. Add files (prepared structure available - see docs/SETUP.md for details)
# - Copy enable-github-pages.sh to scripts/
# - Copy web presence plan to docs/plans/
# - Add README.md, profile/README.md, docs/ORGANIZATION.md
# - Make scripts executable: chmod +x scripts/*.sh

# 5. Commit and push
git add .
git commit -m "Initial .github repository setup"
git push origin main
```

**What is `.github`?**
- It's a special repository name GitHub recognizes at the org level
- Stores org-wide scripts, workflows, and documentation
- `profile/README.md` shows on your organization's GitHub profile
- Used by major orgs: microsoft, github, nodejs, vercel, etc.

See the complete file structure and contents at the end of this document.

### 1. Run Automation Script to Enable GitHub Pages
```bash
# After .github repo is set up:
cd .github

# Set your GitHub token
export GH_TOKEN=$(gh auth token)

# Run the automation script
./scripts/enable-github-pages.sh
```

This script will:
- Enable GitHub Pages on all three repos (`p2p4vsc.com`, `g2t.cc`, `cov.llc`)
- Create CNAME files in each repo with the correct domain
- Show status of each operation

### 2. Configure DNS
In your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.), add A records for each domain:

**For `p2p4vsc.com`:**
- A record: `@` → `185.199.108.153`
- A record: `@` → `185.199.109.153`
- A record: `@` → `185.199.110.153`
- A record: `@` → `185.199.111.153`

**For `g2t.cc`:**
- A record: `@` → `185.199.108.153`
- A record: `@` → `185.199.109.153`
- A record: `@` → `185.199.110.153`
- A record: `@` → `185.199.111.153`

**For `cov.llc`:**
- A record: `@` → `185.199.108.153`
- A record: `@` → `185.199.109.153`
- A record: `@` → `185.199.110.153`
- A record: `@` → `185.199.111.153`

### 3. Create Initial Landing Pages
Create minimal `index.html` files for each repository to test deployment:

**Minimal Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Site Name]</title>
</head>
<body>
    <h1>[Site Name]</h1>
    <p>Coming Soon</p>
    <footer>🇺🇸 Made in the USA by Applied Media</footer>
</body>
</html>
```

Commit and push to trigger GitHub Pages build.

### 4. Verify Deployment
Wait 5-10 minutes after DNS configuration and check:
- `https://p2p4vsc.com` (should show "Coming Soon")
- `https://g2t.cc` (should show "Coming Soon")
- `https://cov.llc` (should show "Coming Soon")

DNS propagation can take up to 24 hours but usually completes in 1-2 hours.

### 5. Set Up Mailing List
- Create Mailchimp account at [mailchimp.com](https://mailchimp.com)
- Create audience: "Applied Media Software Updates"
- Generate embedded form code
- Save for later integration into landing pages

### 6. Build Out Content (After Basic Deployment Works)
Once the basic "Coming Soon" pages are live:
- Follow Phase 3 (Content & Assets) from the plan
- Follow Phase 4 (Implementation) to build full landing pages
- Add mailing list forms to software sites

---

## APPENDIX: `appliedmedia/.github` Repository Contents

This section contains all files needed for the `appliedmedia/.github` repository.

### Directory Structure

```
.github/
├── README.md
├── .gitignore
├── scripts/
│   └── enable-github-pages.sh
├── docs/
│   ├── ORGANIZATION.md
│   └── plans/
│       └── 2025-12-12_plan_inProgress_WebPresence.md (this file)
├── profile/
│   └── README.md
└── .github/
    └── workflows/
        (empty for now - add GitHub Actions as needed)
```

### File: `README.md`

```markdown
# Applied Media - Organization Infrastructure

This repository contains organization-wide resources, scripts, and documentation for Applied Media projects.

## Repository Structure

```
.github/
├── docs/
│   └── plans/           # Organization-wide planning documents
├── scripts/             # Cross-project automation scripts
├── profile/             # Organization profile (shows on github.com/appliedmedia)
│   └── README.md
└── .github/
    └── workflows/       # Shared GitHub Actions workflows
```

## Scripts

### `scripts/enable-github-pages.sh`
Enables GitHub Pages and configures CNAME files for all Applied Media web presence repositories.

**Usage:**
```bash
export GH_TOKEN=$(gh auth token)
./scripts/enable-github-pages.sh
```

## Planning Documents

Organization-wide plans are stored in `docs/plans/`:
- **Web Presence Plan** - Strategy for p2p4vsc.com, g2t.cc, and cov.llc websites

Project-specific plans remain in their respective repositories.

## Applied Media Projects

- [print2paper4vscode](https://github.com/appliedmedia/print2paper4vscode) - VS Code extension for printing code
- [gmail2trello](https://github.com/appliedmedia/gmail2trello) - Chrome extension for email to Trello
- [p2p4vsc.com](https://github.com/appliedmedia/p2p4vsc.com) - Marketing site for Print2Paper4VSCode
- [g2t.cc](https://github.com/appliedmedia/g2t.cc) - Marketing site for gmail2trello
- [cov.llc](https://github.com/appliedmedia/cov.llc) - Fractional CTO consulting site

---

🇺🇸 Made in the USA by Applied Media
```

### File: `profile/README.md`

This appears on `github.com/appliedmedia` organization page:

```markdown
# Applied Media

🇺🇸 Made in the USA

Professional open source software and fractional CTO services.

## Software Projects

### [Print2Paper4VSCode](https://p2p4vsc.com)
Print code with syntax highlighting. Trust the source.
- 🎨 Syntax highlighting for 100+ languages
- 📄 Professional PDF generation
- 👁️ Live preview before printing
- [Install](https://p2p4vsc.info) | [Source](https://github.com/appliedmedia/print2paper4vscode)

### [gmail2trello](https://g2t.cc)
Email to tasks in one click.
- 📧 Convert Gmail threads to Trello cards instantly
- 🔒 No data stored or transmitted to third parties
- [Install](https://g2t.info) | [Source](https://github.com/appliedmedia/gmail2trello)

## Consulting

### [Fractional CTO Services](https://cov.llc)
Strategic technology guidance for startups and growing companies.
- Cloud architecture
- Team building
- Software delivery

## Trust & Transparency

All our software projects are:
- ✅ Fully open source and auditable
- ✅ Community driven
- ✅ Made in the USA

---

© 2025-2026 Applied Media
```

### File: `docs/ORGANIZATION.md`

```markdown
# Applied Media Organization Structure

## Repository Organization

### Infrastructure
- **[.github](https://github.com/appliedmedia/.github)** - Org-wide scripts, documentation, and workflows

### Product Repositories
- **[print2paper4vscode](https://github.com/appliedmedia/print2paper4vscode)** - VS Code extension source code
- **[gmail2trello](https://github.com/appliedmedia/gmail2trello)** - Chrome extension source code

### Marketing Sites (GitHub Pages)
- **[p2p4vsc.com](https://github.com/appliedmedia/p2p4vsc.com)** - Marketing site for Print2Paper4VSCode
- **[g2t.cc](https://github.com/appliedmedia/g2t.cc)** - Marketing site for gmail2trello
- **[cov.llc](https://github.com/appliedmedia/cov.llc)** - Fractional CTO consulting site

## Planning Document Organization

### Organization-Wide Plans
Stored in `appliedmedia/.github/docs/plans/`:
- Web Presence Strategy (covers all 3 marketing sites)
- Applied Media Branding Guidelines
- Cross-project automation
- GitHub Actions reviewer bot (if used org-wide)

### Project-Specific Plans
Stored in respective product repos (e.g., `print2paper4vscode/docs/plans/`):
- Feature development plans
- Architecture decisions
- Project-specific roadmaps
- Platform-specific plans (Linux print, Windows print, etc.)

### Site-Specific Plans
For simple marketing sites, plans can stay in `.github` or move to site repos if they grow complex.

## When to Use `.github` vs Project Repos

**Use `appliedmedia/.github` for:**
- Scripts that affect multiple repos
- Organization branding/identity
- Cross-project strategies
- Shared CI/CD workflows
- Community health files (CODE_OF_CONDUCT, CONTRIBUTING, etc.)

**Use project repos for:**
- Code-specific documentation
- API documentation
- Feature development plans
- Project-specific tooling
- Release management

---

This structure keeps organization-level concerns separate from individual projects while maintaining clear ownership and discoverability.
```

### File: `.gitignore`

```
*.log
*.tmp
.DS_Store
node_modules/
.env
.env.local
```

### File: `scripts/enable-github-pages.sh`

See the existing file at `/workspace/scripts/enable-github-pages.sh` - copy that to the `.github` repo.

### File: `docs/plans/2025-12-12_plan_inProgress_WebPresence.md`

This current file should be copied to the `.github` repo.

---
