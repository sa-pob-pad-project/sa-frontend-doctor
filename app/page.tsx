"use client"
import { redirect } from "next/navigation"

type Page = "dashboard" | "appointments" | "prescriptions" | "history"

export default function Home() {
  redirect("/login")
}

// const [isAuthenticated, setIsAuthenticated] = useState(false)
// const [doctorName, setDoctorName] = useState("")
// const [currentPage, setCurrentPage] = useState<Page>("dashboard")

// const handleLoginSuccess = (doctorId: string, name: string) => {
//   setDoctorName(name)
//   setIsAuthenticated(true)
// }

// const handleLogout = () => {
//   setIsAuthenticated(false)
//   setDoctorName("")
//   setCurrentPage("dashboard")
// }

// if (!isAuthenticated) {
//   return <DoctorLogin onLoginSuccess={handleLoginSuccess} />
// }

// const renderPage = () => {
//   switch (currentPage) {
//     case "dashboard":
//       return <DoctorDashboard />
//     case "appointments":
//       return <AppointmentRequests />
//     case "prescriptions":
//       return <PrescriptionRequests />
//     case "history":
//       return <PrescriptionHistory />
//     default:
//       return <DoctorDashboard />
//   }
// }

// return (
//   <div className="flex h-screen bg-background">
//     <Sidebar
//       currentPage={currentPage}
//       onPageChange={setCurrentPage}
//       doctorName={doctorName}
//       onLogout={handleLogout}
//     />
//     <main className="flex-1 overflow-auto">{renderPage()}</main>
//   </div>
// )
