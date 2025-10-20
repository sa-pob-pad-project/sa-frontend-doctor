"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, ChevronDown, Check, X } from "lucide-react"

export function PrescriptionRequests() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const prescriptions = [
    {
      id: 1,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      patientId: "12345678",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:59 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient1",
      medications: [
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
        { name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" },
      ],
      notes: "",
    },
    {
      id: 2,
      patientName: "นายวินัย รุ่งภูมิพันธ์",
      patientId: "12345678",
      date: "วันที่ 13 กันยายน 2568",
      time: "10:59 น.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=patient2",
      medications: [{ name: "ยา...", dosage: "12เม็ด/", quantity: "250 บาท", count: "x6" }],
      notes: "",
    },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">อนุมติใบสั่งยา</h1>
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
            วันที่สำคัญ
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-foreground/60">ใบสั่งยา : {prescriptions.length}</div>

      {/* Prescriptions List */}
      <div className="space-y-3">
        {prescriptions.map((prescription) => (
          <Card key={prescription.id} className="border-0 overflow-hidden">
            <div className="bg-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={prescription.image || "/placeholder.svg"} />
                  <AvatarFallback>PA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-primary-foreground">{prescription.patientName}</p>
                  <p className="text-xs text-primary-foreground/80">
                    วันที่ {prescription.date}, {prescription.time}
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  รายการ หมายเลขสำคัญ {prescription.patientId}
                </p>
                <div className="space-y-2">
                  {prescription.medications.map((med, idx) => (
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

              {/* Notes Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-foreground block mb-2">หมายเหตุ</label>
                <Textarea placeholder="เพิ่มหมายเหตุ..." className="min-h-20" defaultValue={prescription.notes} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  อนุมติ
                </Button>
                <Button variant="destructive" className="flex-1 flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />
                  ไม่อนุมติ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
