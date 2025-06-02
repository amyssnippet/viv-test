import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Dashboard from "@/components/dashboard"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get("authToken")

  if (!authToken) {
    redirect("/auth")
  }

  return <Dashboard />
}
