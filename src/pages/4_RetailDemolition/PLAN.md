# Retail Demolition Game — Improvement Plan

## Overview

The game teaches players about prompt injection risks in agentic AI shopping systems. This plan restructures the experience into clearer phases with better guidance, a manual-first flow, stronger educational signals, and freedom to explore.

**Core principles:**
- Educational first, not punitive. The game is about learning, not difficulty.
- Guided but not rigid — players can freely explore products and sites in both modes.
- Scores are hidden during gameplay; only revealed at the final summary.
- The final summary/scoring moves to the side hint panel; the phone shows only "Try Again" and "Submit Score" buttons.
- Real product images throughout (no emojis or placeholders).

---

## Phase 1: Pre-Game Introduction (NEW)

**Goal:** Educate the player on what AI shopping agents are and why they matter, *before* they touch the phone.

- Full-page intro screen (outside the phone):
  - **What is an AI agent?** — Software that acts on your behalf: browses, clicks, pays.
  - **Why should you care?** — Agents access your payment info, personal data, and make decisions autonomously.
  - **Known risks** — Prompt injection, data leakage, unauthorized transactions.
  - Use icons/illustrations (shield, robot, warning triangle).
- "Enter the Simulation" button transitions to the phone UI.
- Short carousel (2–3 slides max) to avoid a wall of text.

---

## Phase 2: Billing / Onboarding (REVISED)

**Goal:** Simulate realistic browser-style form filling with saved credentials.

- Player enters the phone and is prompted to set up their "ShopAI" account.
- **Name fields**: First name and last name — player types these manually.
- **Credit card & billing/delivery address**: Player cannot type freely. Instead, present a **dropdown of saved info** (mimicking browser autofill):
  - e.g., "Visa •••• 4242" / "Mastercard •••• 8888" for cards.
  - e.g., "123 Main St, Springfield, IL" / "456 Oak Ave, Austin, TX" for addresses.
  - Player picks from the dropdown — this is faster but still requires deliberate action.
- After completing the form, proceed to the manual storefront.

---

## Phase 3: Manual Shopping Mode (NEW)

**Goal:** Let the player experience a realistic online shopping checkout *without* an agent, establishing a baseline for comparison.

### 3a. Manual Storefront

- Inside the phone, show a **marketplace UI** styled to resemble real platforms (Taobao/JD/Amazon aesthetic — not separate tabs, just a unified store with realistic styling).
- Display **8 product cards** with:
  - **Real product images** (use actual product photos or high-quality illustrations).
  - Product name, price, star rating, shipping estimate.
  - Mix of products from verified and unverified/malicious sellers.
- Player is free to tap any product to view its detail page.
- Products span categories to feel realistic (electronics, accessories, etc.).

### 3b. Product Detail & Exploration

- Tapping a product opens a detail page showing:
  - Product image, full description, price, seller info, reviews.
  - For malicious seller products: suspicious clues are present (see Phase 6).
  - **"View Page Source" button** (or similar reveal mechanism) on every product page.
    - On legitimate sites: shows clean HTML.
    - On malicious sites: reveals the hidden prompt injection text.
    - **When a player discovers injected prompt text**, the side hint panel lights up:
      - "You found a hidden prompt injection! This invisible text is designed to trick AI agents into performing unauthorized actions. In real life, these are hidden in website HTML where humans can't see them but AI agents read them."
- Player can browse freely — exploring products and sellers is encouraged.

### 3c. Manual Checkout Flow

- Player selects a product → "Add to Cart" → Cart → Checkout:
  - **Human-in-the-loop confirmation**: Before finalizing, show a confirmation dialog:
    - "Checking out **[Product Name]** from **[Seller]** for **$XX.XX** using your Visa •••• 4242. Ship to 123 Main St. **Confirm purchase?**"
  - Player must explicitly confirm.
- After successful checkout, show order confirmation with receipt.
- **Side hint after checkout**: "That took N steps. You reviewed the seller, checked the price, and confirmed before paying. What if an AI agent handled all of this for you?"

### 3d. Side Hints (Manual Mode)

