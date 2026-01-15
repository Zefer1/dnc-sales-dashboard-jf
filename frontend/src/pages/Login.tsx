import { FormComponent, AuthLayout } from '@/components'
import { useContext, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEmailPasswordForm } from '@/hooks'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useTranslation } from 'react-i18next'

function Login() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const [statusMessage, setStatusMessage] = useState<
    { msg: string; type: 'error' | 'success' } | undefined
  >(undefined)

  const { inputs, formValid, values } = useEmailPasswordForm({
    email: t('login.email'),
    password: t('login.password'),
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(undefined)

    try {
      if (!auth) {
        setStatusMessage({ msg: t('login.errorUnavailable'), type: 'error' })
        return
      }

      await auth.login({
        email: values.email,
        password: values.password,
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
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          <Link to="/cadastro" style={{ textDecoration: 'underline' }}>
            {t('login.noAccount')}
          </Link>
          <Link to="/redefinir-senha" style={{ textDecoration: 'underline' }}>
            {t('login.forgot')}
          </Link>
        </>
      }
    >
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
    </AuthLayout>
  )
}

export default Login

