import { pxToRem } from '@/utils'
import { Box, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: pxToRem(16),
          py: pxToRem(24),
        }}
      >
        <Outlet />
      </Box>
    </Container>
  )
}
