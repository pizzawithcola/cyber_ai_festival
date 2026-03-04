import React from 'react'
import { useFitAI } from './fitaiContext'

interface AppLayoutProps {
  children: React.ReactNode
  onBack?: () => void
}

/**
 * AppLayout - FitAI App Container
 * 
 * CRITICAL: Ensures all UI stays within device frame
 * - Uses flexbox for proper containment
 * - Top bar (sticky, within safe area)
 * - Content area (flex: 1, scrollable)
 * - Bottom navigation (fixed within frame, respects home indicator)
 * - Menu overlay (absolutely positioned, contained within screen bounds)
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children, onBack }) => {
  const { isMenuOpen, toggleMenu, setScreen } = useFitAI()

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Top Bar - Fixed at top */}
      <div style={{
        height: '60px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'relative',
        zIndex: 100
      }}>
        {/* Back Button */}
        <button 
          onClick={onBack} 
          style={{ 
            visibility: onBack ? 'visible' : 'hidden',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            border: 'none',
            background: '#f9fafb',
            color: '#374151',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Back to Home"
        >
          ←
        </button>
        
        {/* Title */}
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#111827',
          letterSpacing: '-0.3px'
        }}>
          FitAI
        </div>
        
        {/* Menu Button */}
        <button 
          onClick={toggleMenu} 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            border: 'none',
            background: '#f9fafb',
            color: '#374151',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Slide-up Menu - Contained within app frame */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '60px', // Below top bar
          right: '16px',
          width: 'calc(100% - 32px)', // Full width with margins
          maxWidth: '150px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 99,
          overflow: 'hidden',
          animation: 'slideDown 0.2s ease-out'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 0'
          }}>
            <button 
              onClick={() => { setScreen('home'); toggleMenu() }}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '20px' }}>🏠</span>
              <span>Home</span>
            </button>
            
            <div style={{
              height: '1px',
              background: '#f3f4f6',
              margin: '0 20px'
            }} />
            
            <button 
              onClick={() => { setScreen('profile'); toggleMenu() }}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '20px' }}>👤</span>
              <span>Profile</span>
            </button>
            
            <div style={{
              height: '1px',
              background: '#f3f4f6',
              margin: '0 20px'
            }} />
            
            <button 
              onClick={() => { setScreen('workout'); toggleMenu() }}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '20px' }}>💪</span>
              <span>Workout</span>
            </button>
            
            <div style={{
              height: '1px',
              background: '#f3f4f6',
              margin: '0 20px'
            }} />
            
            <button 
              onClick={() => { setScreen('settings'); toggleMenu() }}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '20px' }}>⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Takes remaining space */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        position: 'relative'
      }}>
        {children}
      </div>

      {/* Bottom Tab Bar - Fixed at bottom */}
      <div style={{
        height: '80px',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)', // For iPhone home indicator
        position: 'relative',
        zIndex: 50
      }}>
        <button 
          onClick={() => setScreen('home')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '12px 0'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#3b82f6' }}>Home</div>
        </button>
        
        <button 
          onClick={() => setScreen('workout')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '12px 0'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>💪</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Workout</div>
        </button>
        
        <button 
          onClick={() => setScreen('profile')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '12px 0'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>👤</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Profile</div>
        </button>
        
        <button 
          onClick={() => setScreen('settings')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '12px 0'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚙️</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>Settings</div>
        </button>
      </div>

      {/* Overlay for menu - Click outside to close */}
      {isMenuOpen && (
        <div 
          onClick={toggleMenu}
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            bottom: '80px',
            background: 'transparent',
            zIndex: 98
          }}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default AppLayout