import { CardComponent, StyledH1, StyledInput, StyledP } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { AppThemeContext } from '@/contexts/AppThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { api } from '@/api/client'
import { loadPrefs, savePrefs, type LocalPreferences, pxToRem } from '@/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppTooltip } from '@/components'
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Switch,
} from '@mui/material'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Settings() {
  const auth = useContext(AuthContext)
  const theme = useContext(AppThemeContext)
  const toast = useToast()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')

  const isDev = import.meta.env.DEV

  const authHeaders = useMemo(() => {
    const token = auth?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [auth?.token])

  const [prefs, setPrefs] = useState<LocalPreferences>(() => loadPrefs())

  useEffect(() => {
    setPrefs((p) => (p.language === language ? p : { ...p, language }))
  }, [language])

  useEffect(() => {
    if (!auth?.token) return
    void auth.refreshMe()
  }, [auth])

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  const [name, setName] = useState(auth?.user?.name ?? '')
  const email = auth?.user?.email ?? ''

  useEffect(() => {
    setName(auth?.user?.name ?? '')
  }, [auth?.user?.name])

  const [savingProfile, setSavingProfile] = useState(false)
  const saveProfile = useCallback(async () => {
    if (!auth?.token) return
    const trimmed = name.trim()
    if (!trimmed) {
      toast.showToast(t('account.nameRequired'), 'error')
      return
    }

    setSavingProfile(true)
    try {
      await api.put('/api/me', { name: trimmed }, { headers: authHeaders })
      await auth.refreshMe()
      toast.showToast(t('account.profileOk'), 'success')
    } catch {
      toast.showToast(t('account.profileFail'), 'error')
    } finally {
      setSavingProfile(false)
    }
  }, [auth, authHeaders, name, toast, t])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const changePassword = useCallback(async () => {
    if (!auth?.token) return
    if (newPassword !== confirmPassword) {
      toast.showToast(t('security.mismatch'), 'error')
      return
    }
    if (newPassword.length < 8) {
      toast.showToast(t('security.short'), 'error')
      return
    }

    setChangingPassword(true)
    try {
      await api.post(
        '/api/password/change',
        { currentPassword, newPassword },
        { headers: authHeaders }
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.showToast(t('security.ok'), 'success')
    } catch {
      toast.showToast(t('security.fail'), 'error')
    } finally {
      setChangingPassword(false)
    }
  }, [auth?.token, authHeaders, currentPassword, newPassword, confirmPassword, toast, t])

  const clearLocal = useCallback(() => {
    const keepTheme = localStorage.getItem('theme')
    localStorage.clear()
    if (keepTheme) localStorage.setItem('theme', keepTheme)
    savePrefs(loadPrefs())
    toast.showToast(t('privacy.cleared'), 'success')
  }, [toast, t])

  const copyText = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value)
        toast.showToast(t('developer.copied'), 'success')
      } catch {
        toast.showToast(t('developer.copyFail'), 'error')
      }
    },
    [toast, t]
  )

  return (
    <>
      <StyledH1>{t('title')}</StyledH1>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          {t('sections.account')}
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <Box>
            <StyledP $weight={600} size={14} $lineheight={20} color="#666">
              {t('account.email')}
            </StyledP>
            <StyledInput value={email} disabled aria-label={t('account.email')} />
          </Box>

          <Box>
            <StyledP $weight={600} size={14} $lineheight={20} color="#666">
              {t('account.name')}
            </StyledP>
            <StyledInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label={t('account.name')}
              placeholder={t('account.namePlaceholder')}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: pxToRem(12), flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => void saveProfile()} disabled={savingProfile || !auth?.token}>
              {savingProfile ? t('account.saving') : t('account.save')}
            </Button>
            <Button variant="outlined" component={Link} to="/redefinir-senha">
              {t('account.forgot')}
            </Button>
          </Box>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          {t('sections.security')}
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <StyledInput
            type="password"
            placeholder={t('security.current')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-label={t('security.current')}
          />
          <StyledInput
            type="password"
            placeholder={t('security.new')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-label={t('security.new')}
          />
          <StyledInput
            type="password"
            placeholder={t('security.confirm')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-label={t('security.confirm')}
          />

          <Box sx={{ display: 'flex', gap: pxToRem(12), flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => void changePassword()}
              disabled={changingPassword || !auth?.token}
            >
              {changingPassword ? t('security.changing') : t('security.change')}
            </Button>
            <Button variant="text" color="error" onClick={() => auth?.logout()}>
              {t('security.logout')}
            </Button>
          </Box>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          {t('sections.appearance')}
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: pxToRem(12) }}>
            <Box>
              <StyledP $weight={600} size={14} $lineheight={20}>
                {t('appearance.theme')}
              </StyledP>
              <StyledP color="#666">{theme?.appTheme === 'dark' ? tCommon('theme.dark') : tCommon('theme.light')}</StyledP>
            </Box>
            <Button variant="outlined" onClick={() => theme?.toggleTheme()}>
              {t('appearance.toggle')}
            </Button>
          </Box>

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={prefs.tableDensity === 'compact'}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    tableDensity: e.target.checked ? 'compact' : 'comfortable',
                  }))
                }
              />
            }
            label={t('appearance.compact')}
          />

          <FormControlLabel
            control={<Switch checked={prefs.reduceMotion} onChange={(e) => setPrefs((p) => ({ ...p, reduceMotion: e.target.checked }))} />}
            label={t('appearance.reduceMotion')}
          />

          <FormControlLabel
            control={<Switch checked={prefs.highContrast} onChange={(e) => setPrefs((p) => ({ ...p, highContrast: e.target.checked }))} />}
            label={t('appearance.highContrast')}
          />
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          {t('sections.language')}
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <Box>
            <StyledP $weight={600} size={14} $lineheight={20} color="#666">
              {t('language.label')}
            </StyledP>
            <FormControl fullWidth>
              <Select
                value={language}
                onChange={(e) => {
                  const lang = e.target.value as LocalPreferences['language']
                  setLanguage(lang)
                  setPrefs((p) => ({ ...p, language: lang }))
                }}
                size="small"
              >
                <MenuItem value="pt-PT">{t('language.ptPT')}</MenuItem>
                <MenuItem value="pt-BR">{t('language.ptBR')}</MenuItem>
                <MenuItem value="en-US">{t('language.enUS')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          {t('sections.notifications')}
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <FormControlLabel
            control={<Switch checked={prefs.toasts} onChange={(e) => setPrefs((p) => ({ ...p, toasts: e.target.checked }))} />}
            label={t('notifications.toasts')}
          />

          <FormControlLabel
            control={<Switch checked={prefs.tooltips} onChange={(e) => setPrefs((p) => ({ ...p, tooltips: e.target.checked }))} />}
            label={t('notifications.tooltips')}
          />

          <AppTooltip title={t('notifications.autoRefreshHint')} arrow>
            <Box>
              <FormControlLabel
                control={<Switch checked={prefs.dashboardAutoRefresh} onChange={(e) => setPrefs((p) => ({ ...p, dashboardAutoRefresh: e.target.checked }))} />}
                label={t('notifications.autoRefresh')}
              />
            </Box>
          </AppTooltip>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          {t('sections.privacy')}
        </StyledP>

        <Box sx={{ display: 'flex', gap: pxToRem(12), flexWrap: 'wrap', marginTop: pxToRem(12) }}>
          <Button variant="outlined" onClick={clearLocal}>
            {t('privacy.clearLocal')}
          </Button>
          <Button variant="text" color="error" onClick={() => auth?.logout()}>
            {t('privacy.logout')}
          </Button>
        </Box>
      </CardComponent>

      // ...existing code...
    </>
  )
}

export default Settings
