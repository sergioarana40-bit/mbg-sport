import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Promotions from './pages/Promotions'
import OrderConfirmation from './pages/OrderConfirmation'
import Terms from './pages/Terms'
import Repairs from './pages/Repairs'
import NotFound from './pages/NotFound'

import Favorites from './pages/Favorites'
import Account from './pages/account/Account'
import OrderTracking from './pages/account/OrderTracking'
import CustomerLogin from './pages/account/CustomerLogin'
import Register from './pages/account/Register'

import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminBanners from './pages/admin/AdminBanners'
import AdminCategories from './pages/admin/AdminCategories'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminOrders from './pages/admin/AdminOrders'
import AdminRepairs from './pages/admin/AdminRepairs'

export default function App() {
  return (
    <Routes>
      {/* Landing corporativa (cabecera propia, antecede a la tienda) */}
      <Route path="/" element={<Landing />} />

      {/* Tienda (cliente) */}
      <Route element={<Layout />}>
        <Route path="/tienda" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/catalogo/:slug" element={<Catalog />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/promociones" element={<Promotions />} />
        <Route path="/favoritos" element={<Favorites />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido/:id" element={<OrderConfirmation />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="/reparaciones" element={<Repairs />} />
        <Route path="/cuenta" element={<Account />} />
        <Route path="/cuenta/pedidos/:id" element={<OrderTracking />} />
        <Route path="/cuenta/login" element={<CustomerLogin />} />
        <Route path="/cuenta/registro" element={<Register />} />
      </Route>

      {/* Panel de administración */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="banner" element={<AdminBanners />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="cupones" element={<AdminCoupons />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="reparaciones" element={<AdminRepairs />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
