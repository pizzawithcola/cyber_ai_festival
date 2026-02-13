import React, { useState } from 'react'

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    locationTracking: false,
    dataSharing: true,
    analytics: true,
    socialSharing: false,
    heartRateSync: true,
    publicProfile: true,
  })

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="settings-container">
      {/* Privacy & Security Section */}
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">🔒</div>
          <h2 className="section-title">Privacy & Security</h2>
        </div>
        
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Notifications</div>
              <div className="setting-description">Receive app notifications</div>
            </div>
            <div
              className={`toggle-switch ${settings.notifications ? 'active' : ''}`}
              onClick={() => toggleSetting('notifications')}
            >
              <div className="toggle-slider" />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Location Tracking</div>
              <div className="setting-description">Track workout locations</div>
            </div>
            <div
              className={`toggle-switch ${settings.locationTracking ? 'active' : ''}`}
              onClick={() => toggleSetting('locationTracking')}
            >
              <div className="toggle-slider" />
            </div>
          </div>

          <div className="setting-item clickable">
            <div className="setting-info">
              <div className="setting-label">📍 Location Permissions</div>
              <div className="setting-description">Precise location: Allow</div>
            </div>
            <div className="chevron">›</div>
          </div>
        </div>
      </div>

      {/* Data Collection Section */}
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">📊</div>
          <h2 className="section-title">Data & Analytics</h2>
        </div>
        
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Share Usage Analytics</div>
              <div className="setting-description">Help us improve the app</div>
            </div>
            <div
              className={`toggle-switch ${settings.analytics ? 'active' : ''}`}
              onClick={() => toggleSetting('analytics')}
            >
              <div className="toggle-slider" />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Share Health Data</div>
              <div className="setting-description">Share anonymized health data</div>
            </div>
            <div
              className={`toggle-switch ${settings.dataSharing ? 'active' : ''}`}
              onClick={() => toggleSetting('dataSharing')}
            >
              <div className="toggle-slider" />
            </div>
          </div>

          <div className="setting-item clickable">
            <div className="setting-info">
              <div className="setting-label">📱 Sync With Devices</div>
              <div className="setting-description">Apple Watch, Fitbit, Garmin</div>
            </div>
            <div className="chevron">›</div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Sync Heart Rate Data</div>
              <div className="setting-description">Real-time heart rate monitoring</div>
            </div>
            <div
              className={`toggle-switch ${settings.heartRateSync ? 'active' : ''}`}
              onClick={() => toggleSetting('heartRateSync')}
            >
              <div className="toggle-slider" />
            </div>
          </div>
        </div>
      </div>

      {/* Social & Network Section */}
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">👥</div>
          <h2 className="section-title">Social & Network</h2>
        </div>
        
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Public Profile</div>
              <div className="setting-description">Make your profile visible</div>
            </div>
            <div
              className={`toggle-switch ${settings.publicProfile ? 'active' : ''}`}
              onClick={() => toggleSetting('publicProfile')}
            >
              <div className="toggle-slider" />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Share Achievements</div>
              <div className="setting-description">Share your fitness milestones</div>
            </div>
            <div
              className={`toggle-switch ${settings.socialSharing ? 'active' : ''}`}
              onClick={() => toggleSetting('socialSharing')}
            >
              <div className="toggle-slider" />
            </div>
          </div>

          <div className="setting-item clickable">
            <div className="setting-info">
              <div className="setting-label">🌐 Connected Accounts</div>
              <div className="setting-description">Facebook, Instagram, TikTok</div>
            </div>
            <div className="chevron">›</div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">💾</div>
          <h2 className="section-title">Data Management</h2>
        </div>
        
        <div className="settings-list">
          <div className="setting-item clickable">
            <div className="setting-info">
              <div className="setting-label">📥 Download My Data</div>
              <div className="setting-description">Export all your data in JSON format</div>
            </div>
            <div className="chevron">›</div>
          </div>

          <div className="setting-item clickable delete-item">
            <div className="setting-info">
              <div className="setting-label">🗑️ Delete Account</div>
              <div className="setting-description">Permanently delete your account</div>
            </div>
            <div className="chevron">›</div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <div className="notice-header">
          <div className="notice-icon">🔔</div>
          <div className="notice-title">Privacy & Data Notice</div>
        </div>
        <div className="notice-content">
          <p>• Your fitness data (workouts, body measurements, health metrics) is stored on our servers</p>
          <p>• We use AI/ML models to analyze your data and provide personalized recommendations</p>
          <p>• Data may be anonymized and shared with partners for research purposes</p>
          <p>• Location data is collected for workout tracking and route analysis</p>
          <p>• Device connections enable real-time health data synchronization</p>
          <p>• By using FitAI, you consent to comprehensive data collection and processing</p>
        </div>
      </div>

      {/* About & Support */}
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">ℹ️</div>
          <h2 className="section-title">About & Support</h2>
        </div>
        
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">App Version</div>
              <div className="setting-description">3.2.1</div>
            </div>
          </div>

          <div className="setting-item clickable">
            <div className="setting-info">
              <div className="setting-label">📖 Privacy Policy</div>
              <div className="setting-description">View full privacy policy</div>
            </div>
            <div className="chevron">›</div>
          </div>

          <div className="setting-item clickable">
            <div className="setting-info">
              <div className="setting-label">⚖️ Terms of Service</div>
              <div className="setting-description">View terms of service</div>
            </div>
            <div className="chevron">›</div>
          </div>

          <div className="setting-item clickable">
            <div className="setting-info">
              <div className="setting-label">💬 Contact Support</div>
              <div className="setting-description">support@fitai.com</div>
            </div>
            <div className="chevron">›</div>
          </div>
        </div>
      </div>

      {/* Login Button */}
      <div className="login-section">
        <button className="login-button">
          <span className="button-icon">🚪</span>
          <span className="button-text">Login</span>
        </button>
      </div>

      <style>{`
        .settings-container {
          padding: 24px 20px 40px;
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          min-height: 100vh;
        }

        .settings-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid #f1f5f9;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-icon {
          font-size: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f8fafc;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-item.clickable {
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .setting-item.clickable:hover {
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 12px;
          margin: 0 -12px;
        }

        .setting-item.delete-item:hover {
          background-color: #fef2f2;
        }

        .setting-info {
          flex: 1;
        }

        .setting-label {
          font-size: 15px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .setting-description {
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }

        .toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
          background: #e2e8f0;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
          margin-left: 16px;
        }

        .toggle-switch.active {
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(24px);
        }

        .chevron {
          color: #94a3b8;
          font-size: 20px;
          font-weight: 500;
          margin-left: 12px;
        }

        .privacy-notice {
          background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
          border: 1px solid #fcd34d;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .notice-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .notice-icon {
          font-size: 18px;
          color: #92400e;
        }

        .notice-title {
          font-size: 16px;
          font-weight: 700;
          color: #92400e;
        }

        .notice-content {
          font-size: 13px;
          color: #92400e;
          line-height: 1.6;
        }

        .notice-content p {
          margin: 8px 0;
          position: relative;
          padding-left: 12px;
        }

        .notice-content p:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #92400e;
        }

        .login-section {
          padding: 20px 0;
        }

        .login-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }

        .button-icon {
          font-size: 18px;
        }

        .button-text {
          letter-spacing: 0.5px;
        }

        @media (max-width: 640px) {
          .settings-container {
            padding: 16px;
          }
          
          .settings-section {
            padding: 16px;
          }
          
          .section-title {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default SettingsPage