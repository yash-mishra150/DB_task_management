'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      pathname.startsWith(path) ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
    }`

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-bold text-blue-600">
            TaskManager
          </Link>
          <Link href="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
          <Link href="/projects" className={linkClass('/projects')}>Projects</Link>
        </div>
        <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
          Logout
        </button>
      </div>
    </nav>
  )
}
