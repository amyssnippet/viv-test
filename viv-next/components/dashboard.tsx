"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  MessageCircle,
  RefreshCw,
  Plus,
  Shield,
  Clock,
  Database,
  Play,
  Code,
  Copy,
  CheckCircle,
  Trash2,
  Menu,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"

const BACKENDURL = "https://cp.cosinv.com/api/v1"

interface Tool {
  name: string
  endpoint: string
  token: string
  tokens: number
  createdAt: string
  lastUsedAt?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const userToken = Cookies.get("authToken")
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [tools, setTools] = useState<Tool[]>([])
  const [showEndpointModal, setShowEndpointModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newEndpoint, setNewEndpoint] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleCopy = () => {
    if (userData?.userId) {
      navigator.clipboard.writeText(userData.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const displayId = userData?.userId ? userData.userId : "Loading..."

  useEffect(() => {
    if (userToken) {
      try {
        const decodedToken = jwtDecode(userToken)
        setUserData(decodedToken)
      } catch (error) {
        console.error("Error decoding token:", error)
        setUserData(null)
      }
    } else {
      router.push("/auth")
    }
  }, [userToken, router])

  const fetchDeveloper = async () => {
    try {
      setIsRefreshing(true)
      const response = await axios.post(`${BACKENDURL}/fetch/developerToken`, {
        userId: userData.userId,
      })
      setTools(response.data.developerTools)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching developer tools:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (activeTab === "Dashboard" && userData?.userId) {
      fetchDeveloper()
    }
  }, [activeTab, userData])

  const handleManualRefresh = () => {
    if (activeTab === "Dashboard" && userData?.userId) {
      fetchDeveloper()
    }
  }

  const handleDelete = async (endpoint: string) => {
    if (confirm("Are you sure you want to delete this tool?")) {
      try {
        setDeleteLoading(true)
        await axios.delete(`${BACKENDURL}/delete-endpoint/${userData.userId}/${endpoint}`)
        setTools((prev) => prev.filter((tool) => tool.endpoint !== endpoint))
        toast.success("Tool deleted successfully!")
      } catch (error) {
        toast.error("Failed to delete tool")
      } finally {
        setDeleteLoading(false)
      }
    }
  }

  const EndpointCreationUI = () => {
    const [formData, setFormData] = useState({
      name: "",
      tokens: 5000,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFormData({
        ...formData,
        [name]: name === "tokens" ? Number.parseInt(value, 10) : value,
      })
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        const response = await axios.post(`${BACKENDURL}/create-endpoint/${userData.userId}`, formData)

        if (response.data.success) {
          setNewEndpoint(response.data)
          fetchDeveloper()
          setShowEndpointModal(false)
          setShowSuccessModal(true)
          setFormData({ name: "", tokens: 5000 })
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "An error occurred while creating the endpoint")
      } finally {
        setLoading(false)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">
            Endpoint Name
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="My Cool API Endpoint"
            value={formData.name}
            onChange={handleChange}
            required
            className="bg-[#2A2A2B] border-[#444] text-white"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEndpointModal(false)}
            className="border-[#444] text-white hover:bg-[#333]"
          >
            Close
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create API"
            )}
          </Button>
        </DialogFooter>
      </form>
    )
  }

  const Playground = () => {
    const [formData, setFormData] = useState({
      userId: userData?.userId,
      prompt: "What are your capabilities",
      model: "Numax",
      instructions: "You are a smart AI",
      stream: false,
      endpoint: "",
    })

    const [response, setResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      const newValue = name === "stream" ? (e.target as HTMLInputElement).checked : value

      setFormData({
        ...formData,
        [name]: newValue,
      })
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)
      setResponse(null)

      try {
        if (!formData.endpoint) {
          throw new Error("Endpoint ID is required")
        }

        const payload = {
          userId: formData.userId,
          prompt: formData.prompt,
          model: formData.model,
          instructions: formData.instructions,
          stream: formData.stream,
        }

        const response = await axios.post(`${BACKENDURL}/completionsforPG/${formData.endpoint}`, payload)
        setResponse(response.data)
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    const copyToClipboard = () => {
      if (response) {
        navigator.clipboard.writeText(JSON.stringify(response, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1E1E1F] border-[#333]">
          <CardHeader className="bg-[#252526] border-b border-[#333]">
            <CardTitle className="text-white flex items-center">
              <Code className="mr-2" size={18} />
              Request Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Endpoint ID</Label>
                <Input
                  name="endpoint"
                  placeholder="Enter your endpoint ID"
                  value={formData.endpoint}
                  onChange={handleChange}
                  required
                  className="bg-[#2A2A2B] border-[#444] text-white"
                />
                <p className="text-sm text-gray-400">The endpoint ID from your dashboard</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">User ID</Label>
                <Input
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  className="bg-[#2A2A2B] border-[#444] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Prompt</Label>
                <Textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleChange}
                  required
                  className="bg-[#2A2A2B] border-[#444] text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Model</Label>
                <Input
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="bg-[#2A2A2B] border-[#444] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Instructions</Label>
                <Textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  className="bg-[#2A2A2B] border-[#444] text-white"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-2" />
                    Run Completion
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1F] border-[#333]">
          <CardHeader className="bg-[#252526] border-b border-[#333] flex flex-row items-center justify-between">
            <CardTitle className="text-white">Response</CardTitle>
            {response && (
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <CheckCircle size={14} className="mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-white">Fetching response...</span>
                </div>
              ) : response ? (
                <pre className="bg-[#252526] text-gray-300 p-4 rounded-lg whitespace-pre-wrap break-words text-sm">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Code size={48} className="mx-auto mb-3" />
                  <p>Response will appear here after you run a completion</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#232223]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#232223]">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden fixed top-4 left-4 z-50 bg-[#1E1E1F] text-white hover:bg-[#333]"
          >
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-[#171717] border-[#333] p-0">
          <SheetHeader className="p-4 border-b border-[#333]">
            <SheetTitle className="text-white text-left">VIV AI</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-[#333] transition-colors"
            >
              <MessageCircle size={20} />
              Chats
            </Link>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 p-3 ${activeTab === "Dashboard" ? "bg-blue-600 text-white" : "text-white hover:bg-[#333]"}`}
              onClick={() => setActiveTab("Dashboard")}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 p-3 ${activeTab === "Playground" ? "bg-blue-600 text-white" : "text-white hover:bg-[#333]"}`}
              onClick={() => setActiveTab("Playground")}
            >
              <Code size={20} />
              Playground
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-[#171717] border-r border-[#333] flex-col p-4">
        <h1 className="text-white text-xl font-bold mb-6">VIV AI</h1>
        <nav className="space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 p-3 rounded-lg text-white hover:bg-[#333] transition-colors"
          >
            <MessageCircle size={20} />
            Chats
          </Link>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 p-3 ${activeTab === "Dashboard" ? "bg-blue-600 text-white" : "text-white hover:bg-[#333]"}`}
            onClick={() => setActiveTab("Dashboard")}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 p-3 ${activeTab === "Playground" ? "bg-blue-600 text-white" : "text-white hover:bg-[#333]"}`}
            onClick={() => setActiveTab("Playground")}
          >
            <Code size={20} />
            Playground
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === "Dashboard" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-white text-2xl font-semibold mb-1">Developer Dashboard</h2>
                <p className="text-gray-400">Manage your API endpoints and monitor usage</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  className="border-[#444] text-white hover:bg-[#333]"
                >
                  <RefreshCw size={16} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Dialog open={showEndpointModal} onOpenChange={setShowEndpointModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus size={16} className="mr-2" />
                      Create Endpoint
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1E1E1F] border-[#333]">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center">
                        <Plus size={16} className="mr-2" />
                        Create API Endpoint
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Create a new API endpoint for your applications
                      </DialogDescription>
                    </DialogHeader>
                    <EndpointCreationUI />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-[#1E1E1F] border-[#333]">
                <CardContent className="p-6 flex items-center">
                  <div className="bg-blue-600/20 p-3 rounded-lg mr-4">
                    <Database size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Endpoints</p>
                    <p className="text-white text-2xl font-semibold">{tools.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1E1E1F] border-[#333]">
                <CardContent className="p-6 flex items-center">
                  <div className="bg-blue-600/20 p-3 rounded-lg mr-4">
                    <Clock size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Last Updated</p>
                    <p className="text-white text-2xl font-semibold">
                      {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Never"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1E1E1F] border-[#333]">
                <CardContent className="p-6 flex items-center">
                  <div className="bg-blue-600/20 p-3 rounded-lg mr-4">
                    <Shield size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Your User ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-lg font-semibold">{displayId}</p>
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 border-[#444] hover:bg-[#333]"
                      >
                        <Copy size={12} />
                      </Button>
                      {copied && <span className="text-green-400 text-sm">Copied!</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* API Endpoints Table */}
            <Card className="bg-[#1E1E1F] border-[#333]">
              <CardHeader className="bg-[#252526] border-b border-[#333]">
                <CardTitle className="text-white">API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {tools.length === 0 ? (
                  <div className="text-center py-12">
                    <Database size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No endpoints found. Create your first endpoint to get started.</p>
                    <Dialog open={showEndpointModal} onOpenChange={setShowEndpointModal}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus size={16} className="mr-2" />
                          Create Endpoint
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1E1E1F] border-[#333]">
                        <DialogHeader>
                          <DialogTitle className="text-white flex items-center">
                            <Plus size={16} className="mr-2" />
                            Create API Endpoint
                          </DialogTitle>
                        </DialogHeader>
                        <EndpointCreationUI />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#252526]">
                        <tr>
                          <th className="text-left p-4 text-white font-medium">Name</th>
                          <th className="text-left p-4 text-white font-medium">Endpoint</th>
                          <th className="text-left p-4 text-white font-medium">Token</th>
                          <th className="text-left p-4 text-white font-medium">Tokens Balance</th>
                          <th className="text-left p-4 text-white font-medium">Created At</th>
                          <th className="text-left p-4 text-white font-medium">Last Used</th>
                          <th className="text-center p-4 text-white font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tools.map((tool, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-[#1E1E1F]" : "bg-[#252526]"}>
                            <td className="p-4 text-white font-medium">{tool.name}</td>
                            <td className="p-4">
                              <code className="bg-black/20 text-white px-2 py-1 rounded text-sm">{tool.endpoint}</code>
                            </td>
                            <td className="p-4 text-white">{tool.token || "—"}</td>
                            <td className="p-4">
                              <Badge variant={tool.tokens > 1000 ? "default" : "destructive"}>{tool.tokens}</Badge>
                            </td>
                            <td className="p-4 text-white">
                              <div className="flex items-center">
                                <Clock size={14} className="mr-2 text-gray-400" />
                                {new Date(tool.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4 text-white">
                              {tool.lastUsedAt ? new Date(tool.lastUsedAt).toLocaleString() : "Never"}
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                onClick={() => handleDelete(tool.endpoint)}
                                disabled={deleteLoading}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "Playground" && (
          <>
            <div className="mb-6">
              <h2 className="text-white text-2xl font-semibold mb-1">API Playground</h2>
              <p className="text-gray-400">Test your API endpoints with different parameters</p>
            </div>
            <Playground />
          </>
        )}

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="bg-[#1E1E1F] border-[#333]">
            <DialogHeader>
              <DialogTitle className="text-white">Endpoint Creation Success</DialogTitle>
            </DialogHeader>
            {newEndpoint && (
              <Card className="bg-[#252526] border-[#444]">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <strong className="text-white">Endpoint Name:</strong>{" "}
                    <span className="text-white">{newEndpoint.toolName}</span>
                  </div>
                  <div>
                    <strong className="text-white">Endpoint ID:</strong>
                    <code className="block mt-1 p-2 bg-[#1E1E1F] border border-[#444] rounded text-white text-sm">
                      {newEndpoint.endpoint}
                    </code>
                  </div>
                  <div>
                    <strong className="text-white">Token Balance:</strong>{" "}
                    <span className="text-green-400">{newEndpoint.tokens}</span>
                  </div>
                  <Alert>
                    <Shield size={16} />
                    <AlertDescription>
                      Save this endpoint ID securely! You'll need it for API authentication.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
            <DialogFooter>
              <Button onClick={() => setShowSuccessModal(false)} className="bg-blue-600 hover:bg-blue-700">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
