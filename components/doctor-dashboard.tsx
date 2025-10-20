"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Clock, Users, FileText, CheckCircle } from "lucide-react"

export function DoctorDashboard() {
  const stats = [
    { label: "บิดหมายวินาที", value: "12นิด", icon: Clock, color: "bg-primary" },
    { label: "บิดหมายวินาที", value: "12นิด", icon: Users, color: "bg-primary" },
    { label: "บิดหมายวินาที", value: "12นิด", icon: FileText, color: "bg-primary" },
    { label: "บิดหมายวินาที", value: "12นิด", icon: CheckCircle, color: "bg-primary" },
  ]

  const upcomingAppointments = [
    {
      id: 1,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient1",
    },
    {
      id: 2,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient2",
    },
    {
      id: 3,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient3",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="bg-accent border-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground/60 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upcoming Appointments */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">บิดหมายวินาที</h2>
        <div className="space-y-3">
          {upcomingAppointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="border-l-4 border-l-primary bg-card hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-primary rounded-full p-1">
                      <Clock className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground/60">
                        {appointment.date}, {appointment.time}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={appointment.image || "/placeholder.svg"} />
                          <AvatarFallback>PA</AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-foreground">{appointment.patientName}</p>
                      </div>
                    </div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">ดูรายละเอียดปัจจุบัน</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
