"use client"

import axios from "axios"
import { useCallback, useEffect, useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { doctorShiftService } from "@/services/shift-service"
import type { DoctorShift } from "@/services/dto/shift.dto"

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

const WEEKDAY_LABEL: Record<(typeof WEEKDAYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
}

type Weekday = (typeof WEEKDAYS)[number]

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hours = Math.floor(index / 4)
  const minutes = (index % 4) * 15
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
})

const getWeekdayPosition = (weekday: string): number => {
  const index = WEEKDAYS.indexOf(weekday as Weekday)
  return index === -1 ? WEEKDAYS.length : index
}

const toISOStringForWeekdayTime = (weekday: Weekday, time: string) => {
  const [hoursString, minutesString = "0"] = time.split(":")
  const hours = Number(hoursString)
  const minutes = Number(minutesString)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  const base = new Date()
  base.setHours(0, 0, 0, 0)

  const currentDayIndex = base.getDay() === 0 ? 6 : base.getDay() - 1
  const targetIndex = getWeekdayPosition(weekday)
  const dayOffset = (targetIndex - currentDayIndex + 7) % 7

  base.setDate(base.getDate() + dayOffset)
  base.setHours(hours, minutes, 0, 0)

  return base.toISOString()
}

const normaliseShiftDate = (value: string) => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const candidates = [trimmed]

  // Handle malformed format like "02:00Z00:00"
  if (trimmed.match(/^\d{2}:\d{2}Z\d{2}:\d{2}$/)) {
    const match = trimmed.match(/^(\d{2}):(\d{2})Z(\d{2}):(\d{2})$/)
    if (match) {
      const [, hours, minutes] = match
      candidates.push(`1970-01-01T${hours}:${minutes}:00Z`)
    }
  }

  if (!trimmed.includes("T") && /^\d{2}:\d{2}/.test(trimmed)) {
    candidates.push(`1970-01-01T${trimmed}`)
    candidates.push(`1970-01-01T${trimmed}:00`)
  }

  if (trimmed.includes("Z") && !trimmed.endsWith("Z")) {
    candidates.push(`${trimmed.split("Z")[0]}Z`)
  }

  for (const candidate of candidates) {
    try {
      const parsed = parseISO(candidate)
      if (isValid(parsed)) {
        return parsed
      }
    } catch {
      // Ignore parse errors
    }
  }

  return null
}

const formatShiftTime = (value: string | undefined) => {
  if (!value) {
    return ""
  }
  
  if (value.match(/^\d{2}:\d{2}Z\d{2}:\d{2}$/)) {
    const match = value.match(/^(\d{2}:\d{2})Z/)
    if (match) {
      return match[1]
    }
  }
  
  console.log("Unable to parse shift time:", value)
  const match = value.match(/^(\d{2}:\d{2})/)
  return match ? match[1] : value
}

interface FormState {
  weekday: Weekday
  startTime: string
  endTime: string
  durationMin: string
}

