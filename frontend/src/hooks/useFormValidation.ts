import { useMemo, useState } from 'react'
import { InputProps } from '@/types'

export const useFormValidation = (inputs: InputProps[]) => {
	const [formValues, setFormValues] = useState(inputs.map((input) => input.value || ''))

	const formValid = useMemo(() => {
		return inputs.every((input, index) => {
			if (input.type === 'email') {
				return /^\S+@\S+\.\S+$/.test(String(formValues[index]))
			}

			if (input.type === 'password') {
				return String(formValues[index]).length > 7
			}

			return true
		})
	}, [formValues, inputs])

	const handleChange = (index: number, value: string) => {
		setFormValues((prevValues) => {
			const newValues = [...prevValues]
			newValues[index] = value
			return newValues
		})
	}

	return { formValues, formValid, handleChange }
}

