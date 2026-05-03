import { useEffect, useMemo, useState } from 'react'
import {
  FaExclamationTriangle,
  FaPaperPlane,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaTools,
} from 'react-icons/fa'
import { useSearchParams } from 'react-router-dom'
import {
  getDisplayStatus,
  useInventoryAlerts,
} from '../../context/InventoryAlertContext'
import { useSetPageHeader } from '../../context/PageHeaderContext'
import { getStoredUser } from '../../utils/authStorage'

export default function Inventory() {
  useSetPageHeader('Kiểm tra tồn kho', 'Tra cứu tồn kho thuốc realtime')
  const [searchParams, setSearchParams] = useSearchParams()

  const user = useMemo(() => getStoredUser(), [])
  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'

  const {
    medicines,
    pendingAlerts,
    sendAlert,
    resolveAlert,
    formatDateTime,
  } = useInventoryAlerts()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Tất cả')
  const [stockSortOrder, setStockSortOrder] = useState(null) // null | asc | desc
  const [staffAlertModal, setStaffAlertModal] = useState({
    isOpen: false,
    medicineId: null,
    note: '',
  })
  const [adminProcessModal, setAdminProcessModal] = useState({
    isOpen: false,
    alertId: null,
    scenario: 'RECEIPT', // RECEIPT | REJECT | ADJUSTMENT
    quantity: '',
    actualStock: '',
    reason: '',
  })

  const filteredData = useMemo(() => {
    const matched = medicines.filter((item) => {
      const keyword = search.toLowerCase()

      const matchSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword)

      const status = getDisplayStatus(item)
      const matchStatus = (() => {
        if (filterStatus === 'Tất cả') return true
        if (filterStatus === 'Bình thường') return status.label === 'Bình thường'
        if (filterStatus === 'Đang xử lý') return status.label === 'Đang xử lý'
        if (filterStatus === 'Sắp hết/Hết hàng') return status.tone === 'danger'
        return true
      })()

      return matchSearch && matchStatus
    })
    if (!stockSortOrder) return matched
    const sorted = [...matched].sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    return stockSortOrder === 'asc' ? sorted : sorted.reverse()
  }, [medicines, search, filterStatus, stockSortOrder])

  const handleToggleStockSort = () => {
    setStockSortOrder((prev) => {
      if (prev === null) return 'asc'
      if (prev === 'asc') return 'desc'
      return null
    })
  }

  const selectedAlertMedicine = useMemo(
    () => medicines.find((item) => item.id === staffAlertModal.medicineId) || null,
    [medicines, staffAlertModal.medicineId],
  )

  const selectedProcessMedicine = useMemo(
    () => pendingAlerts.find((item) => item.id === adminProcessModal.alertId) || null,
    [pendingAlerts, adminProcessModal.alertId],
  )

  useEffect(() => {
    const processAlertId = searchParams.get('processAlert')
    if (!isAdmin || !processAlertId) return

    const exists = pendingAlerts.some((item) => item.id === processAlertId)
    if (exists) {
      openProcessModal(processAlertId)
      setSearchParams({}, { replace: true })
    }
  }, [isAdmin, pendingAlerts, searchParams, setSearchParams])

  const openAlertModal = (medicineId) => {
    setStaffAlertModal({ isOpen: true, medicineId, note: '' })
  }

  const closeAlertModal = () => {
    setStaffAlertModal({ isOpen: false, medicineId: null, note: '' })
  }

  const submitAlert = async (e) => {
    e.preventDefault()
    if (!selectedAlertMedicine) return

    try {
      const ok = await sendAlert(selectedAlertMedicine.id, staffAlertModal.note, user?.name || 'Nhân viên')
      if (!ok) {
        alert('Không thể gửi cảnh báo cho thuốc này.')
        return
      }
      closeAlertModal()
    } catch (error) {
      alert(error?.response?.data?.message || 'Không gửi được cảnh báo tồn kho.')
    }
  }

  const openProcessModal = (alertId) => {
    setAdminProcessModal({
      isOpen: true,
      alertId,
      scenario: 'RECEIPT',
      quantity: '',
      actualStock: '',
      reason: '',
    })
  }

  const closeProcessModal = () => {
    setAdminProcessModal({
      isOpen: false,
      alertId: null,
      scenario: 'RECEIPT',
      quantity: '',
      actualStock: '',
      reason: '',
    })
  }

  const submitProcess = async (e) => {
    e.preventDefault()
    if (!selectedProcessMedicine) return

    let ok = false
    if (adminProcessModal.scenario === 'RECEIPT') {
      ok = await resolveAlert(selectedProcessMedicine.id, {
        type: 'RECEIPT',
        quantity: Number(adminProcessModal.quantity),
      })
    } else if (adminProcessModal.scenario === 'REJECT') {
      ok = await resolveAlert(selectedProcessMedicine.id, {
        type: 'REJECT',
        reason: adminProcessModal.reason.trim(),
      })
    } else if (adminProcessModal.scenario === 'ADJUSTMENT') {
      ok = await resolveAlert(selectedProcessMedicine.id, {
        type: 'ADJUSTMENT',
        actualStock: Number(adminProcessModal.actualStock),
      })
    }

    if (!ok) {
      alert('Dữ liệu xử lý chưa hợp lệ. Vui lòng kiểm tra lại.')
      return
    }
    closeProcessModal()
  }

  return (
    <div className="space-y-6 pt-0 w-full animate-in fade-in duration-300">
      {isAdmin && (
        <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Cảnh báo tồn kho chờ xử lý</h2>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
              {pendingAlerts.length} cảnh báo
            </span>
          </div>

          {pendingAlerts.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Không có cảnh báo nào đang chờ xử lý.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingAlerts.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.medicineName} ({item.medicineId})
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Tồn kho: <span className="font-bold text-red-600">{item.stock}</span> / Min:{' '}
                      {item.minStock}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Báo bởi {item.createdBy || 'Nhân viên'} lúc {formatDateTime(item.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tốc độ bán: 7 ngày ~{item.avgSold7d} đơn vị, 30 ngày ~{item.avgSold30d} đơn vị
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Nhà cung cấp: {item.supplierName} | Giá nhập gần nhất:{' '}
                      {Number(item.lastImportPrice).toLocaleString('vi-VN')} đ
                      {item.note ? ` | Ghi chú: ${item.note}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openProcessModal(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <FaTools />
                    Xử lý cảnh báo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition focus-within:ring-emerald-400">
          <FaSearch className="text-slate-400" />
          <input
            placeholder="Tìm theo mã, tên thuốc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 text-sm"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 text-slate-700 text-sm outline-none focus:ring-emerald-400"
        >
          <option>Tất cả</option>
          <option>Bình thường</option>
          <option>Sắp hết/Hết hàng</option>
          <option>Đang xử lý</option>
        </select>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-100">
        <div className="overflow-x-auto rounded-[22px] border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-4 whitespace-nowrap">Mã thuốc</th>
                <th className="p-4 whitespace-nowrap">Tên thuốc</th>
                <th className="p-4 whitespace-nowrap">Đơn vị</th>
                <th className="p-4 whitespace-nowrap text-right">Tối thiểu</th>
                <th className="p-4 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={handleToggleStockSort}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold text-blue-600 transition hover:bg-blue-50"
                    title="Bấm để sắp xếp theo số lượng tồn kho"
                  >
                    Tồn kho
                    {stockSortOrder === 'asc' ? (
                      <FaSortUp className="translate-y-[2px]" />
                    ) : stockSortOrder === 'desc' ? (
                      <FaSortDown className="-translate-y-[1px]" />
                    ) : (
                      <FaSort className="text-blue-400" />
                    )}
                  </button>
                </th>
                <th className="p-4 whitespace-nowrap text-center">Trạng thái</th>
                <th className="p-4 whitespace-nowrap text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => {
                  const status = getDisplayStatus(item)
                  const canSendAlert =
                    item.medicineStatus !== 'Ngừng kinh doanh' &&
                    item.stock <= item.minStock &&
                    item.alertStatus === 'NONE'
                  const isPendingAlert =
                    item.stock <= item.minStock && item.alertStatus === 'PENDING'

                  return (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-800">{item.id}</td>
                      <td className="p-4 text-slate-700 font-medium">{item.name}</td>
                      <td className="p-4 text-slate-600">{item.unit}</td>
                      <td className="p-4 text-right text-slate-600">{item.minStock}</td>
                      <td className="p-4 font-bold text-slate-800 text-right">{item.stock}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            status.tone === 'safe'
                              ? 'bg-emerald-50 text-emerald-600'
                              : status.tone === 'disabled'
                              ? 'bg-slate-100 text-slate-500'
                              : status.tone === 'pending'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {isStaff ? (
                          <>
                            {canSendAlert ? (
                              <button
                                type="button"
                                onClick={() => openAlertModal(item.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                              >
                                <FaPaperPlane />
                                Gửi cảnh báo
                              </button>
                            ) : isPendingAlert ? (
                              <button
                                type="button"
                                disabled
                                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"
                              >
                                <FaPaperPlane />
                                Đang xử lý
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </>
                        ) : isAdmin && isPendingAlert ? (
                          <button
                            type="button"
                            onClick={() =>
                              openProcessModal(
                                pendingAlerts.find((alert) => alert.medicineId === item.id)?.id,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            <FaTools />
                            Xử lý
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-400">
                    Không tìm thấy thuốc phù hợp với từ khóa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {staffAlertModal.isOpen && selectedAlertMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Gửi cảnh báo tồn kho</h3>
            <p className="mt-2 text-sm text-slate-600">
              Thuốc: <span className="font-semibold">{selectedAlertMedicine.name}</span> (
              {selectedAlertMedicine.id})
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Tồn hiện tại: {selectedAlertMedicine.stock} / Tối thiểu:{' '}
              {selectedAlertMedicine.minStock}
            </p>

            <form onSubmit={submitAlert} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={staffAlertModal.note}
                  onChange={(e) =>
                    setStaffAlertModal((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="Ví dụ: Thuốc bán nhanh trong ca tối, cần nhập gấp"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAlertModal}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Xác nhận gửi cảnh báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adminProcessModal.isOpen && selectedProcessMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Xử lý cảnh báo tồn kho</h3>
            <p className="mt-2 text-sm text-slate-600">
              Thuốc: <span className="font-semibold">{selectedProcessMedicine.medicineName}</span> (
              {selectedProcessMedicine.medicineId})
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Tồn hiện tại: {selectedProcessMedicine.stock} / Tối thiểu:{' '}
              {selectedProcessMedicine.minStock}
            </p>
            {selectedProcessMedicine.note && (
              <p className="mt-1 text-xs text-slate-500">
                Ghi chú staff: {selectedProcessMedicine.note}
              </p>
            )}

            <form onSubmit={submitProcess} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phương án xử lý
                </label>
                <select
                  value={adminProcessModal.scenario}
                  onChange={(e) =>
                    setAdminProcessModal((prev) => ({ ...prev, scenario: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="RECEIPT">Duyệt nhập hàng mới</option>
                  <option value="REJECT">Từ chối nhập hàng</option>
                  <option value="ADJUSTMENT">Sai sót kiểm kê (Điều chỉnh tồn)</option>
                </select>
              </div>

              {adminProcessModal.scenario === 'RECEIPT' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Số lượng nhập thêm
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adminProcessModal.quantity}
                    onChange={(e) =>
                      setAdminProcessModal((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="Nhập số lượng"
                  />
                </div>
              )}

              {adminProcessModal.scenario === 'ADJUSTMENT' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Số lượng tồn thực tế
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adminProcessModal.actualStock}
                    onChange={(e) =>
                      setAdminProcessModal((prev) => ({ ...prev, actualStock: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="Nhập số thực tế sau kiểm kê"
                  />
                </div>
              )}

              {adminProcessModal.scenario === 'REJECT' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Lý do từ chối nhập
                  </label>
                  <textarea
                    rows={3}
                    value={adminProcessModal.reason}
                    onChange={(e) =>
                      setAdminProcessModal((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="Ví dụ: Thuốc ngừng kinh doanh theo mùa..."
                  />
                </div>
              )}

              <div className="rounded-xl bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                <FaExclamationTriangle className="mr-2 inline-block" />
                Sau khi xác nhận, hệ thống sẽ đóng vòng đời cảnh báo (RESOLVED/REJECTED),
                đồng thời gửi thông báo ngược cho nhân viên.
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProcessModal}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Cập nhật tồn kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}