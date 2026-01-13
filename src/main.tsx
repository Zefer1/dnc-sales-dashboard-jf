import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GlobalStyle } from './styles/'
import { AppThemeProvider } from '@/contexts/AppThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <GlobalStyle />
          <App />
        </ToastProvider>
      </AuthProvider>
    </AppThemeProvider>
  </StrictMode>
)
