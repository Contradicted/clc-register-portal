import { LogoutButton } from '@/components/auth/LogoutButton'
import { redirect } from 'next/navigation'

export default function Home() {
    return redirect('/dashboard')
}
