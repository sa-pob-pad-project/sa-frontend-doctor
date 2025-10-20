"use client"

import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Calendar, Pill, History, LogOut } from "lucide-react"

interface SidebarProps {
  doctorName?: string
  onLogout?: () => void
}

export function Sidebar({ doctorName = "ดร. เก่า", onLogout }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "appointments", label: "Appointments", icon: Calendar, href: "/dashboard/appointments" },
    { id: "prescriptions", label: "Prescriptions", icon: Pill, href: "/dashboard/prescriptions" },
    { id: "history", label: "History", icon: History, href: "/dashboard/history" },
  ]

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12 border-2 border-sidebar-primary">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=doctor" />
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sidebar-foreground">{doctorName}</p>
            <p className="text-xs text-sidebar-foreground/60">แพทย์</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  )
}
