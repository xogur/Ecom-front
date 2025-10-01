import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * 주의:
 * - user가 {}(빈 객체)여도 truthy입니다. 반드시 명시적 기준으로 판정하세요.
 * - auth.isLoading 같은 로딩 플래그가 있다면 로딩이 끝날 때까지 리다이렉트 금지.
 * - replace를 써서 브라우저 뒤로가기로 무한 왕복되는 걸 방지.
 */
export default function PrivateRoute({ publicPage = false }) {
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useSelector((s) => s.auth ?? {})

  // 1) 로딩 중이면 아무것도 리다이렉트하지 않음 (깜빡임/오판 방지)
  if (isLoading) {
    return null // 또는 스피너 컴포넌트
  }

  // 2) 명시적 로그인 판정 로직
  const loggedIn =
    typeof isAuthenticated === 'boolean'
      ? isAuthenticated
      : !!(user && (user.id || user.username || user.email))

  // 3) 비로그인 전용 페이지(/login, /register)
  if (publicPage) {
    return loggedIn ? <Navigate to="/" replace /> : <Outlet />
  }

  // 4) 보호 페이지
  return loggedIn
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
