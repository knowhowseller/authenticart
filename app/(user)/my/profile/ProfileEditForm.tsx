'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const schema = z.object({
  name: z.string().min(2, '이름은 2자 이상'),
  phone: z.string().optional(),
  region: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const regions = ['서울', '인천', '경기', '부산', '대구', '광주', '대전', '울산', '강릉', '제주', '기타']

const roleLabel: Record<string, string> = {
  student: '수강생',
  instructor: '강사',
  admin: '관리자',
}

export default function ProfileEditForm({
  user,
  userId,
}: {
  user: { name: string; phone: string | null; region: string | null; email: string; role: string } | null
  userId: string
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      region: user?.region ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase
      .from('users')
      .update({ name: data.name, phone: data.phone || null, region: data.region || null })
      .eq('id', userId)
    setLoading(false)

    if (error) { toast.error(error.message); return }
    toast.success('프로필이 업데이트되었습니다')
  }

  async function sendPasswordReset() {
    if (!user?.email) return
    setPwLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/my/profile`,
    })
    setPwLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('비밀번호 재설정 이메일을 발송했습니다')
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">계정 정보</h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep">
            {roleLabel[user?.role ?? 'student'] ?? user?.role}
          </span>
        </div>
        <p className="text-sm text-brand-ink">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4 mb-4">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider">기본 정보</h2>
          <Input label="이름" required {...register('name')} error={errors.name?.message} />
          <Input label="휴대폰" placeholder="010-0000-0000" {...register('phone')} />
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">활동 지역</label>
            <select
              {...register('region')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
            >
              <option value="">선택</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full" variant="primary">저장</Button>
      </form>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-4">보안</h2>
        <Button
          type="button"
          onClick={sendPasswordReset}
          loading={pwLoading}
          variant="outline"
          className="w-full"
        >
          비밀번호 재설정 이메일 발송
        </Button>
      </div>
    </div>
  )
}
