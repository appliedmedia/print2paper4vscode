# Web Presence Plan

**Status:** TODO  
**Created:** 2025-12-12  
**Priority:** Execute after PR #76 is merged  

---

## Overview

Establish a professional web presence for Print2Paper4VSCode (p2p4vsc) with clear domain structure, compelling landing page, comprehensive user guide, and straightforward support channel.

---

## Domain Structure

### Primary Domains

**p2p4vsc.com** - Main Marketing Website

- **Purpose:** Professional landing page and marketing site
- **Platform Options:**
  1. GitHub Pages with custom index.html (free, full control)
  2. Google Sites (free, easier to manage, less control)
- **Content:** Landing page, installation guide, support info
- **User Action:** Point DNS to chosen platform

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

## Website Pages

### Page 1: Landing Page (p2p4vsc.com)

#### Key Messages

**Hero Section:**

```text
Print Code. Trust the Source.

Sometimes you need code on paper. Whether it's reviewing algorithms
away from screens, annotating for team reviews, or archiving critical
snippets—Print2Paper4VSCode makes it simple and safe.
```text

**Trust & Transparency:**

- ⚠️ **Security Story:** Reference [real incident of malicious VSCode extensions removed from marketplace](https://www.bleepingcomputer.com/news/security/microsoft-finds-dozens-of-malicious-vs-code-extensions/)
- ✅ **Full Source Available:** Every line of code is viewable at [p2p4vsc.dev](https://p2p4vsc.dev)
- ✅ **Made in the USA** 🇺🇸 (display flag in header and footer)
- ✅ **Community Driven:** We welcome fixes, features, and security reviews

**Call to Actions:**

1. **Install Extension** → Link to VS Code Marketplace
2. **View Source Code** → Link to p2p4vsc.dev
3. **Get Installation Guide** → Link to /install page
4. **Stay Updated** → Mailing list signup form

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

- Made in the USA 🇺🇸
- © 2025-2026 Applied Media
- Links: Install | Docs | Support | Privacy | Source Code
- Social media icons (if applicable)

---

### Page 2: Installation & Usage Guide (p2p4vsc.com/install)

#### Section 1: Installation

#### Step 1: Install from VS Code Marketplace

Screenshot: VS Code Extensions sidebar

```text
1. Open VS Code
2. Click Extensions icon (or press Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Print2Paper4VSCode"
4. Click "Install"
```text

#### Step 2: Verify Installation

Screenshot: Command palette with print command

```text
1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
2. Type "Print2Paper"
3. You should see the "Print2Paper" command
```text

---

#### Section 2: Basic Usage

#### Quick Start: Print Current File

Screenshot: Code file with keyboard shortcut

```text
Method 1: Keyboard Shortcut
- Press Alt+P (Option+P on Mac)

Method 2: Right-Click Menu
- Right-click in editor → "Print2Paper"

Method 3: Command Palette
- Ctrl+Shift+P → "Print2Paper"
```text

#### Understanding the Preview

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
```text

---

#### Section 3: Customization

#### Changing Themes

Screenshot: Theme dropdown menu

```text
1. Open a code file
2. Press Alt+P to open print preview
3. Click the "Theme" dropdown (🎨)
4. Select your preferred theme
5. Preview updates instantly
```text

#### Adjusting Page Settings

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
```text

---

#### Section 4: Advanced Features

#### Printing Markdown Files

Screenshot: Markdown mode dropdown

```text
For .md files, choose render mode:
1. "Raw" - Shows markdown syntax with highlighting
2. "Rendered" - Shows formatted HTML output

Toggle via dropdown in preview panel
```text

#### Printing Options

Screenshot: Print button menu

```text
Print Button Options:
- "Preview" - Opens PDF in system viewer
- "Print" - Sends directly to printer (macOS)
- "Save" - Downloads PDF file
```text

---

#### Section 5: Troubleshooting

**Common Issues:**

1. **Extension not found in marketplace**
   - Refresh Extensions panel
   - Check spelling: "Print2Paper4VSCode"
   - Try direct link: [marketplace link]

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

### Page 3: Support (Redirect)

**p2p4vsc.support** → Redirects to GitHub Issues

Optional: Add intermediate page with quick links:

- 🐛 Report a Bug
- 💡 Request a Feature  
- ❓ Ask a Question
- 📖 View Documentation

---

## Mailing List Implementation

### Recommended Option: Buttondown

**Why Buttondown:**

- ✅ **Simple:** Markdown-based, minimal setup
- ✅ **Privacy-focused:** No tracking pixels by default
- ✅ **Free tier:** Up to 1,000 subscribers
- ✅ **API available:** Easy integration
- ✅ **Paid upgrade:** $9/mo for more features if needed
- ✅ **Clean embeds:** Simple email form

**Alternative Options:**

1. **Mailchimp**
   - Free up to 500 subscribers
   - Well-known, feature-rich
   - Can be overkill for simple newsletter
   - More complex UI

2. **Constant Contact**
   - No free tier ($12+/mo)
   - Professional features
   - Good if you want full marketing suite
   - Overkill for simple updates

3. **ConvertKit**
   - Free up to 1,000 subscribers
   - Creator-focused
   - Good automation features
   - More than you might need initially

4. **Simple Form → Email**
   - Completely free
   - Use Formspree or similar
   - Just sends emails to you
   - Manual management required

### Recommended: Start with Buttondown

**Setup Steps:**

1. Create account at [buttondown.email](https://buttondown.email)
2. Configure newsletter name and description
3. Get embed code for subscription form
4. Add to website footer/dedicated section
5. (Optional) Set up welcome email

**Embed Example:**

```html
<form
  action="https://buttondown.email/api/emails/embed-subscribe/p2p4vsc"
  method="post"
  target="popupwindow"
  onsubmit="window.open('https://buttondown.email/p2p4vsc', 'popupwindow', 'scrollbars=yes,width=800,height=600');return true"
>
  <label for="bd-email">Get extension updates:</label>
  <input type="email" name="email" id="bd-email" placeholder="your@email.com" required />
  <input type="submit" value="Subscribe" />
</form>
```text

---

## README Cleanup

### Current State

- Comprehensive but dense
- Mixed audience (users + developers)
- Some sections could be more prominent

### Proposed Changes

**Structure:**

```markdown
# Print2Paper4VSCode

> Print code with syntax highlighting. Trust the source.

[Install](marketplace-link) | [Documentation](p2p4vsc.com) | [Source Code](p2p4vsc.dev) | [Support](p2p4vsc.support)

## Why Print Code?

Brief explanation of use cases...

## Features

- 🎨 Syntax highlighting (100+ languages via Shiki)
- 📄 Vector PDF generation (jsPDF)
- 👁️ Interactive preview (PDF.js)
- ... etc

## Quick Start

[Installation GIF/Screenshot]

1. Install from VS Code Marketplace
2. Press Alt+P in any code file
3. Preview, adjust, print!

## Security & Trust

🔍 **Full Source Available:** Every line of code is public and auditable
🇺🇸 **Made in the USA**
🤝 **Community Driven:** PRs and audits welcome

[Link to malicious extension article]

## Documentation

- 📖 **User Guide:** [p2p4vsc.com/install](http://p2p4vsc.com/install)
- 🔧 **Developer Docs:** See AGENTS.md
- 🐛 **Report Issues:** [p2p4vsc.support](http://p2p4vsc.support)

## For Developers

[Keep existing architecture/development sections but streamlined]

## License

Code Transparency License - See [LICENSE](LICENSE) file.

You can view, audit, and contribute. Cannot create competing products.
Commercial licensing available.

---

Made in the USA 🇺🇸 | © 2025-2026 Applied Media
```text

---

## Platform Recommendation

### GitHub Pages (Recommended)

**Pros:**

- ✅ Free, unlimited bandwidth
- ✅ Full control over HTML/CSS/JS
- ✅ Version controlled (same repo or separate)
- ✅ Custom domain support
- ✅ HTTPS included
- ✅ Can use Jekyll or plain HTML
- ✅ Easy deployment (just push to gh-pages branch)

**Cons:**

- ⚠️ Requires HTML/CSS knowledge (minimal)
- ⚠️ Static only (but that's fine for this use case)

### Google Sites (Alternative)

**Pros:**

- ✅ No coding required
- ✅ WYSIWYG editor
- ✅ Free, custom domain support
- ✅ Quick to set up

**Cons:**

- ⚠️ Less control over design
- ⚠️ Can look generic
- ⚠️ Limited customization
- ⚠️ Not version controlled

### Recommendation: GitHub Pages

Use GitHub Pages with custom HTML for:

1. Professional appearance
2. Full control
3. Easy updates (just edit HTML)
4. Version history
5. Can reuse extension's design language

---

## Implementation Plan

### Phase 1: Domain Setup (Day 1)

- [ ] Register/configure p2p4vsc.com
- [ ] Register/configure p2p4vsc.dev
- [ ] Register/configure p2p4vsc.support
- [ ] Set up DNS redirects for .dev and .support
- [ ] Set up DNS for .com → GitHub Pages

### Phase 2: Content Creation (Day 1-2)

- [ ] Write landing page copy
- [ ] Find and link to malicious extension article
- [ ] Create installation guide content
- [ ] Take screenshots for guide
- [ ] Clean up README.md

### Phase 3: Website Development (Day 2-3)

#### Option A: GitHub Pages (Recommended)

- [ ] Create gh-pages branch or docs/ folder
- [ ] Design/code landing page HTML
- [ ] Design/code installation guide page
- [ ] Add responsive CSS
- [ ] Implement navigation
- [ ] Add mailing list form
- [ ] Test on mobile

#### Option B: Google Sites

- [ ] Create new Google Site
- [ ] Build landing page
- [ ] Build installation guide page
- [ ] Configure custom domain
- [ ] Test functionality

### Phase 4: Mailing List Setup (Day 3)

- [ ] Create Buttondown account (or chosen service)
- [ ] Configure newsletter settings
- [ ] Get embed code
- [ ] Integrate into website
- [ ] Test subscription flow
- [ ] Write welcome email template

### Phase 5: Testing & Launch (Day 4)

- [ ] Test all domain redirects
- [ ] Test website on desktop browsers
- [ ] Test website on mobile devices
- [ ] Test mailing list signup
- [ ] Verify all links work
- [ ] Check GitHub repo link accessibility
- [ ] Deploy to production

### Phase 6: Post-Launch (Day 5)

- [ ] Update package.json homepage field
- [ ] Update VS Code Marketplace listing with website link
- [ ] Announce on relevant channels
- [ ] Monitor for issues

---

## Assets Needed

### Content

- [ ] High-quality screenshots of extension in use
- [ ] GIF/video of installation process
- [ ] GIF/video of basic usage (Alt+P → preview → print)
- [ ] USA flag image (SVG preferred)
- [ ] Extension icon (already have)

### Text

- [ ] Landing page hero copy
- [ ] Feature descriptions
- [ ] Installation guide step-by-step
- [ ] Troubleshooting FAQs
- [ ] Cleaned up README

### Links

- [ ] Find real article about malicious VS Code extensions
  - Suggested: [BleepingComputer article](https://www.bleepingcomputer.com/news/security/microsoft-finds-dozens-of-malicious-vs-code-extensions/)
  - Or: [The Register article on malicious extensions](https://www.theregister.com/2023/08/02/malicious_vscode_extensions/)
- [ ] VS Code Marketplace extension page URL
- [ ] GitHub repository URL

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
```text

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
```text

### Custom Domain Configuration

**For p2p4vsc.com (GitHub Pages):**

1. Add CNAME file to gh-pages with content: `p2p4vsc.com`
2. In DNS provider, add:
   - A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - Or CNAME: yourusername.github.io

**For p2p4vsc.dev:**

- Add URL redirect record → `https://github.com/appliedmedia/print2paper4vscode`

**For p2p4vsc.support:**

- Add URL redirect record → `https://github.com/appliedmedia/print2paper4vscode/issues/new`

---

## Simple Landing Page Template

Here's a minimal but professional starting template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Print2Paper4VSCode - Print Code, Trust the Source</title>
    <meta name="description" content="A trustworthy VS Code extension for printing code with syntax highlighting. Full source code available.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        header { background: #1e1e1e; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        header img { height: 20px; }
        nav a { color: white; text-decoration: none; margin-left: 2rem; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6rem 2rem; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.3rem; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
        .cta-button { display: inline-block; background: white; color: #667eea; padding: 1rem 2rem; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0.5rem; }
        .features { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
        .feature { text-align: center; }
        .feature h3 { margin: 1rem 0; }
        .trust { background: #f5f5f5; padding: 4rem 2rem; text-align: center; }
        .trust h2 { margin-bottom: 2rem; }
        .trust-points { max-width: 800px; margin: 0 auto; display: grid; gap: 1rem; }
        .trust-point { background: white; padding: 1.5rem; border-radius: 5px; text-align: left; }
        footer { background: #1e1e1e; color: white; padding: 2rem; text-align: center; }
        footer img { height: 30px; margin-top: 1rem; }
    </style>
</head>
<body>
    <header>
        <div>Print2Paper4VSCode</div>
        <nav>
            <a href="#features">Features</a>
            <a href="/install.html">Install</a>
            <a href="https://p2p4vsc.dev">Source Code</a>
            <a href="https://p2p4vsc.support">Support</a>
        </nav>
    </header>

    <section class="hero">
        <h1>Print Code. Trust the Source.</h1>
        <p>Sometimes you need code on paper. Print2Paper4VSCode makes it simple, safe, and beautiful.</p>
        <a href="[MARKETPLACE_LINK]" class="cta-button">Install Extension</a>
        <a href="https://p2p4vsc.dev" class="cta-button">View Source Code</a>
    </section>

    <section class="features" id="features">
        <div class="feature">
            <div style="font-size: 3rem;">🎨</div>
            <h3>Syntax Highlighting</h3>
            <p>100+ languages via Shiki</p>
        </div>
        <div class="feature">
            <div style="font-size: 3rem;">📄</div>
            <h3>Vector PDFs</h3>
            <p>Clean, professional output</p>
        </div>
        <div class="feature">
            <div style="font-size: 3rem;">👁️</div>
            <h3>Live Preview</h3>
            <p>See before you print</p>
        </div>
        <div class="feature">
            <div style="font-size: 3rem;">🔧</div>
            <h3>Customizable</h3>
            <p>Themes, fonts, page sizes</p>
        </div>
    </section>

    <section class="trust">
        <h2>Built on Trust & Transparency</h2>
        <div class="trust-points">
            <div class="trust-point">
                <strong>⚠️ Security Matters</strong><br>
                Malicious extensions have been removed from the marketplace. 
                <a href="https://www.bleepingcomputer.com/news/security/microsoft-finds-dozens-of-malicious-vs-code-extensions/">Read the story</a>
            </div>
            <div class="trust-point">
                <strong>✅ Full Source Available</strong><br>
                Every line of code is public at <a href="https://p2p4vsc.dev">p2p4vsc.dev</a>. 
                Audit it. Review it. Trust it.
            </div>
            <div class="trust-point">
                <strong>🇺🇸 Made in the USA</strong><br>
                Developed and maintained in the United States.
            </div>
            <div class="trust-point">
                <strong>🤝 Community Driven</strong><br>
                We welcome bug reports, feature requests, and pull requests.
            </div>
        </div>
    </section>

    <footer>
        <p>&copy; 2025-2026 Applied Media. All Rights Reserved.</p>
        <p>
            <a href="/install.html" style="color: white;">Install</a> | 
            <a href="https://p2p4vsc.dev" style="color: white;">Source</a> | 
            <a href="https://p2p4vsc.support" style="color: white;">Support</a>
        </p>
        <p>Made in the USA <img src="usa-flag.svg" alt="USA Flag" /></p>
    </footer>
</body>
</html>
```text

---

## Success Metrics

### Initial Goals (Month 1)

- [ ] Website live and accessible
- [ ] 100+ mailing list subscribers
- [ ] 50+ extension installs from website referrals
- [ ] Zero broken links reported

### Ongoing Metrics

- Track via VS Code Marketplace analytics
- Monitor mailing list growth
- Track support requests via GitHub issues
- Collect user feedback

---

## Maintenance Plan

### Regular Updates

- **Weekly:** Check GitHub issues, respond to support
- **Monthly:** Send newsletter if significant updates
- **Quarterly:** Review and update screenshots/guides
- **As needed:** Update for new features or security notices

---

## Budget Estimate

### One-Time Costs

- Domain registrations: ~$30-50/year (if not already owned)
- USA flag SVG: Free (public domain)
- Screenshots/assets: Free (DIY)

### Ongoing Costs

- **Buttondown mailing list:**
  - Free (up to 1,000 subscribers)
  - $9/mo if upgrade needed
- **GitHub Pages:** Free
- **Domain renewals:** ~$30-50/year

**Total estimated:** $0-100/year depending on choices

---

## Next Steps

**After PR #76 merges:**

1. **Approve this plan**
2. **Decide: GitHub Pages vs Google Sites**
3. **Decide: Mailing list provider**
4. **Start Phase 1: Domain setup**
5. **Create assets (screenshots, copy)**
6. **Build website**
7. **Launch!**

---

## Questions to Resolve

- [ ] Do you already own p2p4vsc.com/.dev/.support domains?
- [ ] Preference: GitHub Pages or Google Sites?
- [ ] Mailing list: Buttondown or alternative?
- [ ] Want to keep extension icon or create website-specific branding?
- [ ] Any specific design preferences/colors?
- [ ] Want analytics (Google Analytics, Plausible, etc.)?

---

**Status:** Ready to execute after PR #76 clears
**Estimated time:** 4-5 days for full implementation
**Priority:** High (professional web presence before marketing)
