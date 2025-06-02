import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import ChatList from "@/components/chat-list"

export default async function HomePage() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get("authToken")

  if (!authToken) {
    redirect("/auth")
  }

  return <ChatList />
}