- Throughout manual mode, contextual hints appear beside the phone:
  - On entering storefront: "Browse freely! You're shopping manually — every click is a decision you control."
  - On viewing a product: "Notice the seller info, ratings, and URL. These are clues about trustworthiness."
  - On finding injected prompt: Educational message (see 3b above).
  - After checkout: Transition prompt to agent mode.
  - **Next step** guidance always visible at the bottom of the hint panel.

---

## Phase 4: Transition to Agent Mode (GUIDED)

**Goal:** Use outside-phone hints to guide the player into the AI agent experience.

- After manual checkout completes, a prominent side hint appears:
  - "Great job completing your purchase manually! Now let's see what happens when an AI agent does the shopping for you."
  - "The agent will browse, compare, and checkout — all automatically."
- Phone transitions to the **assistant chat interface**.
- **Product selection**: A **dropdown list** of the same 8 products from manual mode. Player picks what to shop for.

---

## Phase 5: Agent Mode with Guided Interactions (IMPROVED)

**Goal:** Make every step of the agent interaction obvious and educational, while allowing free exploration.

### 5a. Side-Panel Guided Hints

- Persistent hint panel beside the phone, updating contextually:
  - When agent starts scanning: "The agent is searching the web for the best deal. You have no control over which sites it visits."
  - When retailers appear: "The agent found these options. Notice which ones are verified and which aren't. Select one to proceed."
  - When agent automates checkout: "The agent is filling in your payment info and completing the purchase — automatically."
  - **Human-in-the-loop confirmation in agent mode**: Before the agent finalizes, show:
    - "Agent wants to check out **[Product]** from **[Seller]** for **$XX.XX** using Visa •••• 4242. **Approve?**"
    - Player must confirm (mirrors manual mode but shows the agent made the choices).
  - After a safe purchase: "The agent completed the purchase safely from a verified seller. But what happens with an unverified seller? Try selecting a different product and see what the agent does."
  - After an incident: "The agent was tricked by a prompt injection attack hidden in the website's HTML."
- Hints always include **"Next step"** guidance.

### 5b. Free Exploration in Agent Mode

- Player can select any product from the dropdown and go through the agent flow multiple times.
- **If player picks a safe/verified seller first**:
  - After completion, hint panel guides them: "Now try again — see what happens if the agent picks an unverified seller with a suspiciously low price."
  - Guide them to select a product that leads to a malicious site.
- **If player picks a malicious seller first**:
  - After the incident (unauthorized charges, security alerts), hint panel guides them:
    - "Let's understand what just happened. Go back to the malicious website and look for the hidden prompt."
    - Guide them to use "View Page Source" to see the injected text.
- After the player has seen the prompt injection (either by finding it themselves or being guided to it), proceed to quiz.

### 5c. Retailer Cards (Visual Improvements)

- Verified: green border, shield icon, "Verified Seller" badge.
- Unverified: no badge, subtle warning color.
- "Best Price" label on unverified sites remains (the honeypot).

---

## Phase 6: Suspicious Website Enhancements (ENHANCED)

**Goal:** Give players realistic, multi-layered clues that a website is suspicious.

| Clue | Implementation |
|------|---------------|
| **HTTP warning** | Show `http://` in the URL bar with a red "Not Secure" badge (like Chrome). Verified sites show `https://` with a green lock. |
| **Low ratings** | Verified sites: 4.5–4.8★ with thousands of reviews. Malicious sites: 2.1–3.2★ with few reviews. |
| **Complaint banners** | Malicious product pages show: "⚠️ 23 complaints filed in the last 30 days" |
| **Sketchy reviews** | Malicious sites: "Never received my order", "Charged twice", "Different product arrived" |
| **Domain age** | Malicious sites: "Domain registered 14 days ago" info |
| **Missing contact info** | Malicious sites: no phone number, no physical address, no return policy |
| **Fake discounts** | Crossed-out absurd "original price" (~~$899~~ → $199) |
| **Urgency tactics** | "Only 2 left! 47 people viewing this now!" |

### Prompt Injection Visibility

