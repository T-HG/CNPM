import { useState } from 'react'
import { useSetPageHeader } from '../../context/PageHeaderContext'
import api, { getApiError } from '../../models/api'
import { getStoredUser as readStoredUser } from '../../utils/authStorage'

export default function Profile() {
  useSetPageHeader(
    'Thông tin cá nhân',
    'Xem, chỉnh sửa hồ sơ và thay đổi mật khẩu tài khoản của bạn',
  )

  const [user, setUser] = useState(() => readStoredUser())

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileMsg, setProfileMsg] = useState(null)
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(null)

    const name = profileForm.name.trim()
    const email = profileForm.email.trim()
    if (!name || !email) {
      setProfileMsg({ type: 'error', text: 'Họ tên và email không được để trống.' })
      return
    }

    setIsSavingProfile(true)
    try {
      const response = await api.patch('/auth/profile', {
        fullName: name,
        email,
        phone: profileForm.phone.trim(),
      })
      const { user: updatedUser, token } = response.data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      localStorage.setItem('token', token)
      setUser(updatedUser)
      window.dispatchEvent(new Event('user-updated'))
      setProfileMsg({ type: 'success', text: 'Đã cập nhật thông tin cá nhân.' })
    } catch (error) {
      setProfileMsg({
        type: 'error',
        text: getApiError(error, 'Không cập nhật được thông tin cá nhân.'),
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)

    const { currentPassword, newPassword, confirmPassword } = passwordForm
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ các trường mật khẩu.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu nhập lại không khớp.' })
      return
    }
    if (currentPassword === newPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới không được trùng mật khẩu hiện tại.' })
      return
    }

    setIsChangingPassword(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công.' })
    } catch (error) {
      setPasswordMsg({
        type: 'error',
        text: getApiError(error, 'Không đổi được mật khẩu. Vui lòng thử lại.'),
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="w-full space-y-6 pt-0 animate-in fade-in duration-300">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đổi mật khẩu
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-slate-900">Hồ sơ cá nhân</h2>
            <p className="mt-1 text-sm text-slate-500">
              Vai trò: {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
            </p>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              {profileMsg && (
                <p
                  className={`rounded-xl px-4 py-3 text-sm ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {profileMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h2>
            <p className="mt-1 text-sm text-slate-500">
              Đặt mật khẩu mới để tăng cường bảo mật tài khoản.
            </p>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nhập lại mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              {passwordMsg && (
                <p
                  className={`rounded-xl px-4 py-3 text-sm ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {passwordMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={isChangingPassword}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  )
}
