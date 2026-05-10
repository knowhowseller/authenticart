import { Resend } from 'resend'

export const FROM_EMAIL = 'noreply@authenticart.kr'
export const FROM_NAME = '오센틱아트'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const resend = getResend()
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[email mock]', { to, subject })
    }
    return
  }
  return resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  })
}
