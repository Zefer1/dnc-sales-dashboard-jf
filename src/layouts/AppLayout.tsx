import { Header } from '@/components'
import { pxToRem } from '@/utils'
import { Box, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <>
      <Header />
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: pxToRem(16) }}>
          <Outlet />
        </Box>
      </Container>
    </>
  )
}
