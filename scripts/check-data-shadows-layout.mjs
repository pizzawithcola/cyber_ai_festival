import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tsx = readFileSync(new URL('../src/pages/3_DataShadows/DataShadows.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/pages/3_DataShadows/DataShadows.css', import.meta.url), 'utf8')
const surveyTsx = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/RegistrationSurvey.tsx', import.meta.url), 'utf8')
const dataFlowLogicTs = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/dataFlowLogic.ts', import.meta.url), 'utf8')
const flowTsx = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.tsx', import.meta.url), 'utf8')
const flowCss = readFileSync(new URL('../src/pages/3_DataShadows/components/fitai/NetworkDataFlowDiagram.css', import.meta.url), 'utf8')

assert.match(
  tsx,
  /const hasPortraitSidebarLayout = isPortraitViewport && showSidebarNotice/,
  'Expected portrait sidebar layouts to be identified explicitly in DataShadows.tsx'
)

assert.match(
  tsx,
  /showSidebarNotice && !isPortraitViewport/,
  'Expected landscape sidebar width reserve to stop applying in portrait layouts'
)

assert.match(
  tsx,
  /--data-shadows-portrait-sidebar-height/,
  'Expected portrait sidebar height to be computed from the viewport'
)

assert.doesNotMatch(
  css,
  /\.data-shadows-intro-shell\s*\{[\s\S]*?(?:^|\n)\s*height:\s*calc\(100dvh\s*-\s*var\(--data-shadows-stage-padding-y\)\s*\*\s*2\)/m,
  'Expected intro shell to keep its original centered composition instead of stretching to full viewport height'
)

assert.doesNotMatch(
  css,
  /\.data-shadows-intro-content\s*\{[^}]*grid-template-rows:/m,
  'Expected intro content to keep the original flow layout instead of forcing a full-height grid'
)

assert.match(
  css,
  /\.data-shadows-intro-stage\s*\{[^}]*min-height:\s*clamp\([^)]+dvh[^)]*\)/m,
  'Expected intro stage height to scale with viewport height using clamp()'
)

assert.match(
  css,
  /\.data-shadows-intro-line\s*\{[^}]*font-size:\s*clamp\([^)]+dvh[^)]*\)/m,
  'Expected intro headline text to scale with viewport height using clamp()'
)

assert.match(
  css,
  /\.data-shadows-portrait-stage\.data-shadows-sidebar-layout\s*\{[\s\S]*?grid-template-rows:\s*minmax\(0,\s*var\(--data-shadows-portrait-sidebar-height\)\)\s+minmax\(0,\s*var\(--data-shadows-phone-height\)\)/,
  'Expected portrait sidebar layout to place the mission panel above the phone'
)

assert.match(
  css,
  /\.data-shadows-portrait-stage\.data-shadows-sidebar-layout\s+\.data-shadows-side-panel\s*\{[\s\S]*?height:\s*var\(--data-shadows-portrait-sidebar-height\)/,
  'Expected portrait mission panel height to be driven by the responsive sidebar height variable'
)

assert.match(
  css,
  /\.data-shadows-portrait-stage\.data-shadows-sidebar-layout\s+\.data-shadows-side-panel\s*\{[\s\S]*?order:\s*1/,
  'Expected portrait mission panel to render before the phone'
)

assert.match(
  css,
  /\.data-shadows-portrait-stage\.data-shadows-sidebar-layout\s+\.phone-panel\s*\{[\s\S]*?order:\s*2/,
  'Expected portrait phone panel to render after the instructions panel'
)

assert.match(
  surveyTsx,
  /workoutMinutes\?: number/,
  'Expected the survey to store workout duration in minutes'
)

assert.match(
  surveyTsx,
  /How many minutes[\s\S]*workout/i,
  'Expected the lifestyle question to ask about workout duration instead of work hours'
)

assert.match(
  surveyTsx,
  /min="0"[\s\S]*max="480"[\s\S]*step="15"/,
  'Expected the workout-duration slider to use a 0-480 minute range with realistic steps'
)

assert.match(
  surveyTsx,
  /workoutMinutes[^]*mins/i,
  'Expected the workout-duration step to display values in minutes'
)

assert.match(
  dataFlowLogicTs,
  /workoutMinutes\?: number/,
  'Expected shared data-flow logic to track workout duration in minutes'
)

assert.match(
  dataFlowLogicTs,
  /push\('workoutMinutes'\)/,
  'Expected workout-duration minutes to feed into downstream data-flow nodes'
)

assert.match(
  flowCss,
  /\.data-shadows-diagram-only-layout\.data-shadows-diagram-only-portrait\s+\.network-data-flow-body\s*\{[\s\S]*?grid-template-areas:\s*"info"\s*"visual"/,
  'Expected portrait final dataflow layout to place the info panel above the graph'
)

assert.match(
  flowCss,
  /\.data-shadows-diagram-only-layout\.data-shadows-diagram-only-portrait\s+\.data-flow-info-strip\s*\{[\s\S]*?grid-area:\s*info/,
  'Expected portrait final dataflow info strip to occupy the top grid area'
)

assert.match(
  flowCss,
  /\.data-shadows-diagram-only-layout\.data-shadows-diagram-only-portrait\s+\.network-visual-panel\s*\{[\s\S]*?grid-area:\s*visual/,
  'Expected portrait final dataflow graph to occupy the lower grid area'
)

assert.match(
  flowTsx,
  /flow-node-overview-item-icon/,
  'Expected overview feedback items to include icons'
)

assert.match(
  flowTsx,
  /flow-node-section-label/,
  'Expected selected dataflow feedback sections to include icon labels'
)
