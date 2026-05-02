import StatCard from '../components/common/StatCard'
import { useInventoryAlerts } from '../context/InventoryAlertContext'

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

export default function Dashboard() {
  const { orders, lowStockAlerts, customersFromOrders } = useInventoryAlerts()
  const completedOrders = orders.filter((item) => item.status === 'Hoàn thành')
  const revenue = completedOrders.reduce((sum, item) => sum + Number(item.total || 0), 0)

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan nhà thuốc</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dữ liệu được lấy trực tiếp từ database qua backend API
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Doanh thu" value={formatMoney(revenue)} subtitle="Hóa đơn hoàn thành" />
        <StatCard title="Đơn hàng" value={orders.length} subtitle="Tổng hóa đơn trong database" />
        <StatCard title="Thuốc sắp hết" value={lowStockAlerts.length} subtitle="Theo tồn kho hiện tại" />
        <StatCard title="Khách hàng" value={customersFromOrders.length} subtitle="Từ bảng khách hàng" />
      </section>
    </div>
  )
}
