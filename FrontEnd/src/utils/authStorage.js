/** Đọc user từ localStorage; nếu JSON lỗi thì xóa và trả về null (tránh crash trang trắng). */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    if (raw == null || raw === '' || raw === 'undefined') {
      return null
    }
    const user = JSON.parse(raw)
    if (!user || typeof user !== 'object') {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      return null
    }
    return user
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}
