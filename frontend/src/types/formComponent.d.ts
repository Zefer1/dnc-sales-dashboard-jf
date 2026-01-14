export type InputProps = React.InputHTMLAttributes<HTMLInputElement>
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export type MessageProps = {
	msg: string
	type: 'error' | 'success'
}

export interface FormComponentProps {
	inputs: InputProps[]
	buttons: ButtonProps[]
	onSubmit?: React.FormEventHandler<HTMLFormElement>
	message?: MessageProps
}
