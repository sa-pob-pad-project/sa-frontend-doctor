"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { doctorLoginService } from "@/services/api-services"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!username || !password) {
        setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน")
        setIsLoading(false)
        return
      }

      const response = await doctorLoginService.login({
        username,
        password,
      })

      // Store doctor auth data in localStorage
      localStorage.setItem("doctorAuth", JSON.stringify({
        doctorName: response.doctorName || username,
        username: username,
        access_token: response.access_token,
      }))

      // Redirect to dashboard (token is set in cookie by backend)
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      const errorMessage = err.response?.data?.message || err.message || "เข้าสู่ระบบไม่สำเร็จ"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Doctor Portal</h1>
            <p className="text-muted-foreground">เข้าสู่ระบบจัดการการนัดหมาย</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">ชื่อผู้ใช้</label>
              <Input
                type="text"
                placeholder="doctor_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">รหัสผ่าน</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
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
