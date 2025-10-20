"use client"

import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Search, ChevronDown } from "lucide-react"
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

type PatientProfile = {
  id: string
  first_name: string
  last_name: string
  gender: string
  phone_number: string
  hospital_id: string
  birth_date: string | null
  id_card_number: string | null
  address: string | null
  allergies: string | null
  emergency_contact: string | null
  blood_type: string | null
}

type GroupedAppointments = Array<{
  dateKey: string
  date: Date
  displayDate: string
  slots: Array<{
    appointment: Appointment
    start: Date | null
    end: Date | null
  }>
}>

const parseDate = (value: string) => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const withoutTimezone = trimmed.replace(/([+-]\d{2}:?\d{2}|Z)$/i, "")
  const localCandidate = withoutTimezone.replace(" ", "T")

  try {
    const localParsed = parseISO(localCandidate)
    if (isValid(localParsed)) {
      return localParsed
    }
  } catch {
    // ignore parse errors and retry with the raw value
  }

  try {
    const fallbackParsed = parseISO(trimmed.replace(" ", "T"))
    if (isValid(fallbackParsed)) {
      return fallbackParsed
    }
  } catch {
    // ignore parse errors
  }

  return null
}

const getDateKey = (value: string, fallback: Date | null) => {
  if (value) {
    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) {
      return match[1]
    }
  }

  return fallback ? format(fallback, "yyyy-MM-dd") : ""
}

const getPatientName = (appointment: Appointment) =>
  `${appointment.patient_first_name} ${appointment.patient_last_name}`.trim()

const formatBirthDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not available"
  }

  const parsed = parseDate(value)
  return parsed ? format(parsed, "MMMM d, yyyy") : "Not available"
}

