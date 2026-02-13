import React, { createContext, useContext, useState } from 'react'

type AppScreen = 'home' | 'survey' | 'terms' | 'visualization' | 'profile' | 'workout' | 'settings' | 'truthreveal'

type UserData = {
  email: string
  name: string
  age: number
  gender: string
  goal: string
  height: number
  weight: number
  activityLevel: string
}

type UserChoices = {
  [key: string]: string | number | boolean | string[]
}

type FitAIState = {
  screen: AppScreen
  isMenuOpen: boolean
  userData: Partial<UserData>
  userChoices: UserChoices
  isRegistered: boolean
  hasCompletedTerms: boolean
  hasCompletedSurvey: boolean
  hasSeenTermsPrompt: boolean
  setScreen: (screen: AppScreen) => void
  toggleMenu: () => void
  updateUserData: (data: Partial<UserData>) => void
  updateUserChoices: (choices: UserChoices) => void
  completeTerms: () => void
  completeSurvey: () => void
  completeRegistration: () => void
  initiateRegistrationFlow: () => void
}

const FitAICtx = createContext<FitAIState | null>(null)

export const useFitAI = () => {
  const ctx = useContext(FitAICtx)
  if (!ctx) throw new Error('useFitAI must be used within FitAIProvider')
  return ctx
}

export const FitAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userData, setUserData] = useState<Partial<UserData>>({})
  const [userChoices, setUserChoices] = useState<UserChoices>({})
  const [isRegistered, setIsRegistered] = useState(false)
  const [hasCompletedTerms, setHasCompletedTerms] = useState(false)
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false)
  const [hasSeenTermsPrompt, setHasSeenTermsPrompt] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const updateUserData = (data: Partial<UserData>) => {
    setUserData((prev) => ({ ...prev, ...data }))
  }

  const updateUserChoices = (choices: UserChoices) => {
    setUserChoices((prev) => ({ ...prev, ...choices }))
  }

  const completeTerms = () => {
    setHasCompletedTerms(true)
    setScreen('survey')
  }

  const completeSurvey = () => {
    setHasCompletedSurvey(true)
    setScreen('visualization')
  }

  const completeRegistration = () => {
    setIsRegistered(true)
    setScreen('home')
  }

  const initiateRegistrationFlow = () => {
    setHasSeenTermsPrompt(true)
    setScreen('terms')
  }

  return (
    <FitAICtx.Provider
      value={{
        screen,
        isMenuOpen,
        userData,
        userChoices,
        isRegistered,
        hasCompletedTerms,
        hasCompletedSurvey,
        hasSeenTermsPrompt,
        setScreen,
        toggleMenu,
        updateUserData,
        updateUserChoices,
        completeTerms,
        completeSurvey,
        completeRegistration,
        initiateRegistrationFlow,
      }}
    >
      {children}
    </FitAICtx.Provider>
  )
}

export default FitAICtx
