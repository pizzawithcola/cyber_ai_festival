import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tsx = readFileSync(new URL('../src/pages/3_DataShadows/DataShadows.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/pages/3_DataShadows/DataShadows.css', import.meta.url), 'utf8')

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
  /\.data-shadows-portrait-stage\.data-shadows-sidebar-layout\s*\{[\s\S]*?grid-template-rows:\s*minmax\(0,\s*var\(--data-shadows-phone-height\)\)\s+minmax\(0,\s*var\(--data-shadows-portrait-sidebar-height\)\)/,
  'Expected portrait sidebar layout to split viewport height between the phone and mission panel'
)

assert.match(
  css,
  /\.data-shadows-portrait-stage\.data-shadows-sidebar-layout\s+\.data-shadows-side-panel\s*\{[\s\S]*?height:\s*var\(--data-shadows-portrait-sidebar-height\)/,
  'Expected portrait mission panel height to be driven by the responsive sidebar height variable'
)
