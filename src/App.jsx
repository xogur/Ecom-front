import React from 'react'
import './App.css'
import Products from './components/products/Products'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/home/Home'
import Navbar from './components/shared/Navbar'
import About from './components/About'
import Contact from './components/Contact'
import { Toaster } from 'react-hot-toast'
import Cart from './components/cart/Cart'
import LogIn from './components/auth/LogIn'
import OAuthSuccess from "./components/auth/OAuthSuccess";
import PrivateRoute from './components/PrivateRoute'
import Register from './components/auth/Register'
import Checkout from './components/checkout/Checkout'
import PaymentSuccess from './components/checkout/PaymentSuccess';
import PaymentConfirmation from './components/checkout/PaymentConfirmation'
import AdminPage from './components/admin/AdminPage';
import OrderProfile from './components/profile/OrderProfile';
import Profile from './components/profile/Profile';

function App() {
  return (
    <React.Fragment>
      <Router>
        <Navbar />
        <Routes>
          {/* 공개 페이지 */}
          <Route path='/' element={<Home />}/>
          <Route path='/products' element={<Products />}/>
          <Route path='/about' element={<About />}/>
          <Route path='/contact' element={<Contact />}/>
          <Route path='/cart' element={<Cart />}/>
          <Route path="/payment/success" element={<PaymentSuccess />} />

          {/* 보호 라우트(로그인 필요) */}
          <Route element={<PrivateRoute />}>
            <Route path='/checkout' element={<Checkout />}/>
            <Route path='/order-confirm' element={<PaymentConfirmation />}/>
            <Route path='/admin' element={<AdminPage />} />
            <Route path='/profile/orders' element={<OrderProfile />} />
            <Route path='/profile' element={<Profile />} />
          </Route>

          {/* 비로그인 전용 라우트(로그인/회원가입/OAuth 완료) */}
          <Route element={<PrivateRoute publicPage />}>
            <Route path='/login' element={<LogIn />}/>
            <Route path="/oauth/success" element={<OAuthSuccess />} />
            <Route path='/register' element={<Register />}/>
          </Route>

          {/* (선택) 404 핸들링이 필요하면 별도 컴포넌트로 */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Router>
      <Toaster position='bottom-center'/>
    </React.Fragment>
  )
}

export default App