- **Default state**: Invisible text in reviews (as current implementation).
- **"View Page Source" button**: Available on all product pages. On malicious sites, reveals the injected text clearly highlighted in red with annotation.
- **After incident in agent mode**: Hint panel directs player back to the site to find it.
- **In final summary**: The injected text is shown with a full explanation of how it works.

---

## Phase 7: Quiz (IMPROVED)

- Triggered after the player has experienced both the agent incident and discovered the prompt injection.
- Questions:
  - "Who bears responsibility for this security incident?" (existing)
  - "What clue on the website should have raised suspicion?"
  - "What could the agent developer have done to prevent this?"
  - "What should you check before letting an agent make a purchase?"
- Each question shows an explanation after answering.
- Quiz appears inside the phone.

---

## Phase 8: Final Summary (REVISED)

**Goal:** Present comprehensive results in the side hint panel, not the phone.

### Side Hint Panel (Summary)

- **Score breakdown**: Total score with itemized events (deductions and why).
- **Security ranking**: Tier badge (Security Expert → Security Vulnerable).
- **Side-by-side comparison**: Manual checkout vs agent checkout:
  - Manual: N steps, M seconds, you controlled every decision.
  - Agent: 1 click, 5 seconds, agent made all decisions — and got tricked.
- **The prompt injection text** displayed with explanation of how it works.
- **Actionable takeaways**: "Before using an AI shopping agent, always: ..."
- **Decision timeline**: Each choice the player made with score impact.

### Phone (Summary)

- Clean, simple view with:
  - Security ranking badge and score (brief).
  - **"Try Again"** button — restarts the game.
  - **"Submit Score"** button — submits to leaderboard.

---

## Phase 9: UX & Component Architecture

### Side Hint System (`HintPanel` Component)

- Sits beside `PhoneSimulator` in a flex layout.
- Props: `title`, `body`, `nextStep`, `icon`, `position` (left/right).
- Animate in/out with transitions.
- In final summary phase, becomes the primary content area (large panel with score details).
- Responsive: on narrow screens, hints appear above/below or as overlays.

### Game Flow State Machine

Refactor `useRetailDemolition` to support:

```
intro → billing → manual-storefront → manual-product → manual-checkout → manual-confirmation
  → transition → agent-chat → agent-browse → agent-confirmation → [incident?]
  → prompt-discovery → quiz → summary
```

Each phase maps to specific hint content and phone UI.

### Layout

- Current: phone centered on page.
- New: phone centered with hint panel(s) on sides (flex layout).
- Hint panel width: ~300–400px.

### Product Data

- Expand from 3 to **8 products** with real images.
- Each product has pricing across verified and unverified sellers.
- Use real product photos (source from public domain or create realistic placeholders).

---

## Implementation Priority

| Priority | Item | Effort |
|----------|------|--------|
| **P0** | HintPanel component + layout system | Medium |
| **P0** | Manual storefront with 8 products + real images | High |
| **P0** | Manual checkout with human-in-the-loop confirmation | Medium |
| **P0** | Pre-game intro screen | Low |
| **P0** | Billing form with browser-autofill-style dropdowns | Medium |
| **P1** | Agent mode guided hints (contextual) | Medium |
| **P1** | Product dropdown in agent mode | Low |
| **P1** | Human-in-the-loop confirmation in agent mode | Low |
| **P1** | Suspicious site enhancements (HTTP, ratings, reviews) | Medium |
| **P1** | "View Page Source" + prompt injection discovery flow | Medium |
| **P1** | Final summary in side panel + phone Try Again/Submit | Medium |
| **P2** | Quiz improvements (more questions + explanations) | Low |
| **P2** | Free exploration guidance (hints adapting to player choices) | Medium |
| **P3** | Mobile responsive layout | Medium |
| **P3** | Intro carousel animation | Low |

---

## Resolved Decisions

1. ~~Platforms~~: No separate Taobao/JD/Amazon tabs. One unified storefront styled realistically.
2. Manual checkout is **required** before agent mode.
3. No timer or progress bar. Score is **hidden** during gameplay.
4. No hint toggle for now.
5. Scoring system stays similar in spirit — see `SCORING_SCHEMA.md`. Educational focus, not punitive.
