import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GlobalStyle } from './styles/'
import { AppThemeProvider } from '@/contexts/AppThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { LanguageProvider } from '@/contexts/LanguageContext'

import i18n from '@/i18n/config'
import { I18nextProvider } from 'react-i18next'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <AppThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <LanguageProvider>
              <GlobalStyle />
              <App />
            </LanguageProvider>
          </ToastProvider>
        </AuthProvider>
      </AppThemeProvider>
    </I18nextProvider>
  </StrictMode>
)
