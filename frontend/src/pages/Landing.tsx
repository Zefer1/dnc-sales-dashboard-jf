import { CardComponent, StyledButton, StyledH1, StyledP } from '@/components'
import { pxToRem } from '@/utils'
import { Box } from '@mui/material'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Landing() {
  const { t } = useTranslation('landing')

  return (
    <>
      <Box>
        <StyledH1>{t('title')}</StyledH1>
        <StyledP color="#666">{t('subtitle')}</StyledP>
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
              {t('login')}
            </StyledButton>
          </Link>
          <Link to="/cadastro" style={{ textDecoration: 'none' }}>
            <StyledButton className="primary" type="button">
              {t('register')}
            </StyledButton>
          </Link>
        </Box>
      </CardComponent>
    </>
  )
}

export default Landing
