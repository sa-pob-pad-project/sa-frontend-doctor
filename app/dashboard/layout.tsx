"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [doctorName, setDoctorName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authData = localStorage.getItem("doctorAuth")
    if (!authData) {
      router.push("/login")
    } else {
      const { doctorName } = JSON.parse(authData)
      setDoctorName(doctorName)
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("doctorAuth")
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar doctorName={doctorName} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
