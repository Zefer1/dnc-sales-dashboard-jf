import { Box, Container, Grid } from '@mui/material'
import { BannerImage, FormComponent, Logo, StyledH1, StyledP } from '@/components'
import { pxToRem } from '@/utils'
import { useContext, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormValidation } from '@/hooks'
import { AuthContext } from '@/contexts/AuthContextValue'

function Login() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [statusMessage, setStatusMessage] = useState<
    { msg: string; type: 'error' | 'success' } | undefined
  >(undefined)

  const baseInputs = useMemo(
    () => [
      { type: 'email', placeholder: 'Email' },
      { type: 'password', placeholder: 'Senha' },
    ],
    []
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
        setStatusMessage({ msg: 'Auth indisponível', type: 'error' })
        return
      }

      await auth.login({
        email: String(formValues[0] ?? ''),
        password: String(formValues[1] ?? ''),
      })

      setStatusMessage({ msg: 'Sucesso!', type: 'success' })
      navigate('/home')
    } catch {
      setStatusMessage({ msg: 'Email ou senha inválidos', type: 'error' })
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
                <StyledH1>Bem-vindo</StyledH1>
                <StyledP>Digite sua senha e email para logar</StyledP>
              </Box>
              <FormComponent
                onSubmit={handleSubmit}
                inputs={inputs}
                buttons={[
                  {
                    className: 'primary',
                    type: 'submit',
                    children: 'Login',
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
                  Ainda não tem conta? Registe-se aqui.
                </Link>
                <Link to="/redefinir-senha" style={{ textDecoration: 'underline' }}>
                  Esqueceu-se da sua password? Mude aqui.
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

