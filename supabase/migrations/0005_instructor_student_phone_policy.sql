-- 강사가 본인 클래스 수강생(paid/approved/completed)의 phone 조회 허용
DROP POLICY IF EXISTS "instructor_read_student_phone" ON public.users;
CREATE POLICY "instructor_read_student_phone" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR public.get_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.class_schedules s ON s.id = b.schedule_id
      JOIN public.classes c ON c.id = s.class_id
      WHERE b.student_id = users.id
        AND c.instructor_id = auth.uid()
        AND b.status IN ('approved', 'paid', 'completed')
    )
  );
