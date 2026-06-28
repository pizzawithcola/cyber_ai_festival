# Data Shadows Vertical Adjustments Design

## Scope

This design covers the next round of `DataShadows` updates with a strict split between:

- `vertical-only` layout changes
- shared content and behavior fixes that should apply in both portrait and landscape

The goal is to improve portrait touchscreen presentation without regressing the current horizontal layout.

## Approved Requirements

1. In portrait mode, the player instructions (`Mission Brief`) should appear above the phone instead of below it.
2. The lifestyle/exercise question should become a real workout-duration question.
3. The workout-duration slider should use realistic minute-based values from `0` to `480 mins` (0-8 hours).
4. The missing `out` in `work out` / `workout` copy should be corrected.
5. In portrait mode, the dataflow feedback/info should appear above the graph, with the graph below it.
6. The dataflow feedback text should include attention-grabbing icons.

## Design Decisions

### 1. Vertical-only instruction layout

The portrait `Mission Brief` layout will be reordered so the instruction panel renders before the phone in the stacked layout.

- Portrait only: instructions above phone
- Landscape only: keep current side-by-side behavior
- Content remains the same, but portrait spacing can be tightened for scanability

This preserves the current horizontal layout while matching the touchscreen presentation request.

### 2. Shared survey content fix

The current survey question that asks about work hours will be changed to a workout-duration question.

New behavior:

- Replace the prompt with a workout-duration prompt
- Replace hour-based display with minute-based display
- Use a `0-480` range
- Use a realistic step increment suitable for fitness duration selection

This is a shared content fix and should apply in both orientations because the phone UI is reused.

### 3. Shared copy correction

The missing `out` / inconsistent `workout` wording will be corrected wherever the affected lifestyle/exercise copy appears.

This is also shared content, not orientation-specific.

### 4. Vertical-only dataflow feedback order

Portrait final-state dataflow layout will be reordered so:

1. feedback/info panel appears first
2. graph/diagram appears second

Landscape layout remains unchanged.

The portrait info block will also gain a few high-signal icons to improve attention and scannability without turning it into a decorative card-heavy panel.

## Files Expected To Change

- `src/pages/3_DataShadows/DataShadows.tsx`
- `src/pages/3_DataShadows/DataShadows.css`
- `src/pages/3_DataShadows/components/DataShadowsSidebar.tsx`
- `src/pages/3_DataShadows/components/fitai/RegistrationSurvey.tsx`
- `src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.tsx`
- `src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.css`
- `scripts/check-data-shadows-layout.mjs`

## Testing Strategy

Because there is no dedicated test harness for this flow, verification will use a lightweight source-level regression check plus build/lint and viewport validation.

Plan:

1. Add a failing layout/content assertion to `scripts/check-data-shadows-layout.mjs`
2. Implement the minimal changes needed to satisfy the approved design
3. Run:
   - `node scripts/check-data-shadows-layout.mjs`
   - `npm exec eslint -- ...`
   - `npm run build`
4. Re-check portrait rendering using browser automation/screenshots for:
   - instructions above phone
   - workout slider in minutes
   - feedback above graph in portrait final state

## Self-Review

- No placeholders remain
- Vertical-only vs shared changes are explicitly separated
- Scope is limited to the approved prompt
- Horizontal layout preservation is explicit
