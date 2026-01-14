import { CardComponent, StyledH1, StyledInput, StyledP } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { AppThemeContext } from '@/contexts/AppThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { api } from '@/api/client'
import { pxToRem } from '@/utils'
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
} from '@mui/material'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type LocalPreferences = {
  language: 'pt-PT' | 'pt-BR' | 'en-US'
  tableDensity: 'comfortable' | 'compact'
  reduceMotion: boolean
  highContrast: boolean
  tooltips: boolean
  toasts: boolean
  dashboardAutoRefresh: boolean
  auditTake: number
}

const PREFS_KEY = 'urbancrm.settings.preferences.v1'

function loadPrefs(): LocalPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) {
      return {
        language: 'pt-PT',
        tableDensity: 'comfortable',
        reduceMotion: false,
        highContrast: false,
        tooltips: true,
        toasts: true,
        dashboardAutoRefresh: true,
        auditTake: 100,
      }
    }

    const parsed = JSON.parse(raw) as Partial<LocalPreferences>
    return {
      language: parsed.language ?? 'pt-PT',
      tableDensity: parsed.tableDensity ?? 'comfortable',
      reduceMotion: Boolean(parsed.reduceMotion),
      highContrast: Boolean(parsed.highContrast),
      tooltips: parsed.tooltips ?? true,
      toasts: parsed.toasts ?? true,
      dashboardAutoRefresh: parsed.dashboardAutoRefresh ?? true,
      auditTake: typeof parsed.auditTake === 'number' ? parsed.auditTake : 100,
    }
  } catch {
    return {
      language: 'pt-PT',
      tableDensity: 'comfortable',
      reduceMotion: false,
      highContrast: false,
      tooltips: true,
      toasts: true,
      dashboardAutoRefresh: true,
      auditTake: 100,
    }
  }
}

function savePrefs(prefs: LocalPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  localStorage.setItem('settings_toasts_enabled', prefs.toasts ? 'true' : 'false')
}

