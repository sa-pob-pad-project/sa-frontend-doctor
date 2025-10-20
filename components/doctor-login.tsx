"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface DoctorLoginProps {
  onLoginSuccess: (doctorId: string, doctorName: string) => void
}

export function DoctorLogin({ onLoginSuccess }: DoctorLoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate API call - replace with actual authentication
    setTimeout(() => {
      if (email && password) {
        // Mock authentication - in production, call your backend
        if (email === "doctor@example.com" && password === "password123") {
          onLoginSuccess("doc001", "ดร. เก่า")
          setIsLoading(false)
        } else {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
          setIsLoading(false)
        }
      } else {
        setError("กรุณากรอกอีเมลและรหัสผ่าน")
        setIsLoading(false)
      }
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary"></div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Doctor Portal</h1>
            <p className="text-muted-foreground">เข้าสู่ระบบจัดการการนัดหมาย</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">อีเมล</label>
              <Input
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">รหัสผ่าน</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>ระบบจัดการการนัดหมายแพทย์</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
