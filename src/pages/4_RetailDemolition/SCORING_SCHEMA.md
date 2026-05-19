# Retail Demolition — Scoring Schema

## Overview

- Score starts at **100** and is reduced by deductions.
- Score is **hidden** throughout gameplay — only revealed in the final summary.
- The game is educational, not punitive. Most deductions are small; major deductions only for clearly risky choices in agent mode.

---

## Deduction Events

### Agent Mode — Retailer Selection

| Event | Deduction | Rationale |
|-------|-----------|-----------|
| Selected malicious/unverified site on **first try** in agent mode | **-30** | Core lesson: trusting an agent blindly with an unverified seller is risky. |
| Selected malicious site **after being guided to try it** (educational) | **0** | Player was told to explore — no penalty for following instructions. |
| Selected verified/safe site | **0** | Good choice, no deduction. |

### Agent Mode — Decision Timing

| Event | Deduction | Rationale |
|-------|-----------|-----------|
| Made decision too fast (< 3 seconds) | **-10** | Not reading/evaluating the options. |
| Slow reaction to malicious incident (5–12s after alerts) | **-5** | Didn't notice warning signs quickly. |
| Very slow reaction to malicious incident (> 12s) | **-10** | Ignored warning signs for too long. |

### Human-in-the-Loop Confirmation

| Event | Deduction | Rationale |
|-------|-----------|-----------|
| Approved agent checkout to malicious site without hesitation (< 2s) | **-5** | Rubber-stamping the confirmation defeats the purpose of human-in-the-loop. |
| Approved agent checkout to malicious site after reviewing (≥ 2s) | **0** | At least they paused to think (even if they still approved). |

### Manual Mode — Exploration

| Event | Deduction | Rationale |
|-------|-----------|-----------|
| All manual mode actions | **0** | Manual mode is for learning. No penalties. |
| Discovered prompt injection via "View Page Source" | **0** (bonus context in summary) | Rewarded with educational content, not points. |

### Post-Incident Behavior

| Event | Deduction | Rationale |
|-------|-----------|-----------|
| Skipped post-incident inspection (never viewed page source on a malicious site) | **-10** | Missed the educational opportunity to see the actual attack code. |
| Inspected the malicious site and found the prompt injection (manual mode or post-incident) | **0** | Completed the learning objective. |

### Quiz

| Answer to "Who bears responsibility?" | Deduction | Rationale |
|---------------------------------------|-----------|-----------|
| "All of the Above" (correct) | **0** | Understands shared responsibility. |
| "The Attacker" | **-5** | Partially correct but incomplete view. |
| "The Developer" | **-10** | Shifting all blame to one party. |
| "The Platform" | **-10** | Shifting all blame to one party. |
| "The User" | **-15** | Misses the systemic nature of the problem. |

*Additional quiz questions (new) will follow similar small deductions for incorrect answers, with 0 for correct.*

---

## Score Ranges & Rankings

| Score | Rank | Color |
|-------|------|-------|
| 90–100 | Security Expert | Green |
| 70–89 | Security Aware | Blue |
| 50–69 | Security Conscious | Yellow |
| 30–49 | Security Risk | Orange |
| 0–29 | Security Vulnerable | Red |

---

## Summary Display

The final summary (shown in the side hint panel) includes:

1. **Total score** with rank badge.
2. **Itemized score events**: Each deduction listed with reason and timestamp.
3. **Decision timeline**: Every choice the player made, with context (manual vs agent, which seller, time taken).
4. **Manual vs Agent comparison**: Steps taken, time spent, outcome.
5. **Educational takeaways**: What they learned, what to watch for in real life.

---

## Design Notes

- The scoring system rewards **awareness and careful evaluation**, not speed or gaming skill.
- Players who explore thoroughly in manual mode, pause to read in agent mode, and engage with the educational content will naturally score higher.
- The "free exploration" after a guided malicious attempt ensures every player sees the prompt injection — the difference is whether they found it themselves or were shown it.
- Human-in-the-loop confirmation deductions are intentionally small — the point is to show that even with confirmation dialogs, people rubber-stamp them.
