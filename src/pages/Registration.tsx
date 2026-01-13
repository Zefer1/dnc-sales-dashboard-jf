import { Box, Container, Grid } from '@mui/material'
import { BannerImage, FormComponent, StyledH1, StyledP, StyledUl, Logo } from '@/components'
import { pxToRem } from '@/utils'
import { useContext, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormValidation } from '@/hooks'
import { AuthContext } from '@/contexts/AuthContextValue'




function Registration() {
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

      await auth.register({
        email: String(formValues[0] ?? ''),
        password: String(formValues[1] ?? ''),
      })

      setStatusMessage({ msg: 'Sucesso!', type: 'success' })
      navigate('/home')
    } catch {
      setStatusMessage({ msg: 'Falha no cadastro', type: 'error' })
    }
  }

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
                <StyledH1>Faça seu cadastro</StyledH1>
                <StyledP>Primeiro, diga-nos quem você é.</StyledP>
                <StyledUl>
                  <li>Entre 8 e 16 caracteres;</li>
                  <li>Pelo menos uma letra maiúscula;</li>
                  <li>Pelo menos um caractere especial;</li>
                  <li>Pelo menos um número</li>
                </StyledUl>
              </Box>
              
              <FormComponent
                onSubmit={handleSubmit}
                inputs={inputs}
                buttons={[
                  {
                    className: 'primary',
                    type: 'submit',
                    children: 'Cadastrar',
                    disabled: !formValid,
                  },
                ]}
                message={statusMessage}
              />
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

export default Registration
