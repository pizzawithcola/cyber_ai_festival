import React from 'react'
import { DataShadowsLayoutProvider, useDataShadowsLayout } from './DataShadowsLayoutContext'
import RealApplePhone from './components/RealApplePhone'
import './DataShadows.css'

function DataShadowsContent() {
  const { isTruthRevealFinalStep, setRightSlotEl } = useDataShadowsLayout()

  // Always render the same structure so the phone never remounts when switching to final step.
  // When not final step, right column is hidden so layout stays stable and TruthReveal state is preserved.
  return (
    <div
      className={`data-shadows-container ${isTruthRevealFinalStep ? 'data-shadows-reveal-layout' : 'data-shadows-phone-only'}`}
    >
      <div className="phone-panel">
        <RealApplePhone />
      </div>
      <div
        ref={setRightSlotEl}
        className={`truth-reveal-right ${isTruthRevealFinalStep ? 'truth-reveal-right-visible' : ''}`}
        aria-hidden={!isTruthRevealFinalStep}
      />
    </div>
  )
}

const DataShadows: React.FC = () => {
  return (
    <DataShadowsLayoutProvider>
      <DataShadowsContent />
    </DataShadowsLayoutProvider>
  )
}

export default DataShadows
