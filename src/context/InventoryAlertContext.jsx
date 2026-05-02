import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const InventoryAlertContext = createContext(null)

function normalizeMedicine(item) {
  return {
    ...item,
    price: Number(item.salePrice || item.price || 0),
    salePrice: Number(item.salePrice || item.price || 0),
    costPrice: Number(item.costPrice || 0),
    stock: Number(item.stock || 0),
    minStock: Number(item.minStock || 10),
    medicineStatus: item.medicineStatus || 'Đang kinh doanh',
    alertStatus: item.alertStatus || 'NONE',
    avgSold7d: Number(item.avgSold7d || 0),
    avgSold30d: Number(item.avgSold30d || 0),
    supplierName: item.supplierName || 'Chưa cập nhật',
    lastImportPrice: Number(item.lastImportPrice || item.costPrice || 0),
  }
}

function normalizeInvoiceOrderStatus(status) {
  return status === 'Đã hủy' ? 'Đã hủy' : 'Hoàn thành'
}

function normalizeOrder(item) {
  return {
    ...item,
    status: normalizeInvoiceOrderStatus(item.status),
    total: Number(item.total || 0),
    items: Array.isArray(item.items) ? item.items : [],
  }
}

function formatDateTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('vi-VN')
}

export function getDisplayStatus(item) {
  if (item.medicineStatus === 'Ngừng kinh doanh') {
    return { label: 'Ngừng kinh doanh', tone: 'disabled' }
  }
  if (Number(item.stock || 0) > Number(item.minStock || 10)) {
    return { label: 'Bình thường', tone: 'safe' }
  }
  if (item.alertStatus === 'PENDING') {
    return { label: 'Đang xử lý', tone: 'pending' }
  }
  if (Number(item.stock || 0) === 0) {
    return { label: 'Hết hàng', tone: 'danger' }
  }
  return { label: 'Sắp hết', tone: 'danger' }
}

