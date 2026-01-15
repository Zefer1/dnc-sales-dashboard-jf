import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import { useFormValidation } from './useFormValidation'

type Placeholders = {
  email: string
  password: string
}

export const useEmailPasswordForm = (placeholders: Placeholders) => {
  const baseInputs = useMemo(
    () => [
      { type: 'email', placeholder: placeholders.email },
      { type: 'password', placeholder: placeholders.password },
    ],
    [placeholders.email, placeholders.password]
  )

  const { formValues, formValid, handleChange } = useFormValidation(baseInputs)

  const inputs = useMemo(
    () =>
      baseInputs.map((input, index) => ({
        ...input,
        value: String(formValues[index] ?? ''),
        onChange: (e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value),
      })),
    [baseInputs, formValues, handleChange]
  )

  const values = useMemo(
    () => ({
      email: String(formValues[0] ?? ''),
      password: String(formValues[1] ?? ''),
    }),
    [formValues]
  )

  return { inputs, formValid, values }
}
