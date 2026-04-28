/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type DataShadowsLayoutContextValue = {
  isTruthRevealFinalStep: boolean
  setTruthRevealFinalStep: (v: boolean) => void
  rightSlotRef: React.RefObject<HTMLDivElement | null>
  rightSlotEl: HTMLDivElement | null
  setRightSlotEl: (el: HTMLDivElement | null) => void
  rightSlotMounted: boolean
  showIntroOverlay: boolean
  completeIntro: () => void
  showSidebarNotice: boolean
  isPhoneRecentering: boolean
  recenterPhoneForExperience: () => Promise<void>
}

const Ctx = createContext<DataShadowsLayoutContextValue | null>(null)

export function DataShadowsLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isTruthRevealFinalStep, setTruthRevealFinalStep] = useState(false)
  const [rightSlotMounted, setRightSlotMounted] = useState(false)
  const [rightSlotElState, setRightSlotElState] = useState<HTMLDivElement | null>(null)
  const [showIntroOverlay, setShowIntroOverlay] = useState(true)
  const [showSidebarNotice, setShowSidebarNotice] = useState(false)
  const [isPhoneRecentering, setIsPhoneRecentering] = useState(false)
  const rightSlotRef = useRef<HTMLDivElement | null>(null)
  const recenterTimerRef = useRef<number | null>(null)

  const setRightSlotEl = useCallback((el: HTMLDivElement | null) => {
    rightSlotRef.current = el
    setRightSlotElState(el)
    setRightSlotMounted(!!el)
  }, [])

  const completeIntro = useCallback(() => {
    setShowIntroOverlay(false)
    setShowSidebarNotice(true)
  }, [])

  const recenterPhoneForExperience = useCallback(() => {
    if (!showSidebarNotice) {
      return Promise.resolve()
    }

    setShowSidebarNotice(false)
    setIsPhoneRecentering(true)

    if (recenterTimerRef.current) {
      window.clearTimeout(recenterTimerRef.current)
    }

    return new Promise<void>((resolve) => {
      recenterTimerRef.current = window.setTimeout(() => {
        setIsPhoneRecentering(false)
        recenterTimerRef.current = null
        resolve()
      }, 650)
    })
  }, [showSidebarNotice])

  useEffect(() => {
    return () => {
      if (recenterTimerRef.current) {
        window.clearTimeout(recenterTimerRef.current)
      }
    }
  }, [])

  return (
    <Ctx.Provider
      value={{
        isTruthRevealFinalStep,
        setTruthRevealFinalStep,
        rightSlotRef,
        rightSlotEl: rightSlotElState,
        setRightSlotEl,
        rightSlotMounted,
        showIntroOverlay,
        completeIntro,
        showSidebarNotice,
        isPhoneRecentering,
        recenterPhoneForExperience,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useDataShadowsLayout() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDataShadowsLayout must be used within DataShadowsLayoutProvider')
  return v
}
