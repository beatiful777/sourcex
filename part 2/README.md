# Global Source Hub

R OLE: You are a senior product designer.This must look like it was built by a smart professional, NOT a beginner.

CRITICAL FIX — REMOVE ALL FAKE DATA:
- DELETE ALL factories with location "Foshan" or "Foshan Home Manufacturing" or any fake 9.2/10 score
- DELETE fake product "knife" and any product with fake supplier
- NO fake ratings, NO fake "Verified" badges if data is not real
- If you don't have real data, show EMPTY STATE or "No suppliers yet" — do NOT invent data. This is for university admission.

BRAND: SOURCEX - Global B2B Sourcing Hub
Tagline: "16 Countries, One Platform"
Rule: NO Uzbekistan flag. This is a global platform, neutral design. No country bias.

DESIGN GOAL: Make it look like alibaba.com + faire.com — modern, clean, trustworthy. Like a smart person made it.

WHAT MUST WORK (all buttons must be functional, not fake):
1.  Top Search Bar: must actually filter
2.  Category Filter: Apparel, Textiles, Electronics, Furniture, Home Goods
3.  Country Hub Selector: 16 countries as cards - China, India, Turkey, Vietnam, Bangladesh, Indonesia, Pakistan, Thailand, Mexico, Brazil, Portugal, Poland, Egypt, Morocco, Ethiopia, Colombia
4.  Each country card: on click -> goes to /hub/[country] page (even if page is placeholder)
5.  Supplier Card: must have "Send Inquiry" button that opens a real contact form (not fake)
6.  Header: Logo SOURCEX, Navigation, "Post RFQ" button, "Sign In" button
7.  Footer: Real links

HOMEPAGE STRUCTURE (in this order):
- Hero: "Source Smarter. Global B2B Sourcing Hub" + Search bar
- Section 2: "Browse by Category" - 5 clean category cards with icons
- Section 3: "Sourcing Hubs: 16 Countries" - 16 country cards in grid (flag + name + "X Suppliers" — use real counts or "Explore")
- Section 4: "How SOURCEX Works" - 3 steps: Post RFQ -> Get Quotes -> Source Smart
- Section 5: Empty state for Featured Suppliers: "Verified suppliers coming soon - Platform in beta for Baruch College portfolio"

STYLE:
- Colors: White, Slate-900, Blue-600 accent. No neon.
- Font: Inter, clean, professional
- No shadows that look cheap. Use subtle borders.
- Fully responsive
- This is for Ivy-level portfolio — make it minimal, smart, not cluttered.

DO NOT add fake factories to fill space. An empty professional site is 100x better than a site with fake data for college admission.

Push changes to GitHub after. just make better pls

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d91fe00a-8158-4953-8a19-58222652514f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