export function ShiftManager() {
  const [shifts, setShifts] = useState<DoctorShift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<FormState>({
    weekday: "mon",
    startTime: "",
    endTime: "",
    durationMin: "60",
  })

  const fetchShifts = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)

      try {
        const data = await doctorShiftService.getActiveShifts(signal)
        setShifts(data)
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }
        setError(
          err instanceof Error ? err.message : "Unable to load shifts right now."
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchShifts(controller.signal)
    return () => controller.abort()
  }, [fetchShifts])

  useEffect(() => {
    if (!successMessage) {
      return
    }

    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      const weekdayComparison =
        getWeekdayPosition(a.weekday) - getWeekdayPosition(b.weekday)
      if (weekdayComparison !== 0) {
        return weekdayComparison
      }
      return formatShiftTime(a.start_time).localeCompare(formatShiftTime(b.start_time))
    })
  }, [shifts])

  const availableWeekdays = useMemo(() => {
    const usedWeekdays = new Set(shifts.map((shift) => shift.weekday))
    return WEEKDAYS.filter((day) => !usedWeekdays.has(day))
  }, [shifts])

  // Update form weekday when available weekdays change
  useEffect(() => {
    if (availableWeekdays.length > 0 && !availableWeekdays.includes(formValues.weekday)) {
      setFormValues((prev) => ({
        ...prev,
        weekday: availableWeekdays[0],
      }))
    }
  }, [availableWeekdays])

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }))
    setFormError(null)
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    setFormError(null)
    setSuccessMessage(null)

    const { weekday, startTime, endTime, durationMin } = formValues

    if (!weekday || !startTime || !endTime || !durationMin) {
      setFormError("Please complete all fields before creating a shift.")
      return
    }

    const startIso = toISOStringForWeekdayTime(weekday, startTime)
    const endIso = toISOStringForWeekdayTime(weekday, endTime)
    const parsedDuration = Number(durationMin)

    if (!startIso || !endIso) {
      setFormError("Start and end time must be valid times.")
      return
    }

    if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      setFormError("Duration must be a positive number of minutes.")
      return
    }

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setFormError("End time must be later than start time.")
      return
    }

    setIsSubmitting(true)

    try {
      await doctorShiftService.createShift({
        weekday,
        start_time: startIso,
        end_time: endIso,
        duration_min: parsedDuration,
      })

      // Re-fetch shifts after creating a new one
      const updatedShifts = await doctorShiftService.getActiveShifts()
      setShifts(updatedShifts)
      
      setFormValues({
        weekday: availableWeekdays[0] || "mon",
        startTime: "",
        endTime: "",
        durationMin: durationMin,
      })
      setSuccessMessage("Shift created successfully.")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create shift.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (shiftId: string) => {
    setPendingDelete(shiftId)
    setSuccessMessage(null)
    setFormError(null)

    try {
      await doctorShiftService.deleteShift({ shift_id: shiftId })
      setShifts((previous) => previous.filter((shift) => shift.shift_id !== shiftId))
      setSuccessMessage("Shift removed.")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to delete shift.")
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shift manager</h1>
        <p className="text-muted-foreground">
          Create weekly shifts and remove outdated slots.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-border/60">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle>Create a shift</CardTitle>
          <CardDescription>
            Select the weekday and the hourly slot you would like to make available.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground/80" htmlFor="weekday">
                  Weekday
                </label>
                <select
                  id="weekday"
                  value={formValues.weekday}
                  onChange={(event) =>
                    handleInputChange("weekday", event.target.value as Weekday)
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {availableWeekdays.map((day) => (
                    <option key={day} value={day}>
                      {WEEKDAY_LABEL[day]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground/80" htmlFor="start-time">
                  Start time (24h)
                </label>
                <select
                  id="start-time"
                  value={formValues.startTime}
                  onChange={(event) => handleInputChange("startTime", event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  required
                >
                  <option value="" disabled>
                    Select start time
                  </option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground/80" htmlFor="end-time">
                  End time (24h)
                </label>
                <select
                  id="end-time"
                  value={formValues.endTime}
                  onChange={(event) => handleInputChange("endTime", event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  required
                >
                  <option value="" disabled>
                    Select end time
                  </option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground/80" htmlFor="duration">
                  Duration (minutes)
                </label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  step={5}
                  value={formValues.durationMin}
                  onChange={(event) => handleInputChange("durationMin", event.target.value)}
                  required
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600">
                {successMessage}
              </div>
            )}

            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating shift..." : "Add shift"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle>Active shifts</CardTitle>
          <CardDescription>
            Review your weekly availability and remove slots that are no longer needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
              Loading shifts...
            </div>
          ) : sortedShifts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
              You have not created any shifts yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedShifts.map((shift) => (
                <div
                  key={shift.shift_id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {WEEKDAY_LABEL[shift.weekday as Weekday] ?? shift.weekday}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatShiftTime(shift.start_time)} - {formatShiftTime(shift.end_time)}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      Slot length: {shift.duration_min} minutes
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(shift.shift_id)}
                    disabled={pendingDelete === shift.shift_id}
                  >
                    {pendingDelete === shift.shift_id ? "Removing..." : "Delete shift"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
