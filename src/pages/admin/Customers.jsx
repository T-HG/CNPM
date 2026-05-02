import { useMemo, useState } from 'react'
import { useInventoryAlerts } from '../../context/InventoryAlertContext'
import { useSetPageHeader } from '../../context/PageHeaderContext'
import {
  FaFileExport,
  FaSearch,
} from 'react-icons/fa'

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + ' đ'
}

function csvSafe(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export default function Customers() {
  useSetPageHeader(
    'Khách hàng',
    'Danh sách khách hàng được tự động tạo từ các đơn hàng phát sinh',
  )

  const { customersFromOrders, loading, error, refreshData } = useInventoryAlerts()
  const [search, setSearch] = useState('')

  // Lọc danh sách khách hàng
  const filteredCustomers = useMemo(() => {
    return customersFromOrders.filter((item) => {
      const keyword = search.trim().toLowerCase()
      return (
        !keyword ||
        item.id.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword) ||
        item.phone.includes(keyword)
      )
    })
  }, [customersFromOrders, search])

  const handleExportCustomers = () => {
    if (filteredCustomers.length === 0) {
      alert('Không có dữ liệu để xuất file.')
      return
    }

    const headers = ['Mã KH', 'Tên khách hàng', 'Số điện thoại', 'Tổng bán']
    const rows = filteredCustomers.map((item) => [
      item.id,
      item.name,
      item.phone,
      formatMoney(item.totalSpent),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => csvSafe(cell)).join(','))
      .join('\n')

    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`
    const fileName = `danh-sach-khach-hang-${stamp}.csv`

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

  return (
    <div className="w-full space-y-4 pt-0 animate-in fade-in duration-300">
      {loading ? (
        <div className="rounded-[28px] bg-white p-8 text-center text-sm text-slate-500 shadow-lg ring-1 ring-slate-100">
          Đang tải dữ liệu khách hàng từ database...
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

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-100">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-slate-400 md:max-w-md">
              <FaSearch />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã KH, tên, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportCustomers}
                className="flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                disabled={filteredCustomers.length === 0}
              >
                <FaFileExport />
                Xuất danh sách
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-sky-50 text-left text-slate-500">
                <tr>
                  <th className="whitespace-nowrap p-4">Mã KH</th>
                  <th className="whitespace-nowrap p-4">Tên khách hàng</th>
                  <th className="whitespace-nowrap p-4">Số điện thoại</th>
                  <th className="whitespace-nowrap p-4 text-right">Tổng bán</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-800">{item.id}</td>
                      <td className="p-4 font-medium text-blue-600">{item.name}</td>
                      <td className="p-4 text-slate-600">{item.phone}</td>
                      <td className="p-4 text-right font-semibold text-slate-800">
                        {formatMoney(item.totalSpent)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400">
                      Không tìm thấy dữ liệu khách hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Hiển thị <span className="font-semibold">{filteredCustomers.length}</span> /{' '}
            <span className="font-semibold">{customersFromOrders.length}</span> khách hàng (từ database)
          </div>
        </div>
      </div>

    </div>
  )
}