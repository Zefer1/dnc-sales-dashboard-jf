import { Box, Container, Grid } from '@mui/material'
import { pxToRem } from '@/utils'
import { BannerImage } from './BannerImage'
import { Logo } from './Logo'
import { StyledH1, StyledP } from './Typographies'

type AuthLayoutProps = {
  title: string
  subtitle?: string
  headerContent?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthLayout({ title, subtitle, headerContent, children, footer }: AuthLayoutProps) {
  return (
    <Box>
      <Grid container>
        <Grid size={{ xs: 12, sm: 6 }} sx={{ alignItems: 'center', display: 'flex', height: '100vh' }}>
          <Container maxWidth="sm">
            <Box sx={{ marginBottom: pxToRem(24) }}>
              <Logo height={41} width={100} />
            </Box>
            <Box sx={{ marginBottom: pxToRem(24) }}>
              <StyledH1>{title}</StyledH1>
              {subtitle ? <StyledP>{subtitle}</StyledP> : null}
              {headerContent}
            </Box>
            {children}
            {footer ? (
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
                {footer}
              </Box>
            ) : null}
          </Container>
        </Grid>
        <Grid size={{ xs: false, sm: 6 }} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <BannerImage />
        </Grid>
      </Grid>
    </Box>
  )
}
