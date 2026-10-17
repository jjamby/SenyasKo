import { useId, useState } from 'react'
import type { ComponentType, InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }> }

export function AuthField({ label, icon: Icon, type, ...props }: AuthFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const password = type === 'password'
  return <div className="auth-field"><label className="sr-only" htmlFor={id}>{label}</label><Icon size={25} aria-hidden /><input {...props} id={id} type={password && visible ? 'text' : type} placeholder={label} />{password && <button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button>}</div>
}
