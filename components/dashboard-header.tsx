"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Building2,
  LogOut,
  User,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  MoreVertical,
  Upload,
  Download,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCurrency, type Currency } from "@/lib/currency-context"
import { S3UploadModal } from "@/components/s3-upload-modal"
import { UploadToS3Modal } from "@/components/upload-to-s3-modal"
import JSZip from "jszip"
import { CloudModeModal } from "@/components/cloud-mode-modal"
import { loadDataFromS3 } from "@/lib/api-client"
import { DataSourceInfo } from "@/components/data-source-info"

type RecommendationType = "inventory-deficit" | "inventory-excess" | "purchase-order"
type ActionType = "accepted" | "rejected"

interface Recommendation {
  id: string
  type: RecommendationType
  partName: string
  quantity: number
  supplier?: string // Only for purchase orders
}

interface Action {
  id: string
  type: RecommendationType
  partName: string
  quantity: number
  supplier?: string
  action: ActionType
  reason?: string // Only for rejected actions
  timestamp: string
}

export function DashboardHeader() {
  const [user] = useState({
    name: "Sarah Chen",
    company: "Acme Electronics",
    initials: "SC",
  })

  const [scenario, setScenario] = useState("live")
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false)
  const [scenarioOptions, setScenarioOptions] = useState({
    supplyLeadTime: false,
    inventoryPolicy: false,
    shipmentDelays: false,
    scheduledShipmentDelays: false,
  })

  const [agentMessage, setAgentMessage] = useState("")
  const [lastRun, setLastRun] = useState({
    timestamp: "2 hours ago",
    status: "completed",
    duration: "3.2s",
  })
  const [tools] = useState([
    { name: "ABC, XYZ Segmentation", status: "completed" as const },
    { name: "resolve shortage", status: "completed" as const },
    { name: "generate recommendations", status: "completed" as const },
  ])

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { id: "1", type: "inventory-deficit", partName: "Widget A", quantity: 500 },
    { id: "2", type: "inventory-excess", partName: "Component B", quantity: 200 },
    { id: "3", type: "purchase-order", partName: "Material C", quantity: 1000, supplier: "Supplier X" },
    { id: "4", type: "purchase-order", partName: "Widget A", quantity: 500, supplier: "ABC Manufacturing" },
    { id: "5", type: "inventory-deficit", partName: "Bolt M8", quantity: 2000 },
  ])

  const [actions, setActions] = useState<Action[]>([])

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const { currency, setCurrency } = useCurrency()
  const [showCompanySettings, setShowCompanySettings] = useState(false)
  const [tempCurrency, setTempCurrency] = useState<Currency>(currency)

  const [cloudMode, setCloudMode] = useState(false)
  const [showS3UploadModal, setShowS3UploadModal] = useState(false)
  const [showUploadToS3Modal, setShowUploadToS3Modal] = useState(false)
  const [showCloudModeModal, setShowCloudModeModal] = useState(false)
  const [isLoadingFromS3, setIsLoadingFromS3] = useState(false)

  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const savedCloudMode = localStorage.getItem("cloudMode")
    if (savedCloudMode !== null) {
      setCloudMode(savedCloudMode === "true")
    }
  }, [])

  const handleCloudModeToggle = () => {
    const newCloudMode = !cloudMode

    if (newCloudMode) {
      // Show modal to ask for folder name
      setShowCloudModeModal(true)
    } else {
      // Disable cloud mode
      setCloudMode(false)
      localStorage.setItem("cloudMode", "false")
      localStorage.removeItem("s3Data")
      localStorage.removeItem("s3FolderPath")
      // Trigger data reload
      window.dispatchEvent(new Event("reloadData"))
    }
  }

  const handleCloudModeConfirm = async (folderName: string) => {
    setShowCloudModeModal(false)
    setIsLoadingFromS3(true)

    try {
      console.log("[v0] Loading data from S3 folder:", folderName)
      const result = await loadDataFromS3(folderName)

      if (result.success && result.files) {
        localStorage.removeItem("s3Data") // Clear any old cached data
        localStorage.setItem("s3FolderPath", folderName)
        localStorage.setItem("cloudMode", "true")
        setCloudMode(true)

        console.log("[v0] Cloud mode enabled, triggering reload")
        // Trigger data reload
        window.dispatchEvent(new Event("reloadData"))
      } else {
        console.error("[v0] Failed to load from S3:", result.error)
        alert(`Failed to load data from S3: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error loading from S3:", error)
      alert("Failed to load data from S3. Please check your credentials and folder path.")
    } finally {
      setIsLoadingFromS3(false)
    }
  }

  const handleAccept = (recommendation: Recommendation) => {
    const action: Action = {
      ...recommendation,
      action: "accepted",
      timestamp: new Date().toLocaleTimeString(),
    }
    setActions([...actions, action])
    setRecommendations(recommendations.filter((r) => r.id !== recommendation.id))
  }

  const handleRejectClick = (recommendationId: string) => {
    setRejectingId(recommendationId)
    setRejectReason("")
  }

  const handleRejectConfirm = (recommendation: Recommendation) => {
    if (!rejectReason.trim()) return

    const action: Action = {
      ...recommendation,
      action: "rejected",
      reason: rejectReason,
      timestamp: new Date().toLocaleTimeString(),
    }
    setActions([...actions, action])
    setRecommendations(recommendations.filter((r) => r.id !== recommendation.id))
    setRejectingId(null)
    setRejectReason("")
  }

  const handleRejectCancel = () => {
    setRejectingId(null)
    setRejectReason("")
  }

  const handleScenarioChange = (value: string) => {
    if (value === "new-scenario") {
      setShowNewScenarioModal(true)
      // Reset scenario options
      setScenarioOptions({
        supplyLeadTime: false,
        inventoryPolicy: false,
        shipmentDelays: false,
        scheduledShipmentDelays: false,
      })
    } else {
      setScenario(value)
    }
  }

  const handleRunScenario = () => {
    console.log("[v0] Running scenario with options:", scenarioOptions)
    // Scenario execution logic would go here
    setShowNewScenarioModal(false)
    // Optionally create a new scenario name based on selected options
  }

  const handleToggleOption = (option: keyof typeof scenarioOptions) => {
    setScenarioOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }))
  }

  const handleCompanySettingsClick = () => {
    setTempCurrency(currency)
    setShowCompanySettings(true)
  }

  const handleSaveSettings = () => {
    setCurrency(tempCurrency)
    setShowCompanySettings(false)
  }

  const handleS3UploadComplete = (files: any[]) => {
    console.log("[v0] S3 files uploaded:", files)
    // Optionally trigger data reload here
    window.dispatchEvent(new Event("storage"))
  }

  const handleDownloadSampleDataset = async () => {
    setIsDownloading(true)
    try {
      const zip = new JSZip()

      const csvFiles = [
        "measures.csv",
        "metrics.csv",
        "products.csv",
        "recommendations.csv",
        "recommendations_mapping.csv",
        "segmentation.csv",
      ]

      for (const filename of csvFiles) {
        try {
          const response = await fetch(`/local_data/${filename}`)
          if (response.ok) {
            const content = await response.text()
            zip.file(filename, content)
            console.log(`[v0] Added ${filename} to zip`)
          } else {
            console.error(`[v0] Failed to fetch ${filename}:`, response.statusText)
          }
        } catch (error) {
          console.error(`[v0] Error fetching ${filename}:`, error)
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })

      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = "trelliso-sample-dataset.zip"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("[v0] Sample dataset downloaded successfully")
    } catch (error) {
      console.error("[v0] Error creating zip file:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const hasSelectedOptions = Object.values(scenarioOptions).some((value) => value)

  const getBadgeVariant = (type: RecommendationType) => {
    switch (type) {
      case "inventory-deficit":
        return "destructive"
      case "inventory-excess":
        return "secondary"
      case "purchase-order":
        return "default"
    }
  }

  const getBadgeLabel = (type: RecommendationType) => {
    switch (type) {
      case "inventory-deficit":
        return "Deficit"
      case "inventory-excess":
        return "Excess"
      case "purchase-order":
        return "Purchase Order"
    }
  }

  const getRecommendationDescription = (rec: Recommendation) => {
    if (rec.type === "purchase-order") {
      return `Order ${rec.quantity} units of ${rec.partName} from ${rec.supplier}`
    } else if (rec.type === "inventory-deficit") {
      return `${rec.partName} - Deficit: ${rec.quantity} units needed`
    } else {
      return `${rec.partName} - Excess: ${rec.quantity} units over target`
    }
  }

  const getActionBadgeVariant = (action: ActionType) => {
    switch (action) {
      case "accepted":
        return "default"
      case "rejected":
        return "destructive"
    }
  }

  const inventoryAlerts = recommendations.filter((r) => r.type === "inventory-deficit" || r.type === "inventory-excess")
  const purchaseOrders = recommendations.filter((r) => r.type === "purchase-order")

  const handleRunAgent = () => {
    console.log("[v0] Running agent with message:", agentMessage)
    // Agent execution logic would go here
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">Trelliso AI</h1>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Select value={scenario} onValueChange={handleScenarioChange}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="new-scenario">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Scenario
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Data Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCloudModeToggle} onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span>Cloud Mode</span>
                      </div>
                      <Badge variant={cloudMode ? "default" : "secondary"} className="text-xs ml-2">
                        {cloudMode ? "On" : "Off"}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowUploadToS3Modal(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload to S3</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSampleDataset} disabled={isDownloading}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>{isDownloading ? "Downloading..." : "Download Sample Dataset"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DataSourceInfo />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-medium">Agent</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[420px] max-h-[600px] overflow-y-auto">
                <DropdownMenuLabel>Supply Demand Agent</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="px-2 py-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Last Run:</span>
                    <span className="text-foreground font-medium">{lastRun.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-foreground font-medium capitalize">{lastRun.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="text-foreground font-medium">{lastRun.duration}</span>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="px-2 py-2">
                  <div className="text-sm font-medium text-foreground mb-2">Tools Called</div>
                  <div className="space-y-2">
                    {tools.map((tool, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {tool.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {tool.status === "running" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                        {tool.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-foreground">{tool.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Recommendations Generated:</span>
                      <button
                        onClick={() => {
                          const recommendationsSection = document.getElementById("recommendations-section")
                          if (recommendationsSection) {
                            recommendationsSection.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        {recommendations.length + actions.length} recommendations
                      </button>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {actions.length > 0 && (
                  <>
                    <div className="px-2 py-2">
                      <div className="text-sm font-medium text-foreground mb-3">Actions</div>
                      <div className="space-y-2">
                        {actions.map((action) => (
                          <div key={action.id} className="border border-border rounded-lg p-2 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-xs text-foreground font-medium">
                                  {action.type === "purchase-order"
                                    ? `${action.partName} - ${action.quantity} units from ${action.supplier}`
                                    : `${action.partName} - ${action.quantity} units`}
                                </p>
                                {action.reason && (
                                  <p className="text-xs text-muted-foreground mt-1">Reason: {action.reason}</p>
                                )}
                              </div>
                              <Badge
                                variant={getActionBadgeVariant(action.action)}
                                className="text-xs capitalize shrink-0"
                              >
                                {action.action}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {getBadgeLabel(action.type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{action.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                <div className="px-2 py-2 space-y-2">
                  <Textarea
                    placeholder="Analyze current plan or various what-if scenarios such as shipment delays, supplier lead time change, inventory policy change and more."
                    value={agentMessage}
                    onChange={(e) => setAgentMessage(e.target.value)}
                    className="min-h-[80px] resize-none text-sm"
                  />
                  <Button onClick={handleRunAgent} disabled={!agentMessage.trim()} className="w-full gap-2" size="sm">
                    <Play className="h-4 w-4" />
                    Run Agent
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 hover:bg-transparent hover:text-foreground border-0 focus-visible:ring-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.company}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCompanySettingsClick}>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Company Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={showNewScenarioModal} onOpenChange={setShowNewScenarioModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
            <DialogDescription>Select the parameters you want to analyze in this what-if scenario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="supply-lead-time"
                checked={scenarioOptions.supplyLeadTime}
                onCheckedChange={() => handleToggleOption("supplyLeadTime")}
              />
              <Label
                htmlFor="supply-lead-time"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Supply lead time changes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inventory-policy"
                checked={scenarioOptions.inventoryPolicy}
                onCheckedChange={() => handleToggleOption("inventoryPolicy")}
              />
              <Label
                htmlFor="inventory-policy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Inventory policy changes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shipment-delays"
                checked={scenarioOptions.shipmentDelays}
                onCheckedChange={() => handleToggleOption("shipmentDelays")}
              />
              <Label
                htmlFor="shipment-delays"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Shipment delays
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scheduled-shipment-delays"
                checked={scenarioOptions.scheduledShipmentDelays}
                onCheckedChange={() => handleToggleOption("scheduledShipmentDelays")}
              />
              <Label
                htmlFor="scheduled-shipment-delays"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Scheduled shipment delays
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewScenarioModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRunScenario} disabled={!hasSelectedOptions}>
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompanySettings} onOpenChange={setShowCompanySettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Company Settings</DialogTitle>
            <DialogDescription>Configure your company preferences and display settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">
                Currency
              </Label>
              <Select value={tempCurrency} onValueChange={(value) => setTempCurrency(value as Currency)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                  <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This will update all currency displays across the dashboard.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanySettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CloudModeModal
        open={showCloudModeModal}
        onOpenChange={setShowCloudModeModal}
        onConfirm={handleCloudModeConfirm}
      />

      {isLoadingFromS3 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading data from S3...</p>
          </div>
        </div>
      )}

      <S3UploadModal
        open={showS3UploadModal}
        onOpenChange={setShowS3UploadModal}
        onUploadComplete={handleS3UploadComplete}
      />

      <UploadToS3Modal open={showUploadToS3Modal} onOpenChange={setShowUploadToS3Modal} />
    </header>
  )
}
