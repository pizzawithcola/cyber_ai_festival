import React, { useEffect, useState } from 'react'

interface DataShadowsStartGateProps {
  onStart: () => void
}

const steps = [
  { step: '01', title: 'Open the FitAI app' },
  { step: '02', title: 'Tap "Start 7-day Trial"' },
  { step: '03', title: 'Accept the terms — watch the default toggles' },
  { step: '04', title: 'Register an account and fill in your profile' },
  { step: '05', title: 'See where your data flows' },
]

const DataShadowsStartGate: React.FC<DataShadowsStartGateProps> = ({ onStart }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setVisible(true), 60)
    return () => window.clearTimeout(enterTimer)
  }, [])

  return (
    <div
      className={`data-shadows-intro-overlay data-shadows-start-gate-overlay ${visible ? 'data-shadows-intro-overlay-visible' : ''}`}
    >
      <div className="data-shadows-intro-shell data-shadows-start-gate-shell">
        <div className="data-shadows-intro-frame" />

        <div className="data-shadows-intro-content data-shadows-start-gate-content">
          <div className="data-shadows-start-gate-kicker-row">
            <div className="data-shadows-intro-kicker">Data Shadows</div>
            <div className="data-shadows-start-gate-pill">Mission Brief</div>
          </div>

          <div className="data-shadows-start-gate-stage">
            <div className="data-shadows-start-gate-title">
              Begin with the <span className="data-shadows-intro-highlight">FitAI</span> app.
            </div>
          </div>

          <div className="data-shadows-start-gate-note">
            <div className="data-shadows-start-gate-note-label">Important</div>
            <p className="data-shadows-start-gate-note-copy">
              Please use fictitious information only. This simulation is intended for educational purposes.
            </p>
          </div>

          <div className="data-shadows-start-gate-steps">
            <div className="data-shadows-start-gate-steps-label">How to Start</div>
            <div className="data-shadows-start-gate-steps-list">
              {steps.map((item) => (
                <div key={item.step} className="data-shadows-start-gate-step">
                  <div className="data-shadows-start-gate-step-number">{item.step}</div>
                  <div className="data-shadows-start-gate-step-title">{item.title}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="data-shadows-intro-footer data-shadows-start-gate-footer">
            <button
              type="button"
              className="data-shadows-intro-nav-btn data-shadows-start-gate-btn"
              onClick={onStart}
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataShadowsStartGate
