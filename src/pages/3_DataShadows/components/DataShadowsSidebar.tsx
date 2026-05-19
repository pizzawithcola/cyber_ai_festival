import React from 'react'

const steps = [
  { step: '01', title: 'Open the FitAI app' },
  { step: '02', title: 'Select "Start Free" or "Register Now"' },
  { step: '03', title: 'Review default permissions' },
]

const watchItems = ['Pre-selected consent', 'Friction imbalance', 'Data sharing']

const DataShadowsSidebar: React.FC = () => {
  return (
    <aside className="data-shadows-sidebar-card">
      <header className="data-shadows-sidebar-hero">
        <div className="data-shadows-sidebar-pill">Mission Brief</div>
        <h2 className="data-shadows-sidebar-title">Begin with the FitAI app.</h2>
        <p className="data-shadows-sidebar-lead">
          Proceed through the registration flow and observe how default settings shape consent decisions.
        </p>
      </header>

      <section className="data-shadows-sidebar-section data-shadows-sidebar-note">
        <h3 className="data-shadows-sidebar-subtitle">Important</h3>
        <p className="data-shadows-sidebar-copy">
          Please use fictitious information only. This simulation is intended for educational purposes.
        </p>
      </section>

      <section className="data-shadows-sidebar-flow">
        <div className="data-shadows-sidebar-flow-header">
          <h3 className="data-shadows-sidebar-subtitle">How to Start</h3>
        </div>

        <div className="data-shadows-sidebar-steps">
          {steps.map((item) => (
            <div key={item.step} className="data-shadows-sidebar-step">
              <div className="data-shadows-sidebar-step-number">{item.step}</div>
              <div className="data-shadows-sidebar-step-title">{item.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="data-shadows-sidebar-watch">
        <h3 className="data-shadows-sidebar-subtitle">Key Focus</h3>
        <div className="data-shadows-sidebar-watch-list">
          {watchItems.map((item) => (
            <span key={item} className="data-shadows-sidebar-watch-chip">{item}</span>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default DataShadowsSidebar
