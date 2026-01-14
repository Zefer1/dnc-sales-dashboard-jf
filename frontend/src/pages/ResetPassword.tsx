import { Box, Container, Grid } from '@mui/material'
import { BannerImage, FormComponent, Logo, StyledH1, StyledP } from '@/components'
import { pxToRem } from '@/utils'
import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '@/contexts/ToastContext'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

type StatusMessage = { msg: string; type: 'error' | 'success' } | undefined

type Step = 'request' | 'reset'

function ResetPassword() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()

  const tokenFromQuery = searchParams.get('token')

  const [manualStep, setManualStep] = useState<Step>('request')
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(undefined)

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
        placeholder: 'Email',
        value: requestEmail,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setRequestEmail(e.target.value),
      },
    ],
    [requestEmail]
  )

  const requestValid = useMemo(() => /^\S+@\S+\.\S+$/.test(requestEmail), [requestEmail])

  const resetInputs = useMemo(
    () => [
      {
        type: 'text',
        placeholder: 'Token',
        value: token,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setTokenOverride(e.target.value),
      },
      {
        type: 'password',
        placeholder: 'Nova password',
        value: newPassword,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value),
      },
      {
        type: 'password',
        placeholder: 'Confirmar password',
        value: confirmPassword,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
      },
    ],
    [token, newPassword, confirmPassword]
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
        showToast('Token gerado (modo dev). Pode redefinir já.', 'success')
        navigate(`/redefinir-senha?token=${encodeURIComponent(String(res.data.devToken))}`)
        return
      }

      showToast('Se o email existir, enviámos instruções de redefinição.', 'success')
      setManualStep('reset')
    } catch {
      setStatusMessage({ msg: 'Não foi possível iniciar a redefinição', type: 'error' })
    }
  }

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(undefined)

    if (newPassword !== confirmPassword) {
      setStatusMessage({ msg: 'As passwords não coincidem', type: 'error' })
      return
    }

    try {
      await api.post('/api/password/reset', { token, newPassword })
      showToast('Password alterada com sucesso. Faça login.', 'success')
      navigate('/login')
    } catch {
      setStatusMessage({ msg: 'Token inválido/expirado ou password inválida', type: 'error' })
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
              <StyledH1>Redefinir password</StyledH1>
              <StyledP>
                {step === 'request'
                  ? 'Indique o seu email para receber o link de redefinição.'
                  : 'Insira o token e escolha uma nova password.'}
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
                      children: 'Enviar',
                      disabled: !requestValid,
                    },
                  ]}
                  message={statusMessage}
                />

                <Box sx={{ marginTop: pxToRem(16) }}>
                  <Link to="/login" style={{ textDecoration: 'underline' }}>
                    Voltar ao login
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
                      children: 'Alterar password',
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
                    Voltar ao login
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
                    Reenviar token
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
