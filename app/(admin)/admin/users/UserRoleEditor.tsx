'use client'
import { useState, useTransition } from 'react'
import { updateUserRole } from '@/app/actions/admin-users'
import type { UserRole } from '@/types/database'

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'student',        label: '수강생',  color: 'bg-gray-100 text-gray-700' },
  { value: 'instructor',     label: '강사',    color: 'bg-brand-sage/20 text-brand-deep' },
  { value: 'branch_manager', label: '지부장',  color: 'bg-brand-amber/20 text-brand-ink' },
  { value: 'admin',          label: '관리자',  color: 'bg-red-50 text-red-600' },
]

export default function UserRoleEditor({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleChange(newRole: UserRole) {
    if (newRole === role) return
    setRole(newRole)
    setSaved(false)
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole)
      if (!res.error) setSaved(true)
    })
  }

  const current = ROLES.find(r => r.value === role)

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={e => handleChange(e.target.value as UserRole)}
        disabled={isPending}
        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-amber disabled:opacity-50 ${current?.color}`}
      >
        {ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      {isPending && <span className="text-xs text-brand-grey">저장 중...</span>}
      {saved && !isPending && <span className="text-xs text-green-500">저장됨</span>}
    </div>
  )
}
