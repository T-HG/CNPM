import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, allowRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowRoles && !allowRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/staff'} replace />
  }

  return children
}