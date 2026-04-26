import React from 'react'

const DataShadowsSidebar: React.FC = () => {
  return (
    <aside className="data-shadows-sidebar-card">
      <section className="data-shadows-sidebar-section">
        <h2 className="data-shadows-sidebar-title">Before You Start</h2>
        <p className="data-shadows-sidebar-copy">
          This round focuses on what people miss when they rush through Terms &amp; Conditions and leave every consent switch on.
        </p>
      </section>

      <section className="data-shadows-sidebar-section">
        <h3 className="data-shadows-sidebar-subtitle">Simulation Notice</h3>
        <p className="data-shadows-sidebar-copy">
          Do <strong>not</strong> enter real personal information. Everything inside this experience is simulated for learning, and the goal is to notice how quickly convenience can override privacy judgment.
        </p>
      </section>

      <section className="data-shadows-sidebar-section">
        <h3 className="data-shadows-sidebar-subtitle">How To Begin</h3>
        <p className="data-shadows-sidebar-copy">
          Tap the <strong>FitAI</strong> icon, then choose <strong>Start Free</strong> or <strong>Register Now</strong>. Once you commit, the phone will slide back to center and the main experience will begin.
        </p>
      </section>

      <section className="data-shadows-sidebar-section data-shadows-sidebar-stat-block">
        <div className="data-shadows-sidebar-stat-label">Recent Reality</div>
        <p className="data-shadows-sidebar-copy">
          A 2024 <strong>International Consumer Protection and Enforcement Network</strong> (ICPEN) sweep found <strong>75.7%</strong> of <strong>642</strong> subscription sites and apps used at least one dark pattern, making the fast “accept all” path much easier than informed consent.
        </p>
      </section>
    </aside>
  )
}

export default DataShadowsSidebar
