import { useMemo, useState } from 'react'
import { FaPaperPlane, FaShoppingCart, FaPills, FaMoneyBillWave } from 'react-icons/fa'
import { useInventoryAlerts } from '../../context/InventoryAlertContext'
import { useSetPageHeader } from '../../context/PageHeaderContext'
import { getStoredUser } from '../../utils/authStorage'

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ'
}

export default function StaffHome() {
  useSetPageHeader(
    'Tổng quan bán hàng',
    'Theo dõi tiến độ bán hàng và công việc trong ngày của bạn',
  )

  const currentUser = useMemo(() => getStoredUser(), [])
  const staffName = currentUser?.name || 'Nhân viên'
  const { lowStockAlerts, updatedAt, orders, staffNotifications, sendAlert } =
    useInventoryAlerts()
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    medicineId: null,
    note: '',
  })

  const myRecentOrders = useMemo(
    () => orders.filter((item) => item.createdBy === staffName),
    [orders, staffName],
  )

  const shiftData = useMemo(() => {
    const today = new Date().toLocaleDateString('vi-VN')
    const todayOrders = myRecentOrders.filter(
      (item) => new Date(item.createdAt || item.date).toLocaleDateString('vi-VN') === today,
    )
    const completedTodayOrders = todayOrders.filter((item) => item.status === 'Hoàn thành')
    return {
      ordersToday: todayOrders.length,
      itemsSold: completedTodayOrders.reduce(
        (sum, order) =>
          sum +
          order.items.reduce((itemSum, line) => itemSum + (Number(line.qty) || 0), 0),
        0,
      ),
      revenue: completedTodayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    }
  }, [myRecentOrders])

  const selectedAlertMedicine = useMemo(
    () => lowStockAlerts.find((item) => item.id === alertModal.medicineId) || null,
    [alertModal.medicineId, lowStockAlerts],
  )

  const openAlertModal = (medicineId) => {
    setAlertModal({ isOpen: true, medicineId, note: '' })
  }

  const closeAlertModal = () => {
    setAlertModal({ isOpen: false, medicineId: null, note: '' })
  }

  const submitAlert = async (e) => {
    e.preventDefault()
    if (!selectedAlertMedicine) return
    try {
      const ok = await sendAlert(selectedAlertMedicine.id, alertModal.note, staffName)
      if (!ok) {
        alert('Không thể gửi cảnh báo cho thuốc này.')
        return
      }
      closeAlertModal()
    } catch (error) {
      alert(error?.response?.data?.message || 'Không gửi được cảnh báo tồn kho.')
    }
  }

  return (
    <div className="w-full space-y-6 pt-0 animate-in fade-in duration-300">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Đơn hàng */}
        <div className="group rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
              <FaShoppingCart size={24} />
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">Đơn hàng đã bán</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">{shiftData.ordersToday}</h3>
        </div>

        {/* Sản phẩm đã bán (Thay cho Ca làm) */}
        <div className="group rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white">
              <FaPills size={24} />
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">Sản phẩm bán ra</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">{shiftData.itemsSold}</h3>
        </div>

        {/* Doanh thu */}
        <div className="group rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-500 p-6 text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition group-hover:scale-110">
              <FaMoneyBillWave size={24} />
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-emerald-50">Doanh thu trong ngày</p>
          <h3 className="mt-1 text-3xl font-bold">{formatMoney(shiftData.revenue)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Đơn hàng gần đây của bạn</h2>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[22px] border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="whitespace-nowrap p-4 font-medium">Mã đơn</th>
                  <th className="whitespace-nowrap p-4 font-medium">Khách hàng</th>
                  <th className="whitespace-nowrap p-4 font-medium">Giờ tạo</th>
                  <th className="whitespace-nowrap p-4 text-right font-medium">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {myRecentOrders.slice(0, 8).map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-800">{item.id}</td>
                    <td className="p-4 text-slate-700">{item.customerName}</td>
                    <td className="p-4 text-slate-500">
                      {new Date(item.createdAt || item.date).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-800">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
                {myRecentOrders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-400">
                      Chưa có đơn hàng nào do tài khoản này tạo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cảnh báo tồn kho thấp</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cập nhật lúc {new Date(updatedAt).toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.alertStatus === 'PENDING'
                      ? 'border-yellow-100 bg-yellow-50/70'
                      : 'border-red-100 bg-red-50/70'
                  }`}
                >
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Còn <span className="font-bold text-red-600">{item.stock}</span> / ngưỡng tối thiểu{' '}
                    <span className="font-semibold">{item.minStock}</span>
                  </p>
                  {item.alertStatus === 'PENDING' && (
                    <p className="mt-1 text-xs font-semibold text-yellow-700">
                      Đang được Admin xử lý
                    </p>
                  )}
                  {item.alertStatus === 'NONE' && (
                    <button
                      type="button"
                      onClick={() => openAlertModal(item.id)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      <FaPaperPlane />
                      Gửi cảnh báo
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Không có thuốc nào dưới ngưỡng tồn kho.
              </p>
            )}
          </div>
        </div>
      </div>

      {staffNotifications.length > 0 && (
        <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Thông báo từ Admin</h2>
          <div className="mt-4 space-y-2">
            {staffNotifications.slice(0, 5).map((ntf) => (
              <div key={ntf.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-700">{ntf.message}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(ntf.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertModal.isOpen && selectedAlertMedicine && (
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
                  value={alertModal.note}
                  onChange={(e) =>
                    setAlertModal((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="Ví dụ: Thuốc bán nhanh, cần nhập thêm sớm"
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
    </div>
  )
}