export function AppointmentRequests() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"latest" | "earliest">("latest")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientProfile | null>>({})
  const [profileLoading, setProfileLoading] = useState<Record<string, boolean>>({})
  const [profileErrors, setProfileErrors] = useState<Record<string, string | null>>({})
  const [expandedProfiles, setExpandedProfiles] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const controller = new AbortController()

    const fetchAppointments = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data } = await http.get<Appointment[]>("/appointment/v1/doctor", {
          signal: controller.signal,
        })
        console.log("Fetched appointments:", data)
        setAppointments(Array.isArray(data) ? data : [])
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }

        setError("We could not load appointment requests. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()

    return () => controller.abort()
  }, [])

  const filteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) {
      return appointments
    }

    return appointments.filter((appointment) =>
      getPatientName(appointment).toLowerCase().includes(term)
    )
  }, [appointments, searchTerm])

  const groupedAppointments: GroupedAppointments = useMemo(() => {
    const groups = new Map<string, GroupedAppointments[number]>()

    filteredAppointments.forEach((appointment) => {
      const start = parseDate(appointment.start_time)
      const end = parseDate(appointment.end_time)

      const dateKey = getDateKey(appointment.start_time, start)

      if (!dateKey) {
        return
      }

      const groupDate =
        start ?? parseDate(`${dateKey} 00:00`) ?? parseDate(`${dateKey}T00:00`)

      if (!groupDate) {
        return
      }

      const displayDate = format(groupDate, "EEEE, MMM d, yyyy")
      const existingGroup = groups.get(dateKey)

      if (existingGroup) {
        existingGroup.slots.push({ appointment, start, end })
      } else {
        groups.set(dateKey, {
          dateKey,
          date: groupDate,
          displayDate,
          slots: [{ appointment, start, end }],
        })
      }
    })

    const organised = Array.from(groups.values()).map((group) => ({
      ...group,
      slots: group.slots.sort((a, b) => {
        if (!a.start || !b.start) {
          return 0
        }
        return a.start.getTime() - b.start.getTime()
      }),
    }))

    organised.sort((a, b) =>
      sortBy === "latest"
        ? b.date.getTime() - a.date.getTime()
        : a.date.getTime() - b.date.getTime()
    )

    return organised
  }, [filteredAppointments, sortBy])

  const handleViewDetails = async (appointment: Appointment) => {
    const patientId = appointment.patient_id
    const appointmentKey = appointment.appointment_id

    if (!patientId) {
      return
    }

    const nextExpanded = !expandedProfiles[appointmentKey]

    setExpandedProfiles((prev) => ({
      ...prev,
      [appointmentKey]: nextExpanded,
    }))

    if (!nextExpanded || patientProfiles[patientId] || profileLoading[patientId]) {
      return
    }

    setProfileLoading((prev) => ({ ...prev, [patientId]: true }))
    setProfileErrors((prev) => ({ ...prev, [patientId]: null }))

    try {
      const { data } = await http.post<PatientProfile[]>("/user/v1/patients", {
        patient_ids: [patientId],
      })

      const profile =
        Array.isArray(data) && data.length > 0
          ? data.find((item) => item.id === patientId) ?? data[0]
          : null

      setPatientProfiles((prev) => ({ ...prev, [patientId]: profile ?? null }))
    } catch (fetchError) {
      console.error("Failed to fetch patient details:", fetchError)
      setProfileErrors((prev) => ({
        ...prev,
        [patientId]: "We could not load patient details. Please try again.",
      }))
    } finally {
      setProfileLoading((prev) => ({ ...prev, [patientId]: false }))
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Appointment Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review and manage upcoming appointment requests grouped by day.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/60">Sort by</span>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            onClick={() => setSortBy((prev) => (prev === "latest" ? "earliest" : "latest"))}
          >
            {sortBy === "latest" ? "Latest first" : "Earliest first"}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="text-sm text-foreground/60">
        Requests found: {filteredAppointments.length}
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading appointment requests...
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="border-destructive/50">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && groupedAppointments.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No appointment requests match your filters.
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {groupedAppointments.map((group) => (
          <Card key={group.dateKey} className="border-0 overflow-hidden">
            <div className="bg-primary p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-foreground" />
              <div>
                <p className="text-sm font-semibold text-primary-foreground">{group.displayDate}</p>
                <p className="text-xs text-primary-foreground/70">
                  {group.slots.length} appointment{group.slots.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {group.slots.map(({ appointment, start, end }) => {
                  const timeRange =
                    start && end
                      ? `${format(start, "hh:mm a")} - ${format(end, "hh:mm a")}`
                      : start
                        ? format(start, "hh:mm a")
                        : "Time not available"

                  const patientName = getPatientName(appointment)
                  const initials = patientName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("") || "PT"

                  return (
                    <div
                      key={appointment.appointment_id}
                      className="rounded-lg border border-border bg-card/50 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patientName)}`}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-base font-semibold text-foreground">{patientName}</p>
                            <p className="text-xs text-muted-foreground">
                              Status: {appointment.status || "unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-right sm:text-left">
                          <span className="font-medium text-foreground">{timeRange}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(appointment)}
                          >
                            {expandedProfiles[appointment.appointment_id]
                              ? "Hide Details"
                              : "View Details"}
                          </Button>
                        </div>
                      </div>
                      {expandedProfiles[appointment.appointment_id] && (
                        <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 p-4 text-left">
                          {profileLoading[appointment.patient_id] && (
                            <p className="text-sm text-muted-foreground">
                              Loading patient details...
                            </p>
                          )}
                          {!profileLoading[appointment.patient_id] &&
                            profileErrors[appointment.patient_id] && (
                              <p className="text-sm text-destructive">
                                {profileErrors[appointment.patient_id]}
                              </p>
                            )}
                          {!profileLoading[appointment.patient_id] &&
                            !profileErrors[appointment.patient_id] && (
                              <>
                                {(() => {
                                  const profile =
                                    patientProfiles[appointment.patient_id] ?? null

                                  if (!profile) {
                                    return (
                                      <p className="text-sm text-muted-foreground">
                                        No additional patient information found.
                                      </p>
                                    )
                                  }

                                  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()

                                  return (
                                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          Full name
                                        </dt>
                                        <dd className="text-foreground">
                                          {fullName || "Not available"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          Gender
                                        </dt>
                                        <dd className="text-foreground">
                                          {profile.gender || "Not available"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          Phone number
                                        </dt>
                                        <dd className="text-foreground">
                                          {profile.phone_number || "Not available"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          Birth date
                                        </dt>
                                        <dd className="text-foreground">
                                          {formatBirthDate(profile.birth_date)}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          Blood type
                                        </dt>
                                        <dd className="text-foreground">
                                          {profile.blood_type || "Not available"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          Allergies
                                        </dt>
                                        <dd className="text-foreground">
                                          {profile.allergies || "Not available"}
                                        </dd>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <dt className="font-medium text-foreground/70">
                                          Address
                                        </dt>
                                        <dd className="text-foreground">
                                          {profile.address || "Not available"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          Emergency contact
                                        </dt>
                                        <dd className="text-foreground">
                                          {profile.emergency_contact || "Not available"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-medium text-foreground/70">
                                          ID card number
                                        </dt>
                                        <dd className="text-foreground">
                                          {profile.id_card_number || "Not available"}
                                        </dd>
                                      </div>
                                    </dl>
                                  )
                                })()}
                              </>
                            )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
