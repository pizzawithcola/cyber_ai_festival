import React from 'react'
import { DataShadowsLayoutProvider, useDataShadowsLayout } from './DataShadowsLayoutContext'
import RealApplePhone from './components/RealApplePhone'
import DataShadowsIntro from './components/DataShadowsIntro'
import DataShadowsSidebar from './components/DataShadowsSidebar'
import './DataShadows.css'

function DataShadowsContent() {
  const {
    isTruthRevealFinalStep,
    setRightSlotEl,
    showIntroOverlay,
    completeIntro,
    showSidebarNotice,
    isPhoneRecentering,
  } = useDataShadowsLayout()

  const layoutClassName = isTruthRevealFinalStep
    ? 'data-shadows-reveal-layout'
    : showSidebarNotice
      ? 'data-shadows-sidebar-layout'
      : 'data-shadows-phone-only'

  return (
    <>
      <div className={`data-shadows-container ${layoutClassName}`}>
        <div className={`phone-panel ${isPhoneRecentering ? 'phone-panel-recentering' : ''} ${isTruthRevealFinalStep ? 'phone-panel-truth-reveal' : ''}`}>
          <RealApplePhone />
        </div>
        <div
          ref={setRightSlotEl}
          className={[
            'data-shadows-side-panel',
            isTruthRevealFinalStep ? 'truth-reveal-right-visible' : '',
            showSidebarNotice ? 'data-shadows-side-panel-visible' : '',
          ].filter(Boolean).join(' ')}
          aria-hidden={!(isTruthRevealFinalStep || showSidebarNotice)}
        >
          {!isTruthRevealFinalStep && showSidebarNotice ? <DataShadowsSidebar /> : null}
        </div>
      </div>
      {showIntroOverlay ? <DataShadowsIntro onComplete={completeIntro} /> : null}
    </>
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
