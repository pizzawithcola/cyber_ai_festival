import React from 'react'

interface SimulationNoticeModalProps {
  onDismiss?: () => void          
  onRegister?: () => void         
  buttonText?: string              
}

export const SimulationNoticeModal: React.FC<SimulationNoticeModalProps> = ({
  onRegister,
  buttonText = 'Start Game'
}) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h2 style={styles.title}>Simulation Notice</h2>
          </div>

          <div style={styles.body}>
            <p style={styles.text}>This is a simulation game.</p>
            <p style={styles.text}>
              Please <strong>DO NOT</strong> enter real personal information.
            </p>
            <p style={styles.text}>
              The app does <strong>NOT</strong> store or record any information you provide.
            </p>
            <p style={styles.text}>
              All data interactions are simulated for educational purposes.
            </p>
            <p style={styles.text}>
              On the main screen, click <strong>Start Free</strong> or <strong>Register Now</strong> to begin the game.
            </p>
          </div>

          {/* 按钮区（iOS 风格） */}
          <div style={styles.buttonContainer}>
            <button
              style={styles.button}
              onClick={onRegister}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    padding: '16px',
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    width: '270px',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 20px 8px 20px',
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: '-0.3px',
  },
  body: {
    padding: '0 20px 16px 20px',
  },
  text: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    lineHeight: '1.45',
    color: '#3a3a3c',
    textAlign: 'center',
    letterSpacing: '-0.2px',
  },
  buttonContainer: {
    borderTop: '1px solid #e5e5ea',
    padding: '12px 20px 16px 20px',
    display: 'flex',
    justifyContent: 'center',
  },
  button: {
    background: 'none',
    border: 'none',
    fontSize: '17px',
    fontWeight: '600',
    color: '#007aff',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    outline: 'none',
    borderRadius: '8px',
  },
}