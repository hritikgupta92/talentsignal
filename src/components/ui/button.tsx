import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700',
  secondary: 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10 p-0',
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
