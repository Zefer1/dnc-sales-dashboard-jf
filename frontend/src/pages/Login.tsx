import { Box, Container, Grid } from '@mui/material'
import { BannerImage, FormComponent, Logo, StyledH1, StyledP } from '@/components'
import { pxToRem } from '@/utils'
import { useContext, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormValidation } from '@/hooks'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useTranslation } from 'react-i18next'

function Login() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const [statusMessage, setStatusMessage] = useState<
    { msg: string; type: 'error' | 'success' } | undefined
  >(undefined)

  const baseInputs = useMemo(
    () => [
      { type: 'email', placeholder: t('login.email') },
      { type: 'password', placeholder: t('login.password') },
    ],
    [t]
  )

  const { formValues, formValid, handleChange } = useFormValidation(baseInputs)

  const inputs = useMemo(
    () =>
      baseInputs.map((input, index) => ({
        ...input,
        value: String(formValues[index] ?? ''),
        onChange: (e: ChangeEvent<HTMLInputElement>) =>
          handleChange(index, e.target.value),
      })),
    [baseInputs, formValues, handleChange]
  )

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(undefined)

    try {
      if (!auth) {
        setStatusMessage({ msg: t('login.errorUnavailable'), type: 'error' })
        return
      }

      await auth.login({
        email: String(formValues[0] ?? ''),
        password: String(formValues[1] ?? ''),
      })

      setStatusMessage({ msg: t('login.success'), type: 'success' })
      navigate('/home')
    } catch {
      setStatusMessage({ msg: t('login.errorInvalid'), type: 'error' })
    }
  }

  useEffect(() => {
    if (auth?.isAuthenticated) {
      navigate('/home')
    }
  }, [auth?.isAuthenticated, navigate])

  return (
    <>
      <Box>
        <Grid container>
          <Grid
            size={{ xs: 12, sm: 6 }}
            sx={{ alignItems: 'center', display: 'flex', height: '100vh' }}
          >
            <Container maxWidth="sm">
              <Box sx={{ marginBottom: pxToRem(24) }}><Logo height={41} width={100} /></Box>
              <Box sx={{ marginBottom: pxToRem(24) }}>
                <StyledH1>{t('login.title')}</StyledH1>
                <StyledP>{t('login.subtitle')}</StyledP>
              </Box>
              <FormComponent
                onSubmit={handleSubmit}
                inputs={inputs}
                buttons={[
                  {
                    className: 'primary',
                    type: 'submit',
                    children: t('login.submit'),
                    disabled: !formValid,
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
                <Link to="/cadastro" style={{ textDecoration: 'underline' }}>
                  {t('login.noAccount')}
                </Link>
                <Link to="/redefinir-senha" style={{ textDecoration: 'underline' }}>
                  {t('login.forgot')}
                </Link>
              </Box>
            </Container>
          </Grid>
          <Grid size={{ xs: false, sm: 6 }} sx={{ display: { xs: 'none', sm: 'block' } }}>
            <BannerImage />
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default Login

