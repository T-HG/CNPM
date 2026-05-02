import { useMemo, useState } from 'react'
import { useSetPageHeader } from '../../context/PageHeaderContext'
import { useInventoryAlerts } from '../../context/InventoryAlertContext'
import { FaSearch, FaExclamationTriangle } from 'react-icons/fa'

const roleOptions = ['Admin', 'Nhân viên bán hàng']
const ROOT_EMPLOYEE_ID = 'NV001'

export default function Employees() {
  useSetPageHeader(
    'Quản lý nhân viên',
    'Admin chỉ đổi vai trò và vô hiệu hóa/kích hoạt tài khoản nhân viên',
  )

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  const isAdmin = currentUser?.role === 'admin'
  const isRootAdmin =
    isAdmin &&
    (currentUser?.isRoot === true ||
      Number(currentUser?.accountId) === 1 ||
      String(currentUser?.employeeId || '').toUpperCase() === ROOT_EMPLOYEE_ID ||
      currentUser?.email === 'admin@gmail.com')
  const { employees, updateEmployeeRole, toggleEmployeeStatus } = useInventoryAlerts()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('Tất cả')

  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null,
  })

  const showAlert = (title, message) => {
    setDialog({ isOpen: true, type: 'alert', title, message, onConfirm: null })
  }

  const showConfirm = (title, message, onConfirmCallback) => {
    setDialog({ isOpen: true, type: 'confirm', title, message, onConfirm: onConfirmCallback })
  }

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((item) => {
      const keyword = search.trim().toLowerCase()

      const matchSearch =
        !keyword ||
        item.fullName.toLowerCase().includes(keyword) ||
        item.username.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        item.phone.includes(keyword)

      const matchRole = filterRole === 'Tất cả' || item.role === filterRole
      return matchSearch && matchRole
    })
  }, [employees, search, filterRole])

  const handleRoleChange = (employee, nextRole) => {
    if (!isAdmin) {
      showAlert('Từ chối truy cập', 'Chỉ Quản trị viên (Admin) mới có quyền đổi vai trò.')
      return
    }
    const isRootAccount =
      employee?.isRoot === true ||
      Number(employee?.accountId) === 1 ||
      String(employee?.id || '').toUpperCase() === ROOT_EMPLOYEE_ID
    if (isRootAccount) {
      showAlert(
        'Tài khoản được bảo vệ',
        'Tài khoản Chủ nhà thuốc (Root - ID = 1) không được phép chỉnh sửa vai trò.',
      )
      return
    }
    if (employee.role === 'Admin' && !isRootAdmin) {
      showAlert(
        'Không đủ quyền',
        'Chỉ tài khoản Chủ nhà thuốc (Root) mới có quyền chỉnh sửa vai trò của các Admin khác.',
      )
      return
    }
    updateEmployeeRole(employee.id, nextRole, currentUser)
  }

  const handleToggleStatus = (employee) => {
    if (!isAdmin) {
      showAlert('Từ chối truy cập', 'Chỉ Quản trị viên (Admin) mới có quyền vô hiệu hóa tài khoản.')
      return
    }
    const isRootAccount =
      employee?.isRoot === true ||
      Number(employee?.accountId) === 1 ||
      String(employee?.id || '').toUpperCase() === ROOT_EMPLOYEE_ID
    if (isRootAccount) {
      showAlert(
        'Tài khoản được bảo vệ',
        'Không thể khóa hoặc vô hiệu hóa tài khoản Chủ nhà thuốc (Root - ID = 1).',
      )
      return
    }
    if (employee.role === 'Admin' && !isRootAdmin) {
      showAlert(
        'Không đủ quyền',
        'Chỉ tài khoản Chủ nhà thuốc (Root) mới có quyền khóa/mở khóa tài khoản Admin.',
      )
      return
    }

    const willActive = !employee.isActive
    showConfirm(
      willActive ? 'Kích hoạt tài khoản' : 'Vô hiệu hóa tài khoản',
      willActive
        ? `Bạn có chắc muốn kích hoạt lại tài khoản [${employee.fullName}]?`
        : `Bạn có chắc muốn vô hiệu hóa tài khoản [${employee.fullName}]?`,
      () => {
        toggleEmployeeStatus(employee.id, willActive, currentUser)
        closeDialog()
      },
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full pt-0">
     
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard title="Tổng nhân viên" value={employees.length} subtitle="Toàn bộ tài khoản đã tạo" />
        <StatCard title="Quản trị viên" value={employees.filter((item) => item.role === 'Admin').length} subtitle="Tài khoản cấp Admin" />
        <StatCard
          title="Đang hoạt động"
          value={employees.filter((item) => item.isActive).length}
          subtitle="Tài khoản đang được phép đăng nhập"
        />
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-100">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-slate-400 xl:max-w-xl">
            <FaSearch />
            <input
              type="text"
              placeholder="Tìm theo mã, họ tên, username, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="Tất cả">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Nhân viên bán hàng">Nhân viên bán hàng</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-4 whitespace-nowrap">Mã NV</th>
                <th className="p-4 whitespace-nowrap">Họ tên</th>
                <th className="p-4 whitespace-nowrap">Điện thoại</th>
                <th className="p-4 whitespace-nowrap">Username</th>
                <th className="p-4 whitespace-nowrap">Vai trò</th>
                <th className="p-4 whitespace-nowrap">Trạng thái</th>
                <th className="p-4 whitespace-nowrap text-right">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-800">{item.id}</td>
                    <td className="p-4 text-slate-700 font-medium">{item.fullName}</td>
                    <td className="p-4 text-slate-600">{item.phone || '-'}</td>
                    <td className="p-4 text-slate-600">{item.username}</td>
                    <td className="p-4">
                      {(() => {
                        const isRootAccount =
                          item?.isRoot === true ||
                          Number(item?.accountId) === 1 ||
                          String(item?.id || '').toUpperCase() === ROOT_EMPLOYEE_ID
                        const canEditRole =
                          isAdmin && !isRootAccount && (isRootAdmin || item.role !== 'Admin')
                        return (
                      <select
                        value={item.role}
                        onChange={(e) => handleRoleChange(item, e.target.value)}
                        disabled={!canEditRole}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${
                          canEditRole
                            ? 'border-slate-200 bg-white text-slate-700 focus:border-emerald-400'
                            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                        )
                      })()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {item.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={
                            !isAdmin ||
                            item?.isRoot === true ||
                            Number(item?.accountId) === 1 ||
                            String(item?.id || '').toUpperCase() === ROOT_EMPLOYEE_ID ||
                            (item.role === 'Admin' && !isRootAdmin)
                          }
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            item.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                          } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-inherit disabled:hover:text-inherit`}
                          title={item.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt lại tài khoản'}
                        >
                          {item.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-400">
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CUSTOM POPUP (THAY THẾ ALERT/CONFIRM) --- */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${dialog.type === 'confirm' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                <FaExclamationTriangle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{dialog.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{dialog.message}</p>
            </div>

            <div className="flex gap-3 bg-slate-50 p-4">
              {dialog.type === 'confirm' ? (
                <>
                  <button onClick={closeDialog} className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition">
                    Hủy
                  </button>
                  <button onClick={dialog.onConfirm} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition">
                    Xác nhận
                  </button>
                </>
              ) : (
                <button onClick={closeDialog} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition">
                  Đã hiểu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-100 hover:shadow-xl transition">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-2 text-xs font-medium text-slate-400">{subtitle}</p>
    </div>
  )
}