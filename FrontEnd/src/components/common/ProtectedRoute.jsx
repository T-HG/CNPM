import { Navigate } from 'react-router-dom'
import { getStoredUser } from '../../utils/authStorage'

export default function ProtectedRoute({ children, allowRoles }) {
  const user = getStoredUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowRoles && !allowRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/staff'} replace />
  }

  return children
}