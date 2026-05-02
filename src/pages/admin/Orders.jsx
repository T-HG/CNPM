import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { useInventoryAlerts } from '../../context/InventoryAlertContext'
import { useSetPageHeader } from '../../context/PageHeaderContext'
import {
  FaSearch,
  FaFileExport,
  FaEye,
  FaTimes,
  FaPrint,
  FaCheckCircle,
} from 'react-icons/fa'

const statusOptions = ['Tất cả', 'Hoàn thành', 'Đã hủy']

function displayOrderStatus(status) {
  return status === 'Đã hủy' ? 'Đã hủy' : 'Hoàn thành'
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ'
}

function csvSafe(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export default function Orders() {
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  const isAdmin = currentUser?.role === 'admin'

  useSetPageHeader(
    'Đơn hàng',
    isAdmin
      ? 'Quản lý toàn bộ hóa đơn bán hàng trong hệ thống'
      : 'Theo dõi các hóa đơn do tài khoản của bạn thực hiện',
  )

  const { orders, updateOrderStatus, loading, error, refreshData } = useInventoryAlerts()
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Tất cả')
  
  // State cho Modal chi tiết
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Lọc đơn hàng
  const scopedOrders = useMemo(() => {
    if (isAdmin) return orders
    const id = currentUser?.employeeId
    if (id) return orders.filter((item) => item.employeeId === id)
    const staffName = currentUser?.name || ''
    return orders.filter((item) => item.createdBy === staffName)
  }, [currentUser?.employeeId, currentUser?.name, isAdmin, orders])

  const filteredOrders = useMemo(() => {
    return scopedOrders.filter((item) => {
      const keyword = search.trim().toLowerCase()
      const matchSearch =
        !keyword ||
        item.id.toLowerCase().includes(keyword) ||
        item.customerName.toLowerCase().includes(keyword) ||
        item.phone.includes(keyword)

      const itemStatus = displayOrderStatus(item.status)
      const matchStatus = selectedStatus === 'Tất cả' || itemStatus === selectedStatus

      return matchSearch && matchStatus
    })
  }, [scopedOrders, search, selectedStatus])

  // Hàm hiển thị màu sắc theo trạng thái
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Hoàn thành':
        return 'bg-emerald-50 text-emerald-600'
      case 'Đã hủy':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const handleExportOrders = () => {
    if (!isAdmin) return
    if (filteredOrders.length === 0) {
      alert('Không có dữ liệu để xuất file.')
      return
    }

    const headers = [
      'Mã HĐ',
      'Khách hàng',
      'SĐT',
      'Thời gian',
      'Tổng tiền',
      'Trạng thái',
      'Nhân viên thực hiện',
    ]

    const rows = filteredOrders.map((item) => [
      item.id,
      item.customerName,
      item.phone || '',
      item.date,
      Number(item.total || 0),
      item.status,
      item.createdBy || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => csvSafe(cell)).join(','))
      .join('\n')

    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`
    const fileName = `danh-sach-don-hang-${stamp}.csv`

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleExportInvoicePdf = () => {
    if (!selectedOrder) return

    const doc = new jsPDF()
    const marginX = 14
    let y = 16

    doc.setFontSize(16)
    doc.text(`HOA DON BAN HANG - ${selectedOrder.id}`, marginX, y)
    y += 10

    doc.setFontSize(11)
    doc.text(`Ngay tao: ${selectedOrder.date || ''}`, marginX, y)
    y += 6
    doc.text(`Khach hang: ${selectedOrder.customerName || 'Khach le'}`, marginX, y)
    y += 6
    doc.text(`So dien thoai: ${selectedOrder.phone || '-'}`, marginX, y)
    y += 6
    doc.text(`Nhan vien: ${selectedOrder.createdBy || '-'}`, marginX, y)
    y += 6
    doc.text(`Trang thai: ${selectedOrder.status || '-'}`, marginX, y)
    y += 10

    doc.setFontSize(10)
    doc.text('STT', 14, y)
    doc.text('San pham', 25, y)
    doc.text('SL', 138, y)
    doc.text('Don gia', 152, y, { align: 'right' })
    doc.text('Thanh tien', 196, y, { align: 'right' })
    y += 3
    doc.line(14, y, 196, y)
    y += 6

    selectedOrder.items.forEach((item, index) => {
      if (y > 275) {
        doc.addPage()
        y = 16
      }
      const lineTotal = Number(item.total || 0).toLocaleString('vi-VN')
      const linePrice = Number(item.price || 0).toLocaleString('vi-VN')
      doc.text(String(index + 1), 14, y)
      doc.text(String(item.name || ''), 25, y, { maxWidth: 108 })
      doc.text(String(item.qty || 0), 138, y)
      doc.text(`${linePrice} d`, 152, y, { align: 'right' })
      doc.text(`${lineTotal} d`, 196, y, { align: 'right' })
      y += 7
    })

    y += 4
    doc.line(14, y, 196, y)
    y += 8
    doc.setFontSize(12)
    doc.text(`Tong thanh toan: ${Number(selectedOrder.total || 0).toLocaleString('vi-VN')} d`, 196, y, {
      align: 'right',
    })

    doc.save(`hoa-don-${selectedOrder.id}.pdf`)
  }

  return (
    <div className="w-full space-y-4 pt-0 animate-in fade-in duration-300">
      {loading ? (
        <div className="rounded-[28px] bg-white p-8 text-center text-sm text-slate-500 shadow-lg ring-1 ring-slate-100">
          Đang tải danh sách đơn hàng từ database...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-lg ring-1 ring-red-100">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => refreshData()}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* LEFT FILTER */}
        <div className="space-y-5">
          <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-100">
            <h3 className="mb-3 px-2 text-sm font-bold text-slate-800">TRẠNG THÁI</h3>
            <div className="space-y-1">
              {statusOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedStatus(item)}
                  className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                    selectedStatus === item
                      ? 'bg-blue-50 font-semibold text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-100">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-slate-400 xl:max-w-xs">
              <FaSearch />
              <input
                type="text"
                placeholder="Theo mã HD, tên, SĐT khách..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportOrders}
                  disabled={filteredOrders.length === 0}
                  className="flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaFileExport />
                  Xuất danh sách
                </button>
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-sky-50 text-left text-slate-500">
                <tr>
                  <th className="whitespace-nowrap p-4">Mã HĐ</th>
                  <th className="whitespace-nowrap p-4">Khách hàng</th>
                  <th className="whitespace-nowrap p-4">Thời gian</th>
                  <th className="whitespace-nowrap p-4 text-right">Tổng tiền</th>
                  <th className="whitespace-nowrap p-4 text-center">Trạng thái</th>
                  <th className="whitespace-nowrap p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-800">{item.id}</td>
                      <td className="p-4">
                        <p className="font-medium text-blue-600">{item.customerName}</p>
                        {item.phone && <p className="text-xs text-slate-500">{item.phone}</p>}
                      </td>
                      <td className="p-4 text-slate-600">{item.date}</td>
                      <td className="p-4 text-right font-semibold text-slate-800">
                        {formatMoney(item.total)}
                      </td>
                      <td className="p-4 text-center">
                        <select
                          value={displayOrderStatus(item.status)}
                          onChange={(e) => updateOrderStatus(item.id, e.target.value)}
                          disabled={!isAdmin}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${getStatusBadge(displayOrderStatus(item.status))} border-transparent ${
                            !isAdmin ? 'cursor-not-allowed opacity-80' : ''
                          }`}
                        >
                          {statusOptions
                            .filter((status) => status !== 'Tất cả')
                            .map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedOrder(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400">
                      Không tìm thấy đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Hiển thị <span className="font-semibold">{filteredOrders.length}</span> /{' '}
            <span className="font-semibold">{scopedOrders.length}</span> đơn trong phạm vi truy vấn
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Chi tiết hóa đơn: {selectedOrder.id}</h2>
                <p className="mt-1 text-sm text-slate-500">Ngày tạo: {selectedOrder.date}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            {/* Nội dung Modal */}
            <div className="p-6">
              {/* Thông tin khách & Trạng thái */}
              <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">Khách hàng</p>
                  <p className="font-semibold text-slate-800">{selectedOrder.customerName}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.phone || 'Không có SĐT'}</p>
                  <p className="mt-2 text-xs text-slate-500">Nhân viên thực hiện</p>
                  <p className="text-sm font-medium text-slate-700">{selectedOrder.createdBy || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(displayOrderStatus(selectedOrder.status))}`}>
                    {displayOrderStatus(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <h3 className="mb-3 font-bold text-slate-800">Danh sách sản phẩm</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3 text-center">SL</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="p-3 font-medium text-slate-700">{item.name}</td>
                        <td className="p-3 text-center text-slate-600">{item.unit}</td>
                        <td className="p-3 text-center text-slate-600">{item.qty}</td>
                        <td className="p-3 text-right text-slate-600">{formatMoney(item.price)}</td>
                        <td className="p-3 text-right font-semibold text-slate-800">{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tổng cộng */}
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2 rounded-xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tổng tiền hàng:</span>
                    <span>{formatMoney(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-800">
                    <span>Khách cần trả:</span>
                    <span className="text-blue-600">{formatMoney(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              {!isAdmin && (
                <button
                  type="button"
                  onClick={handleExportInvoicePdf}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-200"
                >
                  <FaPrint />
                  In hóa đơn
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                <FaCheckCircle />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}