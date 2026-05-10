import { cn } from '@/lib/utils/cn'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, className, id, ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-brand-ink">
          {label}
          {props.required && <span className="text-brand-amber ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-lg border border-brand-mist bg-white text-sm text-brand-ink placeholder:text-brand-grey',
          'focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent',
          'disabled:bg-brand-bg disabled:text-brand-grey disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-brand-grey">{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'
export default Input
