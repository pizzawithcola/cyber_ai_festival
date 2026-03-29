import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

type DataShadowsLayoutContextValue = {
  isTruthRevealFinalStep: boolean
  setTruthRevealFinalStep: (v: boolean) => void
  rightSlotRef: React.RefObject<HTMLDivElement | null>
  setRightSlotEl: (el: HTMLDivElement | null) => void
  rightSlotMounted: boolean
}

const Ctx = createContext<DataShadowsLayoutContextValue | null>(null)

export function DataShadowsLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isTruthRevealFinalStep, setTruthRevealFinalStep] = useState(false)
  const [rightSlotMounted, setRightSlotMounted] = useState(false)
  const rightSlotRef = useRef<HTMLDivElement | null>(null)

  const setRightSlotEl = useCallback((el: HTMLDivElement | null) => {
    rightSlotRef.current = el
    setRightSlotMounted(!!el)
  }, [])

  return (
    <Ctx.Provider
      value={{
        isTruthRevealFinalStep,
        setTruthRevealFinalStep,
        rightSlotRef,
        setRightSlotEl,
        rightSlotMounted,
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
