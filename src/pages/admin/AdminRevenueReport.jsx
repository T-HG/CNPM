import { useMemo, useState } from 'react'
import { FaCalendarAlt, FaSearch } from 'react-icons/fa'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { useInventoryAlerts } from '../../context/InventoryAlertContext'

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function getWeekStart(date) {
  const start = startOfDay(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return start
}

function getDateRange(filter) {
  const now = new Date()
  const start = startOfDay(now)
  const end = new Date(start)

  if (filter === 'day') {
    end.setDate(start.getDate() + 1)
    return { start, end }
  }

  if (filter === 'week') {
    const weekStart = getWeekStart(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    return { start: weekStart, end: weekEnd }
  }

  if (filter === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { start: monthStart, end: monthEnd }
  }

  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
  return { start: yearStart, end: yearEnd }
}

function getChartBuckets(filter, rangeStart) {
  if (filter === 'day') {
    return Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour),
      name: `${hour}h`,
      revenue: 0,
      orders: new Set(),
    }))
  }

  if (filter === 'week') {
    return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((name, index) => ({
      key: String(index + 1),
      name,
      revenue: 0,
      orders: new Set(),
    }))
  }

  if (filter === 'month') {
    const daysInMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, index) => ({
      key: String(index + 1),
      name: String(index + 1),
      revenue: 0,
      orders: new Set(),
    }))
  }

  return Array.from({ length: 12 }, (_, index) => ({
    key: String(index),
    name: `T${index + 1}`,
    revenue: 0,
    orders: new Set(),
  }))
}

function getBucketKey(date, filter) {
  if (filter === 'day') return String(date.getHours())
  if (filter === 'week') return String(date.getDay() === 0 ? 7 : date.getDay())
  if (filter === 'month') return String(date.getDate())
  return String(date.getMonth())
}

export default function AdminRevenueReport() {
  const [dateFilter, setDateFilter] = useState('week')
  const [search, setSearch] = useState('')
  const { orders } = useInventoryAlerts()

  const reportLines = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const range = getDateRange(dateFilter)

    return orders.flatMap((order) => {
      if (order.status !== 'Hoàn thành') return []

      const date = new Date(order.createdAt || order.date)
      if (Number.isNaN(date.getTime()) || date < range.start || date >= range.end) return []

      return (order.items || [])
        .filter((line) => {
          if (!keyword) return true
          return String(line.name || '').toLowerCase().includes(keyword)
        })
        .map((line) => ({
          orderId: order.id,
          date,
          id: line.id || line.name,
          name: line.name || 'Không rõ tên thuốc',
          qty: Number(line.qty || 0),
          total: Number(line.total || Number(line.qty || 0) * Number(line.price || 0)),
        }))
    })
  }, [dateFilter, orders, search])

  const revenueData = useMemo(() => {
    const { start } = getDateRange(dateFilter)
    const buckets = getChartBuckets(dateFilter, start)
    const map = new Map(buckets.map((item) => [item.key, item]))

    reportLines.forEach((line) => {
      const key = getBucketKey(line.date, dateFilter)
      const current = map.get(key)
      if (!current) return
      current.revenue += line.total
      current.orders.add(line.orderId)
    })

    return buckets.map((item) => ({
      name: item.name,
      revenue: item.revenue,
      orders: item.orders.size,
    }))
  }, [dateFilter, reportLines])

  const topMedicines = useMemo(() => {
    const map = new Map()
    reportLines.forEach((line) => {
      const current = map.get(line.id) || {
        id: line.id,
        name: line.name,
        qty: 0,
        revenue: 0,
      }
      current.qty += line.qty
      current.revenue += line.total
      map.set(line.id, current)
    })
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [reportLines])

  const totalRevenue = reportLines.reduce((sum, item) => sum + item.total, 0)
  const totalOrders = new Set(reportLines.map((item) => item.orderId)).size

  return (
    <section id="bao-cao-doanh-thu" className="scroll-mt-6 space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Báo cáo doanh thu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Xem báo cáo doanh thu chi tiết toàn hệ thống
          </p>
        </div>
      </div>

      {/* CONTENT: BÁO CÁO DOANH THU */}
      <div className="space-y-6">
        {/* Bộ lọc */}
        <div className="flex flex-wrap items-center gap-4 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition"
            >
              <option value="day">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
          <div className="flex min-w-[250px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-400 transition focus-within:border-blue-400 focus-within:bg-white">
            <FaSearch />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên thuốc..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-[24px] bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg shadow-blue-500/20">
            <p className="text-blue-100 font-medium">Tổng doanh thu</p>
            <h3 className="mt-2 text-3xl font-bold">{formatMoney(totalRevenue)}</h3>
            <p className="mt-2 text-sm text-blue-200">Từ hóa đơn hoàn thành trong database</p>
          </div>
          <div className="rounded-[24px] bg-white p-6 shadow-lg ring-1 ring-slate-100 hover:shadow-xl transition">
            <p className="text-slate-500 font-medium">Tổng số đơn hàng</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-800">
              {totalOrders} <span className="text-lg font-normal text-slate-500">đơn</span>
            </h3>
            <p className="mt-2 text-sm font-medium text-emerald-500">Dữ liệu từ bảng hóa đơn</p>
          </div>
        </div>

        {/* Biểu đồ & Top Thuốc */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Biểu đồ cột */}
          <div className="rounded-[24px] bg-white p-6 shadow-lg ring-1 ring-slate-100">
            <h3 className="mb-6 font-bold text-slate-800">Doanh thu theo thời gian</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b' }}
                    width={80}
                    tickFormatter={(value) => value.toLocaleString('vi-VN')}
                  />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => formatMoney(value)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Thuốc */}
          <div className="rounded-[24px] bg-white p-6 shadow-lg ring-1 ring-slate-100">
            <h3 className="mb-4 font-bold text-slate-800">Top 5 thuốc bán chạy nhất</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="pb-3 font-medium">Tên thuốc</th>
                    <th className="pb-3 text-right font-medium">Đã bán</th>
                    <th className="pb-3 text-right font-medium">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topMedicines.map((item, index) => (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              index < 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium text-slate-700">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-slate-600">{item.qty}</td>
                      <td className="py-3 text-right font-medium text-slate-800">
                        {formatMoney(item.revenue)}
                      </td>
                    </tr>
                  ))}
                  {topMedicines.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-6 text-center text-slate-400">
                        Chưa có dữ liệu bán hàng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}