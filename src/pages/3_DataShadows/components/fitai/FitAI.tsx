import React from 'react'
import { FitAIProvider, useFitAI } from './fitaiContext'
import AppLayout from './AppLayout'
import HomePage from './HomePage'
import TermsAndConditions from './TermsAndConditions'
import RegistrationSurvey from './RegistrationSurvey'
import { DataVisualization } from './visualization/DataVisualization'
import ProfilePage from './ProfilePage'
import WorkoutPlan from './WorkoutPlan'
import SettingsPage from './SettingsPage'
import TruthReveal from './TruthReveal'
import './fitai-styles.css'

interface FitAIInnerProps {
  onBack?: () => void
}

const FitAIInner: React.FC<FitAIInnerProps> = ({ onBack }) => {
  const { screen, isRegistered } = useFitAI()

  // Show terms only after user initiates registration
  if (screen === 'terms') {
    return <TermsAndConditions />
  }

  // Show survey if user completed terms and not yet registered
  if (screen === 'survey' && !isRegistered) {
    return <RegistrationSurvey />
  }

  // Show truth reveal
  if (screen === 'truthreveal') {
    return <TruthReveal />
  }

  // Show data visualization
  if (screen === 'visualization') {
    return <DataVisualization />
  }

  // Default: Wrap all app screens in AppLayout
  return (
    <AppLayout onBack={onBack}>
      <>
        {screen === 'home' && <HomePage />}
        {screen === 'profile' && <ProfilePage />}
        {screen === 'workout' && <WorkoutPlan />}
        {screen === 'settings' && <SettingsPage />}
      </>
    </AppLayout>
  )
}

interface FitAIProps {
  onBack?: () => void
}

const FitAI: React.FC<FitAIProps> = ({ onBack }) => {
  return (
    <FitAIProvider>
      <FitAIInner onBack={onBack} />
    </FitAIProvider>
  )
}

export default FitAI
