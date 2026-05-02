import { useMemo } from 'react'
import {
  FaArrowUp,
  FaArrowDown,
  FaCapsules,
  FaUserFriends,
  FaFileInvoiceDollar,
  FaWarehouse,
  FaArrowRight,
} from 'react-icons/fa'
import { useInventoryAlerts } from '../../context/InventoryAlertContext'
import { useSetPageHeader } from '../../context/PageHeaderContext'
import AdminRevenueReport from './AdminRevenueReport'

export default function AdminHome() {
  useSetPageHeader(
    'Tổng quan',
    'Theo dõi doanh thu, tồn kho, đơn hàng và hiệu suất hoạt động',
  )
  const {
    orders,
    lowStockAlerts,
    pendingAlerts,
    customersFromOrders,
    orderStatusSummary,
  } = useInventoryAlerts()
  const closedOrdersCount = orderStatusSummary.completed + orderStatusSummary.cancelled
  const today = new Date().toLocaleDateString('vi-VN')
  const todayOrders = orders.filter(
    (item) =>
      item.status === 'Hoàn thành' &&
      new Date(item.createdAt || item.date).toLocaleDateString('vi-VN') === today,
  )
  const todayRevenue = todayOrders.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const monthRevenue = orders
    .filter((item) => item.status === 'Hoàn thành')
    .reduce((sum, item) => sum + Number(item.total || 0), 0)

  const stats = useMemo(
    () => [
      {
        title: 'Doanh thu tháng',
        value: `${monthRevenue.toLocaleString('vi-VN')}đ`,
        change: `${todayOrders.length} đơn hôm nay`,
        up: true,
        icon: <FaFileInvoiceDollar size={20} />,
      },
      {
        title: 'Đơn hàng',
        value: closedOrdersCount.toLocaleString('vi-VN'),
        change: `${orderStatusSummary.cancelled} đã hủy`,
        up: orderStatusSummary.cancelled === 0,
        icon: <FaCapsules size={20} />,
      },
      {
        title: 'Khách hàng',
        value: customersFromOrders.length.toLocaleString('vi-VN'),
        change: `${orderStatusSummary.completed} hoàn thành`,
        up: true,
        icon: <FaUserFriends size={20} />,
      },
      {
        title: 'Tồn kho cảnh báo',
        value: String(lowStockAlerts.length),
        change:
          pendingAlerts.length > 0
            ? `${pendingAlerts.length} đang xử lý`
            : orderStatusSummary.cancelled > 0
            ? `${orderStatusSummary.cancelled} đơn đã hủy`
            : 'Ổn định',
        up: pendingAlerts.length === 0,
        icon: <FaWarehouse size={20} />,
      },
    ],
    [
      closedOrdersCount,
      customersFromOrders.length,
      lowStockAlerts.length,
      monthRevenue,
      orderStatusSummary.cancelled,
      orderStatusSummary.completed,
      pendingAlerts.length,
      todayOrders.length,
    ],
  )

  return (
    <div className="w-full space-y-6 pt-0 animate-in fade-in duration-300">
      {/* SECTION 1: HERO BANNER */}
      <section>
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white shadow-xl shadow-emerald-600/20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-100">
                Hệ thống quản lý nhà thuốc
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight">
                Xin chào, Quản trị viên
              </h1>
              <p className="mt-4 max-w-xl text-emerald-50 leading-relaxed">
                Theo dõi doanh thu, tồn kho, đơn hàng và hiệu suất hoạt động trong
                một giao diện tập trung và trực quan.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#bao-cao-doanh-thu"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Xem báo cáo <FaArrowRight size={12} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
                <p className="text-sm font-medium text-emerald-100">Doanh thu hôm nay</p>
                <h3 className="mt-2 text-2xl font-bold">{todayRevenue.toLocaleString('vi-VN')}đ</h3>
              </div>

              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
                <p className="text-sm font-medium text-emerald-100">Đơn hôm nay</p>
                <h3 className="mt-2 text-2xl font-bold">{todayOrders.length}</h3>
              </div>

              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
                <p className="text-sm font-medium text-emerald-100">Khách hàng</p>
                <h3 className="mt-2 text-2xl font-bold">{customersFromOrders.length}</h3>
              </div>

              <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
                <p className="text-sm font-medium text-emerald-100">Cảnh báo kho</p>
                <h3 className="mt-2 text-2xl font-bold">{lowStockAlerts.length}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: STATS CARDS */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.title}
            className="group rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition group-hover:scale-110">
                {item.icon}
              </div>

              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                  item.up
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {item.up ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                {item.change}
              </div>
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">{item.title}</p>
            <h3 className="mt-1 text-3xl font-bold text-slate-900">{item.value}</h3>
          </div>
        ))}
      </section>

      {/* SECTION 3: Báo cáo doanh thu */}
      <AdminRevenueReport />

    </div>
  )
}