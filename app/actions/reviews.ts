'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const classId = formData.get('class_id') as string
  const bookingId = formData.get('booking_id') as string | null
  const rating = parseInt(formData.get('rating') as string)
  const content = formData.get('content') as string

  if (!classId || !rating || rating < 1 || rating > 5) {
    return { error: '별점을 선택해주세요.' }
  }

  const { error } = await supabase.from('class_reviews').upsert({
    class_id: classId,
    student_id: user.id,
    booking_id: bookingId || null,
    rating,
    content: content?.trim() || null,
  }, { onConflict: 'class_id,student_id' })

  if (error) return { error: error.message }

  revalidatePath(`/classes/${classId}`)
  return { success: true }
}

export async function deleteReview(classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  await supabase.from('class_reviews')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', user.id)

  revalidatePath(`/classes/${classId}`)
  return { success: true }
}