function Settings() {
  const auth = useContext(AuthContext)
  const theme = useContext(AppThemeContext)
  const toast = useToast()

  const authHeaders = useMemo(() => {
    const token = auth?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [auth?.token])

  const [prefs, setPrefs] = useState<LocalPreferences>(() => loadPrefs())

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
      toast.showToast('Nome é obrigatório', 'error')
      return
    }

    setSavingProfile(true)
    try {
      await api.put('/api/me', { name: trimmed }, { headers: authHeaders })
      await auth.refreshMe()
      toast.showToast('Perfil atualizado', 'success')
    } catch {
      toast.showToast('Falha ao atualizar perfil', 'error')
    } finally {
      setSavingProfile(false)
    }
  }, [auth, authHeaders, name, toast])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const changePassword = useCallback(async () => {
    if (!auth?.token) return
    if (newPassword !== confirmPassword) {
      toast.showToast('As passwords não coincidem', 'error')
      return
    }
    if (newPassword.length < 8) {
      toast.showToast('A nova password deve ter pelo menos 8 caracteres', 'error')
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
      toast.showToast('Password alterada', 'success')
    } catch {
      toast.showToast('Falha ao alterar password', 'error')
    } finally {
      setChangingPassword(false)
    }
  }, [auth?.token, authHeaders, currentPassword, newPassword, confirmPassword, toast])

  const clearLocal = useCallback(() => {
    const keepTheme = localStorage.getItem('theme')
    localStorage.clear()
    if (keepTheme) localStorage.setItem('theme', keepTheme)
    savePrefs(loadPrefs())
    toast.showToast('Preferências locais limpas', 'success')
  }, [toast])

  return (
    <>
      <StyledH1>Settings</StyledH1>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          Conta
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <Box>
            <StyledP $weight={600} size={14} $lineheight={20} color="#666">
              Email
            </StyledP>
            <StyledInput value={email} disabled aria-label="Email" />
          </Box>

          <Box>
            <StyledP $weight={600} size={14} $lineheight={20} color="#666">
              Nome
            </StyledP>
            <StyledInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Nome"
              placeholder="Seu nome"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: pxToRem(12), flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => void saveProfile()} disabled={savingProfile || !auth?.token}>
              {savingProfile ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button variant="outlined" component={Link} to="/redefinir-senha">
              Esqueceu-se da password?
            </Button>
          </Box>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          Segurança
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <StyledInput
            type="password"
            placeholder="Password atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-label="Password atual"
          />
          <StyledInput
            type="password"
            placeholder="Nova password (mín. 8)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-label="Nova password"
          />
          <StyledInput
            type="password"
            placeholder="Confirmar nova password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-label="Confirmar nova password"
          />

          <Box sx={{ display: 'flex', gap: pxToRem(12), flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => void changePassword()}
              disabled={changingPassword || !auth?.token}
            >
              {changingPassword ? 'Alterando…' : 'Alterar password'}
            </Button>
            <Button variant="text" color="error" onClick={() => auth?.logout()}>
              Sair da conta
            </Button>
          </Box>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          Aparência
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: pxToRem(12) }}>
            <Box>
              <StyledP $weight={600} size={14} $lineheight={20}>
                Tema
              </StyledP>
              <StyledP color="#666">{theme?.appTheme === 'dark' ? 'Escuro' : 'Claro'}</StyledP>
            </Box>
            <Button variant="outlined" onClick={() => theme?.toggleTheme()}>
              Alternar
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
            label="Tabelas compactas"
          />

          <FormControlLabel
            control={<Switch checked={prefs.reduceMotion} onChange={(e) => setPrefs((p) => ({ ...p, reduceMotion: e.target.checked }))} />}
            label="Reduzir animações"
          />

          <FormControlLabel
            control={<Switch checked={prefs.highContrast} onChange={(e) => setPrefs((p) => ({ ...p, highContrast: e.target.checked }))} />}
            label="Alto contraste (local)"
          />
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          Idioma e Formatos
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <Box>
            <StyledP $weight={600} size={14} $lineheight={20} color="#666">
              Idioma
            </StyledP>
            <FormControl fullWidth>
              <Select
                value={prefs.language}
                onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value as LocalPreferences['language'] }))}
                size="small"
              >
                <MenuItem value="pt-PT">Português (Portugal)</MenuItem>
                <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                <MenuItem value="en-US">English (US)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          Notificações
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(12) }}>
          <FormControlLabel
            control={<Switch checked={prefs.toasts} onChange={(e) => setPrefs((p) => ({ ...p, toasts: e.target.checked }))} />}
            label="Toasts (mensagens no fundo)"
          />

          <FormControlLabel
            control={<Switch checked={prefs.tooltips} onChange={(e) => setPrefs((p) => ({ ...p, tooltips: e.target.checked }))} />}
            label="Tooltips (dicas ao passar o mouse)"
          />

          <Tooltip title="Este toggle ainda não altera comportamento no app" arrow>
            <Box>
              <FormControlLabel
                control={<Switch checked={prefs.dashboardAutoRefresh} onChange={(e) => setPrefs((p) => ({ ...p, dashboardAutoRefresh: e.target.checked }))} />}
                label="Dashboard: auto-atualizar"
              />
            </Box>
          </Tooltip>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          Privacidade
        </StyledP>

        <Box sx={{ display: 'flex', gap: pxToRem(12), flexWrap: 'wrap', marginTop: pxToRem(12) }}>
          <Button variant="outlined" onClick={clearLocal}>
            Limpar dados locais
          </Button>
          <Button variant="text" color="error" onClick={() => auth?.logout()}>
            Logout
          </Button>
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={700} size={16} $lineheight={24}>
          Developer
        </StyledP>

        <Box sx={{ display: 'grid', gap: pxToRem(8), marginTop: pxToRem(12) }}>
          <StyledP color="#666">API base: {api.defaults.baseURL}</StyledP>
          <StyledP color="#666">User ID: {auth?.user?.id ?? '-'} </StyledP>
        </Box>
      </CardComponent>
    </>
  )
}

export default Settings
