"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Search, ChevronDown } from "lucide-react"

export function AppointmentRequests() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("latest")

  const appointments = [
    {
      id: 1,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient1",
      status: "pending",
    },
    {
      id: 2,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient2",
      status: "pending",
    },
    {
      id: 3,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient3",
      status: "pending",
    },
    {
      id: 4,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient4",
      status: "pending",
    },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">จัดการการนัดหมาย</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="ค้นหารายการบริการ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/60">เรียงตาม</span>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            {sortBy === "latest" ? "วันที่สำคัญ" : "วันที่สำคัญ"}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-foreground/60">รายการบริการ : {appointments.length}</div>

      {/* Appointments List */}
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="border-0 overflow-hidden">
            <div className="bg-primary p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-foreground" />
              <p className="text-sm font-medium text-primary-foreground">
                เอานัดหมาย : {appointment.date}, {appointment.time}
              </p>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={appointment.image || "/placeholder.svg"} />
                    <AvatarFallback>PA</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-foreground">{appointment.patientName}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">ดูรายละเอียดปัจจุบัน</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
