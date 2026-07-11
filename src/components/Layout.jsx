import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import InstallPrompt from './InstallPrompt'
import OfflineBanner from './OfflineBanner'

export default function Layout() {
  const { pathname } = useLocation()

  // Vuelve al inicio de la página al cambiar de ruta.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-ink text-fg">
      <OfflineBanner />
      <Header />
      {/* pb en móvil para dejar espacio a la barra inferior */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <InstallPrompt />
    </div>
  )
}
