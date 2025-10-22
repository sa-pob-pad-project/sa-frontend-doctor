"use client"

import Link from "next/link"
import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Clock, Users, FileText, CheckCircle } from "lucide-react"
import { http } from "@/libs/http"

type Appointment = {
  appointment_id: string
  patient_id: string
  patient_first_name: string
  patient_last_name: string
  start_time: string
  end_time: string
  status: string
}

type PatientInfo = {
  patient_id: string
  first_name: string
  last_name: string
  gender: string
  phone_number: string
}

type OrderItem = {
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
  order_items: OrderItem[]
}

type OrdersResponse = {
  orders: OrderResponse[]
  total: number
}

type EnrichedAppointment = {
  appointment: Appointment
  start: Date | null
  end: Date | null
}

const parseDate = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    const normalised = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T")
    const parsed = parseISO(normalised)
    
    if (!isValid(parsed)) {
      return null
    }

    // ปรับ timezone offset (-7 ชั่วโมง)
    const timezoneOffset = -7 * 60 * 60 * 1000
    const adjustedDate = new Date(parsed.getTime() + timezoneOffset)
    
    return adjustedDate
  } catch {
    return null
  }
}

const getPatientName = (appointment: Appointment) =>
  `${appointment.patient_first_name} ${appointment.patient_last_name}`.trim() || "Unknown patient"

const getPatientInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PT"

const formatTimeRange = (start: Date | null, end: Date | null) => {
  if (!start && !end) {
    return "-"
  }

  const startLabel = start ? format(start, "HH:mm") : "?"
  if (!end) {
    return startLabel
  }

  return `${startLabel} - ${format(end, "HH:mm")}`
}

export function DoctorDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [historyOrders, setHistoryOrders] = useState<OrderResponse[]>([])

  useEffect(() => {
    const controller = new AbortController()

    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [appointmentsRes, ordersRes, historyRes] = await Promise.all([
          http.get<Appointment[]>("/appointment/v1/doctor", { signal: controller.signal }),
          http.get<OrdersResponse>("/order/v1/orders/doctor", { signal: controller.signal }),
          http.get<OrdersResponse>("/order/v1/orders/doctor/history", { signal: controller.signal }),
        ])

        setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [])
        setOrders(
          Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []
        )
        setHistoryOrders(
          Array.isArray(historyRes.data?.orders) ? historyRes.data.orders : []
        )
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }

        setError("We couldn't load your dashboard data. Please try again.")
        setAppointments([])
        setOrders([])
        setHistoryOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    return () => controller.abort()
  }, [])

  const upcomingAppointments: EnrichedAppointment[] = useMemo(() => {
    const now = new Date()

    return appointments
      .map((appointment) => {
        const start = parseDate(appointment.start_time)
        const end = parseDate(appointment.end_time)

        return { appointment, start, end }
      })
      .filter(({ start }) => start && start.getTime() >= now.getTime())
      .sort((a, b) => {
        if (!a.start || !b.start) {
          return 0
        }
        return a.start.getTime() - b.start.getTime()
      })
      .slice(0, 5)
  }, [appointments])

  const dashboardStats = useMemo(() => {
    const pendingOrders = orders.filter(
      (order) => (order.status ?? "").toLowerCase() === "pending"
    )
    const approvedOrders = historyOrders.filter(
      (order) => (order.status ?? "").toLowerCase() === "approved"
    )

    const patientIds = new Set<string>()
    appointments.forEach((appointment) => {
      if (appointment.patient_id) {
        patientIds.add(appointment.patient_id)
      }
    })
    orders.forEach((order) => {
      if (order.patient_id) {
        patientIds.add(order.patient_id)
      }
    })
    historyOrders.forEach((order) => {
      if (order.patient_id) {
        patientIds.add(order.patient_id)
      }
    })

    return [
      {
        label: "Upcoming appointments",
        value: upcomingAppointments.length,
        icon: Clock,
        color: "bg-sky-500",
      },
      {
        label: "Pending prescriptions",
        value: pendingOrders.length,
        icon: FileText,
        color: "bg-amber-500",
      },
      {
        label: "Approved prescriptions",
        value: approvedOrders.length,
        icon: CheckCircle,
        color: "bg-emerald-500",
      },
      {
        label: "Active patients",
        value: patientIds.size,
        icon: Users,
        color: "bg-indigo-500",
      },
    ]
  }, [appointments, orders, historyOrders, upcomingAppointments.length])

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your appointments and prescription activity at a glance.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-8 text-center text-sm text-muted-foreground">
          Loading dashboard data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="border border-border/60 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="mb-2 text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stat.value.toLocaleString()}
                        </p>
                      </div>
                      <div className={`${stat.color} rounded-lg p-3 text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Upcoming appointments</h2>
              <Button variant="outline" asChild>
                <Link href="/dashboard/appointments">View all appointments</Link>
              </Button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="rounded-lg border border-muted-foreground/40 p-8 text-center text-sm text-muted-foreground">
                No upcoming appointments found.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(({ appointment, start, end }) => {
                  const patientName = getPatientName(appointment)
                  const dateLabel = start ? format(start, "EEEE, MMM d, yyyy") : "Date not set"

                  return (
                    <Card
                      key={appointment.appointment_id}
                      className="border border-border/60 bg-card transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-1 items-center gap-4">
                            <div className="rounded-full bg-primary/10 p-2">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-muted-foreground">
                                {dateLabel} - {formatTimeRange(start, end)}
                              </p>
                              <div className="mt-2 flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                      appointment.patient_id || patientName
                                    )}&backgroundType=gradientLinear`}
                                    alt={patientName}
                                  />
                                  <AvatarFallback>
                                    {getPatientInitials(patientName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">
                                    {patientName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Status: {appointment.status || "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button asChild variant="default" className="sm:self-start">
                            <Link href={`/dashboard/appointments?highlight=${appointment.appointment_id}`}>
                              Review details
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
