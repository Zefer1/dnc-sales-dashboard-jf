import { Box, Container, Grid } from '@mui/material'
import { BannerImage, FormComponent, Logo, StyledH1, StyledP } from '@/components'
import { pxToRem } from '@/utils'
import { useMemo, useState } from 'react'
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
  const [searchParams] = useSearchParams()

  const tokenFromQuery = searchParams.get('token')

  const [manualStep, setManualStep] = useState<Step>('request')
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(undefined)
  const [requestSent, setRequestSent] = useState(false)

  const [requestEmail, setRequestEmail] = useState('')
  const [tokenOverride, setTokenOverride] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const step: Step = tokenFromQuery ? 'reset' : manualStep
  const token = tokenOverride ?? tokenFromQuery ?? ''

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

  const requestValid = useMemo(() => /^\S+@\S+\.\S+$/.test(requestEmail), [requestEmail])

  const resetInputs = useMemo(
    () => [
      {
        type: 'text',
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
      const res = await api.post('/api/password/forgot', { email })

      // API intentionally returns ok=true even when user doesn't exist.
      if (res.data?.devToken) {
        showToast(t('reset.devTokenGenerated'), 'success')
        setTokenOverride(String(res.data.devToken))
      }

      showToast(t('reset.infoIfExists'), 'success')
      setRequestSent(true)
    } catch {
      setStatusMessage({ msg: t('reset.errorRequest'), type: 'error' })
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
