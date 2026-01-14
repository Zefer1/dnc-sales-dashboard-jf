import { Alert, Snackbar } from '@mui/material'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastSeverity = 'success' | 'info' | 'warning' | 'error'

type ToastState = {
  open: boolean
  message: string
  severity: ToastSeverity
}

type ToastContextValue = {
  showToast: (message: string, severity?: ToastSeverity) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

type ToastProviderProps = {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  })

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info') => {
    setState({ open: true, message, severity })
  }, [])

  const close = useCallback((_event?: unknown, reason?: string) => {
    if (reason === 'clickaway') return
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={3500}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={close} severity={state.severity} variant="filled" sx={{ width: '100%' }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
