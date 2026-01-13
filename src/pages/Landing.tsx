import { CardComponent, StyledButton, StyledH1, StyledP } from '@/components'
import { pxToRem } from '@/utils'
import { Box } from '@mui/material'
import { Link } from 'react-router-dom'

function Landing() {
  return (
    <>
      <Box>
        <StyledH1>Bem-vindo ao Dashboard</StyledH1>
        <StyledP color="#666">Entre ou crie a sua conta para começar.</StyledP>
      </Box>

      <CardComponent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: pxToRem(12),
          }}
        >
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <StyledButton className="primary" type="button">
              Login
            </StyledButton>
          </Link>
          <Link to="/cadastro" style={{ textDecoration: 'none' }}>
            <StyledButton className="primary" type="button">
              Criar conta
            </StyledButton>
          </Link>
        </Box>
      </CardComponent>
    </>
  )
}

export default Landing
