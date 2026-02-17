import { redirect } from 'next/navigation'

/** ルートは /dashboard にリダイレクト */
export default function Home() {
  redirect('/dashboard')
}
