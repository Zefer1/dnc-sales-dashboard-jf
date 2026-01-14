import { useContext } from 'react'
import { CardComponent, StyledButton, StyledH1 } from '@/components'
import { AppThemeContext } from '@/contexts/AppThemeContext'
import { AuthContext } from '@/contexts/AuthContextValue'

function Profile() {
  const themeContext = useContext(AppThemeContext)
  const auth = useContext(AuthContext)

  if (!themeContext) {
    return null
  }
  return (
    <>
      <StyledH1>Perfil</StyledH1>
      <CardComponent>
        <StyledButton className='primary' onClick={themeContext.toggleTheme}>
          Trocar para tema{' '}
          {themeContext.appTheme === 'light' ? 'escuro' : 'claro'}
        </StyledButton>
        <StyledButton
          className='primary'
          onClick={() => {
            auth?.logout()
          }}
          style={{ marginTop: 16 }}
        >
          Logout
        </StyledButton>
      </CardComponent>
    </>
  )
}

export default Profile
