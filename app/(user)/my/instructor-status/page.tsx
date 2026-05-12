import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import { CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react'

export default async function InstructorStatusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('status, rejection_reason, created_at, approved_at')
    .eq('instructor_id', user.id)
    .maybeSingle()

  if (userData?.role === 'instructor' && profile?.status === 'approved') {
    redirect('/studio')
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="deep" size={16} />
          <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">강사 신청</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">강사 신청 현황</h1>

        {!profile ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 text-center">
            <div className="text-4xl mb-4">👩‍🎨</div>
            <h2 className="text-lg font-bold text-brand-ink mb-2">아직 강사 신청을 하지 않으셨나요?</h2>
            <p className="text-sm text-brand-grey mb-6 leading-relaxed">
              오센틱아트에서 나만의 공예 클래스를 열어보세요.<br />
              수강생들과 함께 창작의 즐거움을 나눌 수 있습니다.
            </p>
            <Link
              href="/signup/instructor"
              className="inline-flex items-center gap-2 bg-brand-deep text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-brand-deep/90 transition-colors"
            >
              강사 신청하기 <ChevronRight size={14} />
            </Link>
          </div>
        ) : profile.status === 'pending' ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                <Clock size={22} className="text-yellow-500" />
              </div>
              <div>
                <p className="font-bold text-brand-ink">심사 중</p>
                <p className="text-xs text-brand-grey">
                  신청일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-6">
              <p className="text-sm text-yellow-700 font-medium mb-1">검토 중입니다</p>
              <p className="text-sm text-yellow-600 leading-relaxed">
                영업일 기준 3~5일 내에 심사 결과를 이메일로 안내해드립니다.
                심사 기간이 지났는데 연락이 없다면 고객센터로 문의해주세요.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-deep flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-ink">신청서 제출 완료</p>
                  <p className="text-xs text-brand-grey">{new Date(profile.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <Clock size={12} className="text-white" />
                </div>
                <p className="text-sm text-brand-grey">관리자 심사 중...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-mist/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-grey text-xs font-bold">3</span>
                </div>
                <p className="text-sm text-brand-grey/60">승인 완료 → 스튜디오 활성화</p>
              </div>
            </div>
          </div>
        ) : profile.status === 'rejected' ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle size={22} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-brand-ink">신청 반려</p>
                <p className="text-xs text-brand-grey">
                  신청일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
            {profile.rejection_reason && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-6">
                <p className="text-sm font-medium text-red-700 mb-1">반려 사유</p>
                <p className="text-sm text-red-600 leading-relaxed">{profile.rejection_reason}</p>
              </div>
            )}
            <p className="text-sm text-brand-grey mb-6 leading-relaxed">
              보완 후 재신청하시거나 고객센터로 문의하시면 자세한 안내를 받을 수 있습니다.
            </p>
            <div className="flex gap-3">
              <Link
                href="/signup/instructor"
                className="flex-1 text-center bg-brand-deep text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-brand-deep/90 transition-colors"
              >
                재신청하기
              </Link>
              <a
                href="mailto:contact@authenticart.co.kr"
                className="flex-1 text-center border border-brand-mist text-brand-grey text-sm font-medium px-4 py-2.5 rounded-full hover:border-brand-deep hover:text-brand-deep transition-colors"
              >
                문의하기
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <p className="font-bold text-brand-ink mb-1">강사 승인 완료!</p>
            <p className="text-sm text-brand-grey mb-6">
              {profile.approved_at && new Date(profile.approved_at).toLocaleDateString('ko-KR')} 승인
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 bg-brand-deep text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-brand-deep/90 transition-colors"
            >
              스튜디오 바로가기 <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
