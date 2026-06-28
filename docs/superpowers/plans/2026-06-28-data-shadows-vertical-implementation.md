# Data Shadows Vertical Adjustments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `DataShadows` experience so portrait/touchscreen layouts place instructions above the phone and dataflow feedback above the graph, while shared survey/dataflow copy switches from work-hours to workout-duration minutes.

**Architecture:** Keep horizontal styling intact and scope layout changes to portrait-specific selectors and render order. Apply the workout-duration change in the shared FitAI survey/data-flow model so the phone flow and downstream diagram logic stay consistent.

**Tech Stack:** React, TypeScript, CSS, Vite, lucide-react, Node.js source-level regression script

## Global Constraints

- Portrait-only layout changes must not regress the horizontal `DataShadows` experience.
- The intro layout should remain in its restored centered composition and only scale responsively.
- The workout question must use a realistic `0-480 mins` range and minute-based display text.
- Dataflow feedback in portrait final state must render above the graph and include icons to improve scanability.
- Verification must include a failing-first source regression check, targeted linting, and a production build.

---

### Task 1: Lock the requested behavior into the regression script

**Files:**
- Modify: `scripts/check-data-shadows-layout.mjs`
- Test: `scripts/check-data-shadows-layout.mjs`

**Interfaces:**
- Consumes: current source files under `src/pages/3_DataShadows/**`
- Produces: assertions that fail until portrait ordering, minute-based workout copy, and dataflow icon/ordering support exist

- [ ] **Step 1: Write the failing test**

```js
const surveyTsx = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/RegistrationSurvey.tsx', import.meta.url), 'utf8')
const flowTsx = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.tsx', import.meta.url), 'utf8')
const flowCss = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.css', import.meta.url), 'utf8')

assert.match(css, /order:\s*1[\s\S]*data-shadows-side-panel/, 'Expected portrait instructions to move above the phone')
assert.match(surveyTsx, /How many minutes do you workout per day\?/, 'Expected workout-duration prompt')
assert.match(surveyTsx, /min="0"[\s\S]*max="480"/, 'Expected 0-480 minute slider range')
assert.match(flowCss, /data-shadows-diagram-only-portrait[\s\S]*grid-template-areas:\s*"info"[\s\S]*"visual"/, 'Expected portrait dataflow info above the graph')
assert.match(flowTsx, /flow-node-icon|OverviewCard/, 'Expected icons in dataflow feedback content')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-data-shadows-layout.mjs`
Expected: `AssertionError` for the new portrait/workout/dataflow requirements

- [ ] **Step 3: Write minimal implementation in the script**

```js
const surveyTsx = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/RegistrationSurvey.tsx', import.meta.url), 'utf8')
const flowTsx = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.tsx', import.meta.url), 'utf8')
const flowCss = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.css', import.meta.url), 'utf8')

assert.match(surveyTsx, /workoutMinutes/, 'Expected survey state to store workout minutes')
assert.match(flowTsx, /ShieldAlert|Clock3|ArrowRightLeft|Sparkles/, 'Expected scanability icons in dataflow text')
```

- [ ] **Step 4: Run test to verify it passes after later code changes**

Run: `node scripts/check-data-shadows-layout.mjs`
Expected: exit code `0`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-data-shadows-layout.mjs
git commit -m "test: cover data shadows vertical adjustments"
```

### Task 2: Replace work-hours collection with workout-duration minutes

**Files:**
- Modify: `src/pages/3_DataShadows/components/fitai/RegistrationSurvey.tsx`
- Modify: `src/pages/3_DataShadows/components/fitai/dataFlowLogic.ts`
- Test: `scripts/check-data-shadows-layout.mjs`

**Interfaces:**
- Consumes: `QuestionData` and `SurveyData` field definitions, current FitAI survey step sequence
- Produces: shared `workoutMinutes?: number` survey field used by survey completion and dataflow field mapping

- [ ] **Step 1: Write the failing test**

```js
assert.match(surveyTsx, /workoutMinutes/, 'Expected survey state to store workout duration in minutes')
assert.match(surveyTsx, /0 mins/, 'Expected minute-based zero state')
assert.match(dataFlowLogicTs, /workoutMinutes/, 'Expected data-flow logic to receive workout minutes')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-data-shadows-layout.mjs`
Expected: FAIL because the code still uses `workHours`

- [ ] **Step 3: Write minimal implementation**

```tsx
interface QuestionData {
  workoutMinutes?: number
}

