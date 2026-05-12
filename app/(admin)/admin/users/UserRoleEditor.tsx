'use client'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { updateUserRole, deleteUser } from '@/app/actions/admin-users'
import type { UserRole } from '@/types/database'

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'member',         label: '일반회원', color: 'bg-blue-50 text-blue-600' },
  { value: 'student',        label: '수강생',   color: 'bg-gray-100 text-gray-700' },
  { value: 'instructor',     label: '강사',     color: 'bg-brand-sage/20 text-brand-deep' },
  { value: 'branch_manager', label: '지부장',   color: 'bg-brand-amber/20 text-brand-ink' },
  { value: 'admin',          label: '관리자',   color: 'bg-red-50 text-red-600' },
]

export default function UserRoleEditor({
  userId, currentRole, userName,
}: {
  userId: string
  currentRole: UserRole
  userName: string
}) {
  const [role, setRole] = useState(currentRole)
  const [deleted, setDeleted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleRoleChange(newRole: UserRole) {
    if (newRole === role) return
    setRole(newRole)
    setSaved(false)
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole)
      if (!res.error) setSaved(true)
    })
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      const res = await deleteUser(userId)
      if (res.error) {
        alert(res.error)
        setConfirmDelete(false)
      } else {
        setDeleted(true)
      }
    })
  }

  if (deleted) {
    return <span className="text-xs text-brand-grey italic">삭제됨</span>
  }

  const current = ROLES.find(r => r.value === role)

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={e => handleRoleChange(e.target.value as UserRole)}
        disabled={isPending}
        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-amber disabled:opacity-50 ${current?.color}`}
      >
        {ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      {isPending && <span className="text-xs text-brand-grey">처리 중...</span>}
      {saved && !isPending && <span className="text-xs text-green-500">저장됨</span>}

      {!confirmDelete ? (
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="회원 삭제"
          className="p-1 text-brand-grey hover:text-red-500 transition-colors disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-red-500">{userName} 삭제?</span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-full disabled:opacity-50 transition-colors"
          >
            확인
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={isPending}
            className="text-xs text-brand-grey hover:text-brand-ink transition-colors"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
