import { cn } from '@/lib/utils/cn'

interface FlowLineProps {
  className?: string
  color?: string
}

export default function FlowLine({ className, color = '#7F9593' }: FlowLineProps) {
  return (
    <svg
      viewBox="0 0 1200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full', className)}
      preserveAspectRatio="none"
    >
      <path
        d="M0 30 C150 10, 300 50, 450 30 S750 5, 900 30 S1100 55, 1200 30"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M0 40 C200 20, 400 55, 600 35 S900 15, 1200 40"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
    </svg>
  )
}