export function InventoryAlertProvider({ children }) {
  const [medicines, setMedicines] = useState([])
  const [orders, setOrders] = useState([])
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [categories, setCategories] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [updatedAt, setUpdatedAt] = useState(new Date().toISOString())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [medicineRes, orderRes, employeeRes, customerRes, categoryRes, alertRes] = await Promise.all([
        api.get('/medicines'),
        api.get('/invoices'),
        api.get('/employees'),
        api.get('/customers'),
        api.get('/medicines/categories'),
        api.get('/alerts'),
      ])

      setMedicines(medicineRes.data.map(normalizeMedicine))
      setOrders(orderRes.data.map(normalizeOrder))
      setEmployees(
        employeeRes.data.map((item) => ({
          ...item,
          isActive: Boolean(item.isActive),
        })),
      )
      setCustomers(customerRes.data)
      setCategories(categoryRes.data)
      setAlerts(alertRes.data)
      setUpdatedAt(new Date().toISOString())
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không tải được dữ liệu từ database')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const pendingAlerts = useMemo(
    () => alerts.filter((item) => item.status === 'PENDING'),
    [alerts],
  )

  const lowStockAlerts = useMemo(
    () =>
      medicines.filter(
        (item) => item.medicineStatus !== 'Ngừng kinh doanh' && item.stock <= item.minStock,
      ),
    [medicines],
  )

  const orderStatusSummary = useMemo(
    () => ({
      completed: orders.filter((item) => item.status === 'Hoàn thành').length,
      cancelled: orders.filter((item) => item.status === 'Đã hủy').length,
    }),
    [orders],
  )

  const sendAlert = useCallback(async (medicineId, note, userName) => {
    const medicine = medicines.find((item) => item.id === medicineId)
    if (
      !medicine ||
      medicine.medicineStatus === 'Ngừng kinh doanh' ||
      medicine.stock > medicine.minStock ||
      medicine.alertStatus === 'PENDING'
    ) {
      return false
    }

    const response = await api.post('/alerts', {
      medicineId: medicine.id,
      note: note.trim(),
      createdBy: userName || 'Nhân viên',
    })
    const alert = response.data

    setAlerts((prev) => [alert, ...prev])
    setMedicines((prev) =>
      prev.map((item) =>
        item.id === medicineId
          ? {
              ...item,
              alertStatus: 'PENDING',
            }
          : item,
      ),
    )
    setNotifications((prev) => [
      {
        id: `NTF-${Date.now()}-admin`,
        targetRole: 'admin',
        message: `Cảnh báo mới: ${medicine.name} đang dưới ngưỡng tồn kho.`,
        createdAt: alert.createdAt || new Date().toISOString(),
      },
      ...prev,
    ])
    setUpdatedAt(new Date().toISOString())
    return true
  }, [medicines])

  const resolveAlert = useCallback(
    async (alertId, resolution) => {
      const alert = alerts.find((item) => item.id === alertId)
      if (!alert || alert.status !== 'PENDING') return false

      const response = await api.patch(`/alerts/${alertId}/resolve`, resolution)
      const resolvedAlert = response.data
      await refreshData()

      const now = new Date().toISOString()
      setAlerts((prev) =>
        prev.map((item) =>
          item.id === alertId
            ? resolvedAlert
            : item,
        ),
      )
      setUpdatedAt(now)
      return true
    },
    [alerts, refreshData],
  )

  const processAlert = useCallback(
    (medicineId, addQty) => {
      const alert = pendingAlerts.find((item) => item.medicineId === medicineId)
      if (!alert) return false
      return resolveAlert(alert.id, { type: 'RECEIPT', quantity: addQty })
    },
    [pendingAlerts, resolveAlert],
  )

  const addOrder = useCallback(async (payload) => {
    const response = await api.post('/invoices', payload)
    await refreshData()
    return response.data
  }, [refreshData])

  const consumeStock = useCallback(
    (items) => {
      const shortages = []
      items.forEach((line) => {
        const medicine = medicines.find((item) => item.id === line.id)
        const qty = Number(line.qty || 0)
        if (medicine && qty > medicine.stock) {
          shortages.push({
            id: line.id,
            name: line.name || medicine.name,
            requested: qty,
            available: medicine.stock,
          })
        }
      })
      return { ok: shortages.length === 0, shortages }
    },
    [medicines],
  )

  const updateOrderStatus = useCallback(
    async (orderId, nextStatus) => {
      await api.patch(`/invoices/${orderId}/status`, { status: nextStatus })
      await refreshData()
    },
    [refreshData],
  )

  const addMedicine = useCallback(
    async (payload) => {
      const response = await api.post('/medicines', payload)
      await refreshData()
      return response.data
    },
    [refreshData],
  )

  const updateEmployeeRole = useCallback(
    async (employeeId, nextRole) => {
      await api.patch(`/employees/${employeeId}/role`, { role: nextRole })
      await refreshData()
    },
    [refreshData],
  )

  const toggleEmployeeStatus = useCallback(
    async (employeeId, isActive) => {
      await api.patch(`/employees/${employeeId}/status`, { isActive })
      await refreshData()
    },
    [refreshData],
  )

  const staffNotifications = useMemo(
    () => notifications.filter((item) => item.targetRole === 'staff').slice(0, 10),
    [notifications],
  )

  const adminNotifications = useMemo(
    () => notifications.filter((item) => item.targetRole === 'admin').slice(0, 10),
    [notifications],
  )

  const deleteMedicine = useCallback(async (medicineId) => {
    await api.post(`/medicines/${encodeURIComponent(medicineId)}/delete`)
    await refreshData()
  }, [refreshData])

  const value = useMemo(
    () => ({
      medicines,
      orders,
      employees,
      categories,
      alerts,
      pendingAlerts,
      lowStockAlerts,
      customersFromOrders: customers,
      medicineCategories: categories,
      orderStatusSummary,
      staffNotifications,
      adminNotifications,
      updatedAt,
      loading,
      error,
      refreshData,
      sendAlert,
      resolveAlert,
      processAlert,
      addOrder,
      consumeStock,
      updateOrderStatus,
      addMedicine,
      updateEmployeeRole,
      toggleEmployeeStatus,
      formatDateTime,
      deleteMedicine,
    }),
    [
      adminNotifications,
      alerts,
      customers,
      categories,
      employees,
      error,
      loading,
      lowStockAlerts,
      medicines,
      orderStatusSummary,
      orders,
      pendingAlerts,
      processAlert,
      refreshData,
      resolveAlert,
      sendAlert,
      staffNotifications,
      updatedAt,
      addOrder,
      consumeStock,
      updateOrderStatus,
      addMedicine,
      updateEmployeeRole,
      toggleEmployeeStatus,
      deleteMedicine,
    ],
  )

  return (
    <InventoryAlertContext.Provider value={value}>
      {children}
    </InventoryAlertContext.Provider>
  )
}

export function useInventoryAlerts() {
  const ctx = useContext(InventoryAlertContext)
  if (!ctx) {
    throw new Error('useInventoryAlerts must be used within InventoryAlertProvider')
  }
  return ctx
}
