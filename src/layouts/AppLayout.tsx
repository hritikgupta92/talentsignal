import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Menu, X, UserRound } from 'lucide-react'
import { Logo } from '../components/shared/Logo'
import { Button } from '../components/ui/button'
import { signOut as signOutUser } from '../features/auth/authService'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/dashboard', label: 'Dashboard' },
]

export function AppLayout() {
  const { appUser, isAuthenticated, reset } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  async function handleSignOut() {
    await signOutUser()
    reset()
    closeMobileMenu()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NavLink to="/" aria-label="TalentSignal home">
            <Logo />
          </NavLink>

          <nav className="hidden items-center rounded-full border border-slate-200 bg-slate-50 p-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 sm:flex">
              <UserRound size={16} />
              {isAuthenticated ? appUser?.role ?? 'Account' : 'Guest'}
            </div>
            {isAuthenticated ? (
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={handleSignOut}>
                Sign out
              </Button>
            ) : null}
            <NavLink to="/auth">
              <Button variant="secondary" className="hidden sm:inline-flex">
                {isAuthenticated ? 'Switch role' : 'Login'}
              </Button>
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((value) => !value)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg shadow-slate-200/60 md:hidden">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/auth"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`
                }
              >
                {isAuthenticated ? 'Switch role' : 'Login / Signup'}
              </NavLink>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  Sign out
                </button>
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
