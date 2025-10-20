"use client"

import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Clock, Check, X, Plus, Trash2, Save } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { http } from "@/libs/http"

type PatientInfo = {
  patient_id: string
  first_name: string
  last_name: string
  gender: string
  phone_number: string
}

type OrderItemResponse = {
  medicine_id: string
  medicine_name: string
  quantity: number
}

type OrderResponse = {
  order_id: string
  patient_id: string
  patient_info?: PatientInfo | null
  doctor_id?: string | null
  total_amount: number
  note?: string | null
  submitted_at?: string | null
  reviewed_at?: string | null
  status: string
  delivery_status?: string | null
  delivery_at?: string | null
  created_at: string
  updated_at: string
  order_items: OrderItemResponse[]
}

type OrdersResponse = {
  orders: OrderResponse[]
  total: number
}

type MedicineResponse = {
  id: string
  name: string
  price: number
  stock: number
  unit: string
  created_at: string
  updated_at: string
}

type MedicinesResponse = {
  medicines: MedicineResponse[]
  total: number
}

type OrderStatusMessage = {
  type: "success" | "error"
  message: string
}

type UpdateOrderPayload = {
  order_id: string
  order_items: Array<{
    medicine_id: string
    quantity: number
  }>
}

type EditableOrderItem = {
  clientId: string
  medicine_id: string
  medicine_name: string
  quantity: string
}

type EditableOrder = Omit<OrderResponse, "order_items" | "patient_info" | "submitted_at"> & {
  note: string | null
  patient_info: PatientInfo | null
  submitted_at: string | null
  order_items: EditableOrderItem[]
}

const parseDate = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const normalised = value.replace(" ", "T")
  const parsed = parseISO(normalised)
  return isValid(parsed) ? parsed : null
}

const formatSubmittedDate = (value: string | null | undefined) => {
  const parsed = parseDate(value)

  if (!parsed) {
    return "Submitted at: -"
  }

  const datePart = format(parsed, "MMM d, yyyy")
  const timePart = format(parsed, "HH:mm")

  return `Submitted at: ${datePart} at ${timePart}`
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value)

const createClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`

const toEditableOrder = (order: OrderResponse): EditableOrder => ({
  ...order,
  note: order.note ?? null,
  patient_info: order.patient_info ?? null,
  submitted_at: order.submitted_at ?? null,
  order_items: (order.order_items ?? []).map((item) => ({
    clientId: `${order.order_id}-${item.medicine_id}-${Math.random()}`,
    medicine_id: item.medicine_id ?? "",
    medicine_name: item.medicine_name ?? "",
    quantity: Number.isFinite(item.quantity) ? String(item.quantity) : "",
  })),
})

const getPatientName = (order: EditableOrder) => {
  const first = order.patient_info?.first_name?.trim() ?? ""
  const last = order.patient_info?.last_name?.trim() ?? ""
  const full = `${first} ${last}`.trim()
  return full || "Patient name unavailable"
}

const getPatientInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PT"
const getPatientGenderLabel = (gender?: string | null) => {
  if (!gender) {
    return "Not specified"
  }

  const normalised = gender.toLowerCase()

  if (normalised === "male") {
    return "Male"
  }

  if (normalised === "female") {
    return "Female"
  }

  return gender
}

export function PrescriptionRequests() {
  const [searchTerm, setSearchTerm] = useState("")
  const [orders, setOrders] = useState<EditableOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medicines, setMedicines] = useState<MedicineResponse[]>([])
  const [medicinesLoading, setMedicinesLoading] = useState(false)
  const [medicinesError, setMedicinesError] = useState<string | null>(null)
  const [dirtyOrders, setDirtyOrders] = useState<Record<string, boolean>>({})
  const [savingOrders, setSavingOrders] = useState<Record<string, boolean>>({})
  const [confirmingOrders, setConfirmingOrders] = useState<Record<string, boolean>>({})
  const [cancellingOrders, setCancellingOrders] = useState<Record<string, boolean>>({})
  const [saveStatus, setSaveStatus] = useState<Record<string, OrderStatusMessage | null>>({})

  const setOrderStatus = (orderId: string, status: OrderStatusMessage | null) => {
    setSaveStatus((prev) => ({ ...prev, [orderId]: status }))
  }

  const fetchOrders = async (setLoadingState = true) => {
    if (setLoadingState) {
      setLoading(true)
      setError(null)
    }

    try {
      const { data } = await http.get<OrdersResponse>("/order/v1/orders/doctor")

      const incoming = Array.isArray(data?.orders) ? data.orders : []
      setOrders(incoming.map(toEditableOrder))
    } catch (err) {
      if (axios.isCancel(err)) {
        return
      }

      if (setLoadingState) {
        setError("We could not load prescription requests. Please try again.")
      }
    } finally {
      if (setLoadingState) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const fetchOrdersWithSignal = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data } = await http.get<OrdersResponse>("/order/v1/orders/doctor", {
          signal: controller.signal,
        })

        const incoming = Array.isArray(data?.orders) ? data.orders : []
        setOrders(incoming.map(toEditableOrder))
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }

        setError("We could not load prescription requests. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrdersWithSignal()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const fetchMedicines = async () => {
      setMedicinesLoading(true)
      setMedicinesError(null)

      try {
        const { data } = await http.get<MedicinesResponse>("/medicine/v1/medicines", {
          signal: controller.signal,
        })

        const incoming = Array.isArray(data?.medicines) ? data.medicines : []
        setMedicines(incoming)
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }

        setMedicinesError("We could not load medicines. Please try again.")
      } finally {
        setMedicinesLoading(false)
      }
    }

    fetchMedicines()

    return () => controller.abort()
  }, [])

  const markOrderDirty = (orderId: string) => {
    setDirtyOrders((prev) => ({ ...prev, [orderId]: true }))
    setOrderStatus(orderId, null)
  }

  const clearOrderDirty = (orderId: string) => {
    setDirtyOrders((prev) => ({ ...prev, [orderId]: false }))
  }

  const setSavingState = (orderId: string, value: boolean) => {
    setSavingOrders((prev) => ({ ...prev, [orderId]: value }))
  }

  const setConfirmingState = (orderId: string, value: boolean) => {
    setConfirmingOrders((prev) => ({ ...prev, [orderId]: value }))
  }

  const setCancellingState = (orderId: string, value: boolean) => {
    setCancellingOrders((prev) => ({ ...prev, [orderId]: value }))
  }

  const updateOrderItems = (
    orderId: string,
    updater: (items: EditableOrderItem[]) => EditableOrderItem[]
  ) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.order_id === orderId ? { ...order, order_items: updater(order.order_items) } : order
      )
    )
    markOrderDirty(orderId)
  }

  const handleQuantityChange = (orderId: string, clientId: string, value: string) => {
    if (!/^\d*(\.\d*)?$/.test(value)) {
      return
    }

    updateOrderItems(orderId, (items) =>
      items.map((item) => (item.clientId === clientId ? { ...item, quantity: value } : item))
    )
  }

  const handleRemoveItem = (orderId: string, clientId: string) => {
    updateOrderItems(orderId, (items) => items.filter((item) => item.clientId !== clientId))
  }

  const handleAddItem = (orderId: string) => {
    updateOrderItems(orderId, (items) => [
      ...items,
      {
        clientId: createClientId(),
        medicine_id: "",
        medicine_name: "",
        quantity: "",
      },
    ])
  }

  const handleSelectMedicine = (orderId: string, clientId: string, medicineId: string) => {
    if (medicineId) {
      const currentOrder = orders.find((order) => order.order_id === orderId)
      const isDuplicate = currentOrder?.order_items.some(
        (item) => item.clientId !== clientId && item.medicine_id === medicineId
      )

      if (isDuplicate) {
        setOrderStatus(orderId, {
          type: "error",
          message: "This medicine has already been added to the order."
        })
        return
      }
    }

    const medicine = medicineId ? medicineMap.get(medicineId) ?? null : null

    updateOrderItems(orderId, (items) =>
      items.map((item) => {
        if (item.clientId !== clientId) {
          return item
        }

        const nextQuantity = item.quantity || (medicine ? "1" : "")

        return {
          ...item,
          medicine_id: medicineId,
          medicine_name: medicine?.name ?? "",
          quantity: medicineId ? nextQuantity : item.quantity,
        }
      })
    )
  }

  const handleSaveOrder = async (orderId: string) => {
    const targetOrder = orders.find((order) => order.order_id === orderId)

    if (!targetOrder) {
      return
    }

    const validItems: UpdateOrderPayload["order_items"] = []
    const quantitiesForState: Array<{ clientId: string; quantity: number }> = []

    targetOrder.order_items.forEach((item) => {
      const quantityValue = parseFloat(item.quantity)

      if (!item.medicine_id || !Number.isFinite(quantityValue) || quantityValue <= 0) {
        return
      }

      const numericQuantity = Number(quantityValue)

      validItems.push({
        medicine_id: item.medicine_id,
        quantity: numericQuantity,
      })

      quantitiesForState.push({
        clientId: item.clientId,
        quantity: numericQuantity,
      })
    })

    if (validItems.length === 0) {
      setOrderStatus(orderId, {
        type: "error",
        message: "Add at least one medicine with a quantity greater than zero before saving."
      })
      return
    }

    const payload: UpdateOrderPayload = {
      order_id: orderId,
      order_items: validItems,
    }

    setSavingState(orderId, true)
    setOrderStatus(orderId, null)

    try {
      await http.put("/order/v1/orders", payload)

      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId
            ? {
                ...order,
                order_items: order.order_items.map((item) => {
                  const matched = quantitiesForState.find(
                    (entry) => entry.clientId === item.clientId
                  )
                  return matched ? { ...item, quantity: String(matched.quantity) } : item
                }),
              }
            : order
        )
      )

      clearOrderDirty(orderId)
      setOrderStatus(orderId, { type: "success", message: "Prescription updated successfully." })
    } catch (err) {
      let message = "We could not save the prescription. Please try again."

      if (axios.isAxiosError(err)) {
        const apiMessage =
          typeof err.response?.data === "string"
            ? err.response?.data
            : err.response?.data?.message

        if (apiMessage) {
          message = apiMessage
        }
      }

      setOrderStatus(orderId, { type: "error", message })
    } finally {
      setSavingState(orderId, false)
    }
  }

  const handleConfirmOrder = async (orderId: string) => {
    setConfirmingState(orderId, true)
    setOrderStatus(orderId, null)

    try {
      await http.post("/order/v1/orders/confirm", { order_id: orderId })

      clearOrderDirty(orderId)
      setOrderStatus(orderId, { type: "success", message: "Prescription approved successfully." })
      
      // Re-fetch orders after successful confirmation
      await fetchOrders(false)
    } catch (err) {
      let message = "We could not approve the prescription. Please try again."

      if (axios.isAxiosError(err)) {
        const apiMessage =
          typeof err.response?.data === "string"
            ? err.response?.data
            : err.response?.data?.message

        if (apiMessage) {
          message = apiMessage
        }
      }

      setOrderStatus(orderId, { type: "error", message })
    } finally {
      setConfirmingState(orderId, false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    setCancellingState(orderId, true)
    setOrderStatus(orderId, null)

    try {
      await http.post("/order/v1/orders/reject", { order_id: orderId })

      clearOrderDirty(orderId)
      setOrderStatus(orderId, { type: "success", message: "Prescription rejected successfully." })
      
      // Re-fetch orders after successful rejection
      await fetchOrders(false)
    } catch (err) {
      let message = "We could not reject the prescription. Please try again."

      if (axios.isAxiosError(err)) {
        const apiMessage =
          typeof err.response?.data === "string"
            ? err.response?.data
            : err.response?.data?.message

        if (apiMessage) {
          message = apiMessage
        }
      }

      setOrderStatus(orderId, { type: "error", message })
    } finally {
      setCancellingState(orderId, false)
    }
  }

  const medicineMap = useMemo(() => {
    const map = new Map<string, MedicineResponse>()
    medicines.forEach((medicine) => {
      if (medicine?.id) {
        map.set(medicine.id, medicine)
      }
    })
    return map
  }, [medicines])

  const medicineOptions = useMemo(
    () =>
      [...medicines].sort((a, b) =>
        a.name.localeCompare(b.name, "th", { sensitivity: "base" })
      ),
    [medicines]
  )

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) {
      return orders
    }

    return orders.filter((order) => {
      const patientName = getPatientName(order)
      const haystack = [
        order.order_id,
        order.patient_id,
        patientName,
        order.status,
        order.delivery_status ?? "",
        order.note ?? "",
      ]

      return haystack.some((value) => value.toLowerCase().includes(term))
    })
  }, [orders, searchTerm])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Prescription Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review medication orders submitted by your patients.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, order ID, or medicine..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center text-sm text-foreground/60">
          Showing {filteredOrders.length} request{filteredOrders.length === 1 ? "" : "s"}
        </div>
      </div>

      {medicinesError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {medicinesError}
        </div>
      )}

      {loading && (
        <Card className="border-emerald-200">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading prescription requests...
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <Card className="border-muted">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No prescription requests found.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const patientName = getPatientName(order)
          const initials = getPatientInitials(patientName)
          const submittedText = formatSubmittedDate(order.submitted_at)
          const isDirty = Boolean(dirtyOrders[order.order_id])
          const isSaving = Boolean(savingOrders[order.order_id])
          const isConfirming = Boolean(confirmingOrders[order.order_id])
          const isCancelling = Boolean(cancellingOrders[order.order_id])
          const status = saveStatus[order.order_id] ?? null
          const statusClass =
            status?.type === "success"
              ? "text-sm font-medium text-emerald-600"
              : status?.type === "error"
                ? "text-sm font-medium text-destructive"
                : ""
          const actionInProgress = isSaving || isConfirming || isCancelling
          const { totalQuantity, totalCost, missingPrice } = order.order_items.reduce(
            (acc, item) => {
              const quantity = parseFloat(item.quantity)

              if (Number.isFinite(quantity) && quantity > 0) {
                acc.totalQuantity += quantity

                if (item.medicine_id) {
                  const medicine = medicineMap.get(item.medicine_id)
                  if (medicine) {
                    acc.totalCost += quantity * medicine.price
                  } else {
                    acc.missingPrice = true
                  }
                } else {
                  acc.missingPrice = true
                }
              }

              return acc
            },
            { totalQuantity: 0, totalCost: 0, missingPrice: false }
          )

          return (
            <Card
              key={order.order_id}
              className="overflow-hidden border border-emerald-300 shadow-sm"
            >
              <div className="bg-emerald-500 p-4 text-emerald-50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patientName)}`}
                      />
                      <AvatarFallback className="bg-white/20 text-sm font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold leading-tight">{patientName}</p>
                      <p className="text-xs text-emerald-50/80">
                        Patient ID: {order.patient_id || "-"} | Gender: {getPatientGenderLabel(order.patient_info?.gender)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{submittedText}</span>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-5 rounded-b-[18px] border border-emerald-200 bg-white p-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    รายการยา หมายเลขคำสั่งซื้อ {order.order_id}
                  </p>
                  <div className="rounded-2xl border border-emerald-200">
                    {order.order_items.length === 0 && (
                      <div className="p-5 text-sm text-muted-foreground">
                        ยังไม่มีรายการยา กรุณาเพิ่มรายการใหม่
                      </div>
                    )}
                    {order.order_items.map((item) => {
                      const selectedMedicine = item.medicine_id
                        ? medicineMap.get(item.medicine_id)
                        : undefined
                      const includeFallbackOption = Boolean(
                        item.medicine_id && !selectedMedicine && item.medicine_name
                      )
                      const usedMedicineIds = new Set(
                        order.order_items
                          .filter((other) => other.clientId !== item.clientId && other.medicine_id)
                          .map((other) => other.medicine_id as string)
                      )

                      return (
                        <div
                          key={item.clientId}
                          className="flex flex-col gap-3 border-b border-emerald-100 p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 flex-shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 text-center text-xs font-semibold uppercase text-emerald-600">
                              <div className="flex h-full flex-col items-center justify-center leading-tight">
                                <span>ยา</span>
                                <span>RX</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <select
                                value={item.medicine_id}
                                onChange={(event) =>
                                  handleSelectMedicine(
                                    order.order_id,
                                    item.clientId,
                                    event.target.value
                                  )
                                }
                                disabled={medicinesLoading && medicines.length === 0}
                                className="h-10 min-w-[240px] rounded-lg border border-emerald-200 bg-white px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed"
                              >
                                <option value="">เลือกยา</option>
                                {includeFallbackOption && (
                                  <option value={item.medicine_id}>
                                    {item.medicine_name} (ไม่พบในระบบ)
                                  </option>
                                )}
                                {medicineOptions.map((medicine) => {
                                  const disabled = usedMedicineIds.has(medicine.id)
                                  return (
                                    <option
                                      key={medicine.id}
                                      value={medicine.id}
                                      disabled={disabled}
                                    >
                                      {medicine.name}
                                      {disabled ? " (ถูกเลือกแล้ว)" : ""} · {formatCurrency(medicine.price)} /{" "}
                                      {medicine.unit}
                                    </option>
                                  )
                                })}
                              </select>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {selectedMedicine ? (
                                  <>
                                    <p>
                                      ราคา {formatCurrency(selectedMedicine.price)} ต่อ{" "}
                                      {selectedMedicine.unit}
                                    </p>
                                    <p>
                                      คงเหลือในสต็อก{" "}
                                      {selectedMedicine.stock.toLocaleString("th-TH")}{" "}
                                      {selectedMedicine.unit}
                                    </p>
                                  </>
                                ) : (
                                  <p>เลือกยาเพื่อดึงรายละเอียด</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">จำนวน</span>
                              <Input
                                inputMode="decimal"
                                value={item.quantity}
                                placeholder="0"
                                onChange={(event) =>
                                  handleQuantityChange(
                                    order.order_id,
                                    item.clientId,
                                    event.target.value
                                  )
                                }
                                className="h-9 w-24 text-right"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveItem(order.order_id, item.clientId)}
                              aria-label="ลบรายการยา"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    <div className="border-t border-emerald-100 p-4">
                      <Button
                        variant="outline"
                        className="w-full border-dashed border-emerald-400 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handleAddItem(order.order_id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        เพิ่มรายการยา
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    หมายเหตุ
                  </label>
                  <Textarea
                    value={order.note ?? ""}
                    readOnly
                    placeholder="ไม่มีหมายเหตุ"
                    className="min-h-[6rem] rounded-xl border border-emerald-200 bg-emerald-50/60 text-sm text-muted-foreground"
                  />
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-sm text-foreground">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-emerald-700">สรุปราคาทั้งหมด</span>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>ยอดรวมคำสั่งยา</span>
                      <span className="font-semibold">
                        {formatCurrency(totalCost)}
                        {missingPrice ? " (ข้อมูลราคาบางรายการไม่ครบ)" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>จำนวนยาที่สั่งทั้งหมด</span>
                      <span className="font-semibold">
                        {totalQuantity.toLocaleString("th-TH")} หน่วย
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {isDirty && (
                      <Button
                        variant="outline"
                        className="rounded-full border-emerald-500 text-emerald-600 hover:bg-emerald-50 sm:px-6"
                        onClick={() => handleSaveOrder(order.order_id)}
                        disabled={actionInProgress}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                      </Button>
                    )}
                    {status && (
                      <span
                        className={
                          statusClass || "text-sm font-medium text-muted-foreground"
                        }
                      >
                        {status.message}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 gap-3 sm:flex-none">
                    <Button
                      className="flex-1 rounded-full bg-emerald-500 text-lg font-semibold text-white hover:bg-emerald-600 sm:flex-none sm:px-8"
                      onClick={() => handleConfirmOrder(order.order_id)}
                      disabled={actionInProgress}
                    >
                      <Check className="mr-2 h-5 w-5" />
                      {isConfirming ? "กำลังยืนยัน..." : "อนุมัติ"}
                    </Button>
                    <Button
                      className="flex-1 rounded-full bg-red-500 text-lg font-semibold text-white hover:bg-red-600 sm:flex-none sm:px-8"
                      onClick={() => handleCancelOrder(order.order_id)}
                      disabled={actionInProgress}
                    >
                      <X className="mr-2 h-5 w-5" />
                      {isCancelling ? "กำลังยกเลิก..." : "ไม่อนุมัติ"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}




