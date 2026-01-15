import { Box, Container, Grid } from '@mui/material'
import axios from 'axios'
import { BannerImage, FormComponent, Logo, StyledH1, StyledP, TurnstileWidget } from '@/components'
import { pxToRem } from '@/utils'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { useToast } from '@/contexts/ToastContext'
import { useTranslation } from 'react-i18next'

type StatusMessage = { msg: string; type: 'error' | 'success' } | undefined

type Step = 'request' | 'reset'

function ResetPassword() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useTranslation('auth')
  const [searchParams, setSearchParams] = useSearchParams()

  const [manualStep, setManualStep] = useState<Step>('request')
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(undefined)
  const [requestSent, setRequestSent] = useState(false)

  const [requestEmail, setRequestEmail] = useState('')
  const [tokenOverride, setTokenOverride] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const step: Step = manualStep
  const token = tokenOverride ?? ''

  const turnstileSiteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) return

    setTokenOverride(tokenParam)
    setManualStep('reset')
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const requestInputs = useMemo(
    () => [
      {
        type: 'email',
        placeholder: t('reset.email'),
        value: requestEmail,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setRequestEmail(e.target.value),
      },
    ],
    [requestEmail, t]
  )

  const requestValid = useMemo(() => {
    const okEmail = /^\S+@\S+\.\S+$/.test(requestEmail)
    const okCaptcha = turnstileSiteKey.length > 0 && captchaToken.length > 0
    return okEmail && okCaptcha
  }, [captchaToken, requestEmail, turnstileSiteKey])

  const resetInputs = useMemo(
    () => [
      {
        type: 'password',
        placeholder: t('reset.token'),
        value: token,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setTokenOverride(e.target.value),
      },
      {
        type: 'password',
        placeholder: t('reset.newPassword'),
        value: newPassword,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value),
      },
      {
        type: 'password',
        placeholder: t('reset.confirmPassword'),
        value: confirmPassword,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
      },
    ],
    [token, newPassword, confirmPassword, t]
  )

  const resetValid = useMemo(() => {
    return token.trim().length > 0 && newPassword.length > 7 && confirmPassword.length > 7
  }, [token, newPassword, confirmPassword])

  const handleRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(undefined)

    const email = requestEmail

    try {
      if (!turnstileSiteKey) {
        setStatusMessage({ msg: t('reset.captchaMisconfigured'), type: 'error' })
        return
      }

      if (!captchaToken) {
        setStatusMessage({ msg: t('reset.captchaRequired'), type: 'error' })
        return
      }

      const res = await api.post('/api/password/forgot', { email, captchaToken })

      // API intentionally returns ok=true even when user doesn't exist.
      if (res.data?.devToken) {
        showToast(t('reset.devTokenGenerated'), 'success')
        setTokenOverride(String(res.data.devToken))
      }

      showToast(t('reset.infoIfExists'), 'success')
      setRequestSent(true)
      setCaptchaToken('')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? String(err.response?.data?.error ?? '') : ''
      if (msg.toLowerCase().includes('captcha')) {
        setStatusMessage({ msg: t('reset.captchaInvalid'), type: 'error' })
      } else {
        setStatusMessage({ msg: t('reset.errorRequest'), type: 'error' })
      }
    }
  }

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(undefined)

    if (newPassword !== confirmPassword) {
      setStatusMessage({ msg: t('reset.errorMismatch'), type: 'error' })
      return
    }

    try {
      await api.post('/api/password/reset', { token, newPassword })
      showToast(t('reset.successChanged'), 'success')
      navigate('/login')
    } catch {
      setStatusMessage({ msg: t('reset.errorInvalid'), type: 'error' })
    }
  }

  return (
    <Box>
      <Grid container>
        <Grid size={{ xs: 12, sm: 6 }} sx={{ alignItems: 'center', display: 'flex', height: '100vh' }}>
          <Container maxWidth="sm">
            <Box sx={{ marginBottom: pxToRem(24) }}>
              <Logo height={41} width={100} />
            </Box>

            <Box sx={{ marginBottom: pxToRem(24) }}>
              <StyledH1>{t('reset.title')}</StyledH1>
              <StyledP>
                {step === 'request'
                  ? t('reset.requestSubtitle')
                  : t('reset.resetSubtitle')}
              </StyledP>
            </Box>

            {step === 'request' ? (
              <>
                <FormComponent
                  onSubmit={handleRequest}
                  inputs={requestInputs}
                  buttons={[
                    {
                      className: 'primary',
                      type: 'submit',
                      children: t('reset.submitRequest'),
                      disabled: !requestValid,
                    },
                  ]}
                  message={statusMessage}
                />

                <Box sx={{ marginTop: pxToRem(16) }}>
                  {turnstileSiteKey ? (
                    <TurnstileWidget siteKey={turnstileSiteKey} onToken={setCaptchaToken} />
                  ) : (
                    <StyledP>{t('reset.captchaMisconfigured')}</StyledP>
                  )}
                </Box>

                {requestSent && (
                  <Box sx={{ marginTop: pxToRem(16) }}>
                    <StyledP>{t('reset.infoIfExists')}</StyledP>
                    <button
                      type="button"
                      onClick={() => setManualStep('reset')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        font: 'inherit',
                      }}
                    >
                      {t('reset.haveToken')}
                    </button>
                  </Box>
                )}

                <Box sx={{ marginTop: pxToRem(16) }}>
                  <Link to="/login" style={{ textDecoration: 'underline' }}>
                    {t('reset.backToLogin')}
                  </Link>
                </Box>
              </>
            ) : (
              <>
                <FormComponent
                  onSubmit={handleReset}
                  inputs={resetInputs}
                  buttons={[
                    {
                      className: 'primary',
                      type: 'submit',
                      children: t('reset.submitReset'),
                      disabled: !resetValid,
                    },
                  ]}
                  message={statusMessage}
                />

                <Box
                  sx={{
                    marginTop: pxToRem(16),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: pxToRem(12),
                  }}
                >
                  <Link to="/login" style={{ textDecoration: 'underline' }}>
                    {t('reset.backToLogin')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setManualStep('request')
                      setTokenOverride(null)
                      setStatusMessage(undefined)
                      navigate('/redefinir-senha')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      font: 'inherit',
                    }}
                  >
                    {t('reset.resend')}
                  </button>
                </Box>
              </>
            )}
          </Container>
        </Grid>

        <Grid size={{ xs: false, sm: 6 }} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <BannerImage />
        </Grid>
      </Grid>
    </Box>
  )
}

export default ResetPassword
