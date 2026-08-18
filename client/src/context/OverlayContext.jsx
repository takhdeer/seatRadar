import { createContext, useContext, useState } from 'react'

export const OverlayContext = createContext()

export function OverlayProvider({ children }) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)

  return (
    <OverlayContext.Provider value={{ showOverlay, setShowOverlay, message, setMessage, error, setError }}>
      {children}
    </OverlayContext.Provider>
  )
}

export function useOverlay() {
  return useContext(OverlayContext)
}