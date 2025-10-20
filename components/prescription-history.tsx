"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, Clock } from "lucide-react"

export function PrescriptionHistory() {
  const [searchTerm, setSearchTerm] = useState("")

  const history = [
    {
      id: 1,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      patientId: "12345678",
      date: "วันที่ 17 สิงหาคม 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient1",
      medications: [
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
      ],
      followUpDate: "วันที่ 17 สิงหาคม 2568 เวลา 10:00 - 10:30 น.",
    },
    {
      id: 2,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      patientId: "12345678",
      date: "วันที่ 17 สิงหาคม 2568",
      time: "10:00 - 10:30 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient2",
      medications: [
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
      ],
      followUpDate: "วันที่ 17 สิงหาคม 2568 เวลา 10:00 - 10:30 น.",
    },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">ประวัติปัจจุบันในการรักษา</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="ค้นหารายการบริการ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="text-sm text-foreground/60">ประวัติปัจจุบันในการรักษา : {history.length}</div>

      {/* History List */}
      <div className="space-y-4">
        {history.map((record) => (
          <Card key={record.id} className="border-0 overflow-hidden">
            <div className="bg-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={record.image || "/placeholder.svg"} />
                  <AvatarFallback>PA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-primary-foreground">{record.patientName}</p>
                  <p className="text-xs text-primary-foreground/80">ผู้ป่วยโรคเบาหวานเก่าในใบไม่ปกติ</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">
                  การสั่งยารักษาสำคัญ หมายเลขสำคัญ {record.patientId} วันที่ {record.date}
                </p>
                <div className="space-y-2">
                  {record.medications.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                          <span className="text-xs">💊</span>
                        </div>
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <p className="text-xs text-foreground/60">{med.dosage}</p>
                          <p className="text-xs text-foreground/60">{med.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{med.count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up */}
              <div className="border-t pt-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-foreground/60 mb-1">การหมอบอกรักษาสำคัญ</p>
                  <p className="text-sm font-medium text-foreground">{record.followUpDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