case 3:
  return data.workoutMinutes !== undefined

<QuestionCard
  title="When do you usually make time to workout?"
  description="Tell us how much exercise fits into your typical day."
  hint="Workout duration helps shape coaching intensity and timing."
  dataCollection="Workout duration data used for recommendation timing, engagement analysis, and behavioral profiling"
>
  <label>How many minutes do you workout per day?</label>
  <span>{data.workoutMinutes ?? 0} mins</span>
  <input min="0" max="480" step="15" value={data.workoutMinutes ?? 0} />
</QuestionCard>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-data-shadows-layout.mjs`
Expected: the workout-duration assertions pass

- [ ] **Step 5: Commit**

```bash
git add src/pages/3_DataShadows/components/fitai/RegistrationSurvey.tsx src/pages/3_DataShadows/components/fitai/dataFlowLogic.ts scripts/check-data-shadows-layout.mjs
git commit -m "feat: switch data shadows workout question to minutes"
```

### Task 3: Apply portrait-only ordering changes and add dataflow icons

**Files:**
- Modify: `src/pages/3_DataShadows/DataShadows.tsx`
- Modify: `src/pages/3_DataShadows/DataShadows.css`
- Modify: `src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.tsx`
- Modify: `src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.css`
- Test: `scripts/check-data-shadows-layout.mjs`

**Interfaces:**
- Consumes: `showSidebarNotice`, `isPortraitViewport`, final-state portrait class names, current dataflow overview/detail rendering
- Produces: portrait render order that places instructions before the phone and info before the diagram, plus icon-enhanced overview/detail content

- [ ] **Step 1: Write the failing test**

```js
assert.match(dataShadowsTsx, /hasPortraitSidebarLayout[\s\S]*<DataShadowsSidebar \/>[\s\S]*<RealApplePhone \/>/, 'Expected portrait render order to place instructions before the phone')
assert.match(flowCss, /grid-template-areas:\s*"info"\s*"visual"/, 'Expected portrait final grid areas for info then graph')
assert.match(flowTsx, /flow-node-section-label|flow-node-overview-icon/, 'Expected icon-bearing dataflow text markup')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-data-shadows-layout.mjs`
Expected: FAIL until portrait order and icon markup are implemented

- [ ] **Step 3: Write minimal implementation**

```tsx
{hasPortraitSidebarLayout && showSidebarNotice ? (
  <>
    <div className="data-shadows-side-panel data-shadows-side-panel-visible"><DataShadowsSidebar /></div>
    <div className="phone-panel"><RealApplePhone /></div>
  </>
) : (
  <>
    <div className="phone-panel"><RealApplePhone /></div>
    <div className="data-shadows-side-panel">{!isTruthRevealFinalStep && showSidebarNotice ? <DataShadowsSidebar /> : null}</div>
  </>
)}
```

```css
.data-shadows-diagram-only-layout.data-shadows-diagram-only-portrait .network-data-flow-body {
  grid-template-areas:
    "info"
    "visual";
}

.data-shadows-diagram-only-layout.data-shadows-diagram-only-portrait .data-flow-info-strip {
  grid-area: info;
}

.data-shadows-diagram-only-layout.data-shadows-diagram-only-portrait .network-visual-panel {
  grid-area: visual;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-data-shadows-layout.mjs`
Expected: exit code `0`

- [ ] **Step 5: Commit**

```bash
git add src/pages/3_DataShadows/DataShadows.tsx src/pages/3_DataShadows/DataShadows.css src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.tsx src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.css scripts/check-data-shadows-layout.mjs
git commit -m "feat: tune data shadows portrait layout"
```

## Self-Review

- Spec coverage:
  - Portrait instructions above phone: Task 3
  - Workout-duration slider and wording: Task 2
  - Portrait info above graph: Task 3
  - Dataflow icons: Task 3
  - Regression proof: Task 1
- Placeholder scan: no `TODO`, `TBD`, or implied future work remains
- Type consistency: `workoutMinutes` is the shared field name across survey state, data-flow logic, and regression checks
