import { FormComponent, StyledUl, AuthLayout } from '@/components'
import { useContext, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailPasswordForm } from '@/hooks'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useTranslation } from 'react-i18next'

function Registration() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const [statusMessage, setStatusMessage] = useState<
    { msg: string; type: 'error' | 'success' } | undefined
  >(undefined)

  const { inputs, formValid, values } = useEmailPasswordForm({
    email: t('register.email'),
    password: t('register.password'),
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(undefined)

    try {
      if (!auth) {
        setStatusMessage({ msg: t('register.errorUnavailable'), type: 'error' })
        return
      }

      await auth.register({
        email: values.email,
        password: values.password,
      })

      setStatusMessage({ msg: t('register.success'), type: 'success' })
      navigate('/home')
    } catch {
      setStatusMessage({ msg: t('register.error'), type: 'error' })
    }
  }

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      headerContent={
        <StyledUl>
          <li>{t('register.requirements.len')}</li>
          <li>{t('register.requirements.upper')}</li>
          <li>{t('register.requirements.special')}</li>
          <li>{t('register.requirements.number')}</li>
        </StyledUl>
      }
    >
      <FormComponent
        onSubmit={handleSubmit}
        inputs={inputs}
        buttons={[
          {
            className: 'primary',
            type: 'submit',
            children: t('register.submit'),
            disabled: !formValid,
          },
        ]}
        message={statusMessage}
      />
    </AuthLayout>
  )
}

export default Registration
