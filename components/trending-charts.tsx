"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  BarChart3,
  TableIcon,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Package,
  Grid3x3,
  Edit2,
  Sparkles,
  Settings,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SegmentationMatrix } from "./segmentation-matrix"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog" // Added Dialog for metric customization
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox for metric selection
import type { Action, ActionStatus } from "@/types/action" // Assuming Action and ActionStatus are defined in this file
import { useCurrency } from "@/lib/currency-context" // Added useCurrency hook
import { useData } from "@/lib/data-context"
import { getProductFamilies, getLocations, aggregateMeasures } from "@/lib/data-loader"

const getMonday = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Remove: generateTimeSeriesData, timeSeriesData, chartData, initialRecommendations, initialActions, productFamilies, locations

interface TrendingChartsProps {
  viewMode: "chart" | "table" | "segmentation"
  setViewMode: (mode: "chart" | "table" | "segmentation") => void
  filters: {
    product: string
    location: string
    timeRange: string
  }
  setFilters: (filters: any) => void
  selectedSegment: string | null
  setSelectedSegment: (segment: string | null) => void
  onSegmentDetails?: (segment: string) => void
}

type RecommendationType = "inventory-deficit" | "inventory-excess" | "purchase-order"

interface Recommendation {
  id: string
  type: RecommendationType
  partName: string
  quantity: number
  supplier?: string
  priority: "high" | "medium" | "low"
  generatedDate: string // Added generatedDate field
}

interface CompletedAction {
  id: string
  type: RecommendationType
  partName: string
  quantity: number
  supplier?: string
  action: "accepted" | "rejected"
  reason?: string
  timestamp: string
  generatedDate: string // Added generatedDate field
}

const getRecommendations = (segment: string | null) => {
  if (!segment) {
    return [
      {
        type: "warning",
        title: "Low Inventory Alert",
        description: "Electronics category inventory is 15% below optimal levels in North America region",
        action: "Increase order quantity",
        priority: "high",
      },
      {
        type: "opportunity",
        title: "Demand Surge Detected",
        description: "Consumer electronics demand increased 23% in the last 2 weeks, consider ramping up production",
        action: "Adjust forecast",
        priority: "medium",
      },
      {
        type: "success",
        title: "Supply Chain Optimization",
        description: "Asia Pacific supply routes are performing 12% above target efficiency",
        action: "Apply to other regions",
        priority: "low",
      },
    ]
  }

  const abc = segment[0]
  const xyz = segment[1]

  const recommendations = []

  if (abc === "A") {
    if (xyz === "X") {
      recommendations.push({
        type: "success",
        title: "Optimal Segment Performance",
        description: "AX segment (high-value, stable demand) is performing well with minimal excess inventory",
        action: "Maintain current strategy",
        priority: "low",
      })
    } else if (xyz === "Y") {
      recommendations.push({
        type: "warning",
        title: "Variable Demand Pattern",
        description:
          "AY segment shows $240K excess inventory due to demand variability. Implement dynamic safety stock",
        action: "Adjust safety stock",
        priority: "high",
      })
    } else {
      recommendations.push({
        type: "warning",
        title: "High Risk Segment",
        description: "AZ segment has $450K replenishment needs with volatile demand. Consider vendor-managed inventory",
        action: "Implement VMI",
        priority: "high",
      })
    }
  } else if (abc === "B") {
    recommendations.push({
      type: "opportunity",
      title: "Optimization Opportunity",
      description: `${segment} segment can benefit from improved forecasting to reduce $${xyz === "Z" ? "220K" : xyz === "Y" ? "175K" : "95K"} replenishment costs`,
      action: "Enhance forecasting",
      priority: "medium",
    })
  } else {
    recommendations.push({
      type: "success",
      title: "Low Priority Segment",
      description: `${segment} segment (low-value) is stable. Consider periodic review instead of continuous monitoring`,
      action: "Switch to periodic review",
      priority: "low",
    })
  }

  return recommendations
}

const initialActions: Action[] = [
  {
    id: "initial-1",
    title: "Default Action 1",
    status: "recommendation",
  },
  {
    id: "initial-2",
    title: "Default Action 2",
    status: "in-progress",
  },
]

const getActions = (segment: string | null) => {
  if (!segment) return initialActions

  const abc = segment[0]
  const xyz = segment[1]

  if (abc === "A" && xyz === "Z") {
    return [
      {
        id: "1",
        title: "Implement vendor-managed inventory for AZ segment to handle volatile demand",
        status: "recommendation" as ActionStatus,
      },
      {
        id: "2",
        title: "Increase safety stock levels by 25% for high-value volatile items",
        status: "in-progress" as ActionStatus,
      },
      {
        id: "3",
        title: "Set up weekly demand review meetings with sales team for AZ products",
        status: "accepted" as ActionStatus,
      },
    ]
  } else if (abc === "A" && xyz === "Y") {
    return [
      {
        id: "1",
        title: "Implement dynamic safety stock calculation for AY segment",
        status: "recommendation" as ActionStatus,
      },
      {
        id: "2",
        title: "Reduce excess inventory by $120K through promotional campaigns",
        status: "in-progress" as ActionStatus,
      },
    ]
  } else if (abc === "B") {
    return [
      {
        id: "1",
        title: `Optimize reorder points for ${segment} segment to reduce replenishment costs`,
        status: "recommendation" as ActionStatus,
      },
      {
        id: "2",
        title: "Consolidate suppliers for medium-value items to improve lead times",
        status: "in-progress" as ActionStatus,
      },
    ]
  }

  return [
    {
      id: "1",
      title: `Switch ${segment} segment to periodic review (monthly) to reduce monitoring costs`,
      status: "recommendation" as ActionStatus,
    },
  ]
}

export function TrendingCharts({
  viewMode,
  setViewMode,
  filters,
  setFilters,
  selectedSegment,
  setSelectedSegment,
  onSegmentDetails,
}: TrendingChartsProps) {
  const { measures, products, recommendations: csvRecommendations, loading } = useData()

  const [unit, setUnit] = useState<"units" | "dollars">("units")
  const [productOpen, setProductOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [productSearch, setProductSearch] = useState("")

  const { formatCurrency, currency } = useCurrency()

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹"

  const [visibleMetrics, setVisibleMetrics] = useState({
    demand: true,
    scheduledSupply: true,
    inTransit: true,
    targetInventory: true,
    targetInventoryDays: true,
    onHandInventory: true,
    onHandInventoryDays: true,
    supplyRecommendations: true,
  })

  const productOptions = useMemo(() => {
    const families = getProductFamilies(products)
    const options: { value: string; label: string; type: "family" | "product" }[] = []

    // Add "All Products" option
    options.push({ value: "All Products", label: "All Products", type: "family" })

    // Add product families
    families.slice(1).forEach((family) => {
      options.push({
        value: family.toLowerCase().replace(/\s+/g, "-"),
        label: family,
        type: "family",
      })
    })

    products.forEach((product) => {
      options.push({
        value: `product-${product.product_id}`,
        label: product.product_id,
        type: "product",
      })
    })

    return options
  }, [products])

  const filteredProductOptions = useMemo(() => {
    if (!productSearch.trim()) {
      // No search - only show product families
      return productOptions.filter((opt) => opt.type === "family")
    }
    // Has search - show both families and products that match
    const searchLower = productSearch.toLowerCase()
    return productOptions.filter((opt) => opt.label.toLowerCase().includes(searchLower))
  }, [productOptions, productSearch])

  const locations = useMemo(() => {
    const locs = getLocations(measures)
    return [
      { value: "All Locations", label: "All Locations" },
      ...locs.map((l) => ({ value: l, label: l }))
    ]
  }, [measures])

  const recommendations = useMemo(() => {
    return csvRecommendations
      .filter((r) => r.status === "open")
      .map((r) => ({
        id: r.id,
        type: r.type as RecommendationType,
        partName: r.name,
        quantity: 500, // Default quantity, could be added to CSV
        supplier: r.type === "purchase-order" ? "Supplier" : undefined,
        priority: r.severity as "high" | "medium" | "low",
        generatedDate: new Date().toISOString().split("T")[0],
      }))
  }, [csvRecommendations])

  const [activeRecommendations, setActiveRecommendations] = useState(recommendations)
  const [completedActions, setCompletedActions] = useState<CompletedAction[]>([])
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<"accepted" | "rejected" | "">("")
  const [rejectReason, setRejectReason] = useState("")
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [editAction, setEditAction] = useState<"accepted" | "rejected" | "">("")
  const [editReason, setEditReason] = useState("")

  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [themeFilter, setThemeFilter] = useState<string>("all")

  const [showExplainabilityId, setShowExplainabilityId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"recommendations" | "actions">("recommendations") // Added tab state

  const unitToDollar = 50

  const formatValue = (value: number) => {
    if (unit === "dollars") {
      const dollarValue = value * unitToDollar
      return formatCurrency(dollarValue)
    }
    return value.toLocaleString()
  }

  const calculateDaysOnHand = (inventory: number, demand: number) => {
    const dailyDemand = demand / 7 // Convert weekly demand to daily
    if (dailyDemand === 0) return 0
    return Math.round((inventory / dailyDemand) * 10) / 10 // Round to 1 decimal
  }

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }))
  }

  // Define MeasureData interface
  interface MeasureData {
    product_id: string
    location_id: string
    measure_id: string
    weeks: number[]
  }

  const timeSeriesData = useMemo(() => {
    if (loading || measures.length === 0) return []

    let selectedProductFamily = "All Products"
    let selectedProductIds: string[] = []

    if (filters.product.startsWith("product-")) {
      // Individual product selected
      const productId = filters.product.replace("product-", "")
      selectedProductIds = [productId]
      console.log("[v0] Selected individual product:", productId)
      // Find the family for display purposes
      const product = products.find((p) => p.product_id === productId)
      selectedProductFamily = product?.product_family || "All Products"
    } else {
      // Product family selected
      const familyOption = productOptions.find((p) => p.value === filters.product)
      selectedProductFamily = familyOption?.label || "All Products"
      console.log("[v0] Selected product family:", selectedProductFamily)
    }

    const selectedLocation = locations.find((l) => l.value === filters.location)?.label || "All Locations"
    console.log("[v0] Selected location:", selectedLocation)

    // Aggregate measures based on filters
    let aggregated: Map<string, number[]>

    if (selectedProductIds.length > 0) {
      // Filter for specific product IDs
      let filteredMeasures = measures.filter((m) => selectedProductIds.includes(m.product_id))

      console.log("[v0] Total measures for product:", filteredMeasures.length)
      console.log("[v0] Sample measure data:", filteredMeasures[0])

      if (selectedLocation !== "All Locations") {
        filteredMeasures = filteredMeasures.filter((m) => m.location_id === selectedLocation)
        console.log("[v0] Measures after location filter:", filteredMeasures.length)
      }

      // Group and aggregate
      const grouped = new Map<string, MeasureData[]>()
      filteredMeasures.forEach((m) => {
        const key = m.measure_id
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key)!.push(m)
      })

      console.log("[v0] Measure types found:", Array.from(grouped.keys()))

      aggregated = new Map<string, number[]>()
      grouped.forEach((measureList, measureId) => {
        if (measureId.includes("days")) {
          const weekAverages = Array(20).fill(0)
          for (let week = 0; week < 20; week++) {
            const values = measureList.map((m) => m.weeks[week])
            weekAverages[week] = values.reduce((a, b) => a + b, 0) / values.length
          }
          aggregated.set(measureId, weekAverages)
          if (measureId === "on_hand_inventory_days_unit_value") {
            console.log("[v0] CSV on_hand_inventory_days (first 4 weeks):", weekAverages.slice(0, 4))
          }
        } else {
          const weekSums = Array(20).fill(0)
          for (let week = 0; week < 20; week++) {
            weekSums[week] = measureList.reduce((sum, m) => sum + m.weeks[week], 0)
          }
          aggregated.set(measureId, weekSums)
        }
      })

      const demandData = aggregated.get("demand_unit_value")
      if (demandData) {
        console.log("[v0] Sample demand data (first 4 weeks):", demandData.slice(0, 4))
      }

      const onHandData = aggregated.get("on_hand_inventory_unit_value")
      if (onHandData) {
        console.log("[v0] On hand inventory (first 4 weeks):", onHandData.slice(0, 4))
      }
    } else {
      // Use existing aggregation for product families
      aggregated = aggregateMeasures(measures, products, selectedProductFamily, selectedLocation)
    }

    // Get measure data
    const demandUnit = aggregated.get("demand_unit_value") || Array(20).fill(0)
    const demandFinancial = aggregated.get("demand_financial_value") || Array(20).fill(0)
    const scheduledSupplyUnit = aggregated.get("scheduled_supply_unit_value") || Array(20).fill(0)
    const scheduledSupplyFinancial = aggregated.get("scheduled_supply_financial_value") || Array(20).fill(0)
    const inTransitUnit = aggregated.get("in_transit_unit_value") || Array(20).fill(0)
    const inTransitFinancial = aggregated.get("in_transit_financial_value") || Array(20).fill(0)
    const onHandUnit = aggregated.get("on_hand_inventory_unit_value") || Array(20).fill(0)
    const onHandFinancial = aggregated.get("on_hand_inventory_financial_value") || Array(20).fill(0)
    const targetUnit = aggregated.get("target_inventory_unit_value") || Array(20).fill(0)
    const targetFinancial = aggregated.get("target_inventory_financial_value") || Array(20).fill(0)

    const onHandDaysUnit = aggregated.get("on_hand_inventory_days_unit_value") || Array(20).fill(0)
    const targetDaysUnit = aggregated.get("target_inventory_days_unit_value") || Array(20).fill(0)

    // Generate week labels
    const getMonday = (date: Date) => {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(d.setDate(diff))
    }

    const startDate = getMonday(new Date())
    const data = []

    for (let i = 0; i < 20; i++) {
      const weekDate = new Date(startDate)
      weekDate.setDate(startDate.getDate() + i * 7)

      const weekLabel = `W${i + 1}`
      const dateLabel = `${(weekDate.getMonth() + 1).toString().padStart(2, "0")}/${weekDate.getDate().toString().padStart(2, "0")}`

      data.push({
        week: weekLabel,
        date: dateLabel,
        demand: unit === "units" ? demandUnit[i] : demandFinancial[i],
        scheduledSupply: unit === "units" ? scheduledSupplyUnit[i] : scheduledSupplyFinancial[i],
        inTransit: unit === "units" ? inTransitUnit[i] : inTransitFinancial[i],
        onHandInventory: unit === "units" ? onHandUnit[i] : onHandFinancial[i],
        targetInventory: unit === "units" ? targetUnit[i] : targetFinancial[i],
        onHandInventoryDays: onHandDaysUnit[i],
        targetInventoryDays: targetDaysUnit[i],
      })
    }

    return data
  }, [measures, products, filters.product, filters.location, unit, loading, productOptions, locations])

  const handleActionSelect = (recommendationId: string, action: "accepted" | "rejected") => {
    setActioningId(recommendationId)
    setSelectedAction(action)
    if (action === "accepted") {
      const recommendation = activeRecommendations.find((r) => r.id === recommendationId)
      if (recommendation) {
        const completedAction: CompletedAction = {
          ...recommendation,
          action: "accepted",
          timestamp: new Date().toLocaleTimeString(),
        }
        setCompletedActions([...completedActions, completedAction])
        setActiveRecommendations(activeRecommendations.filter((r) => r.id !== recommendationId))
        setActioningId(null)
        setSelectedAction("")
        setActiveTab("actions")
      }
    } else {
      setRejectReason("")
    }
  }

  const handleRejectConfirm = (recommendationId: string) => {
    if (!rejectReason.trim()) return

    const recommendation = activeRecommendations.find((r) => r.id === recommendationId)
    if (recommendation) {
      const action: CompletedAction = {
        ...recommendation,
        action: "rejected",
        reason: rejectReason,
        timestamp: new Date().toLocaleTimeString(),
      }
      setCompletedActions([...completedActions, action])
      setActiveRecommendations(activeRecommendations.filter((r) => r.id !== recommendationId))
      setActioningId(null)
      setSelectedAction("")
      setRejectReason("")
      setActiveTab("actions")
    }
  }

  const handleActionCancel = () => {
    setActioningId(null)
    setSelectedAction("")
    setRejectReason("")
  }

  const handleEditAction = (actionId: string, currentAction: "accepted" | "rejected", currentReason?: string) => {
    setEditingActionId(actionId)
    setEditAction(currentAction)
    setEditReason(currentReason || "")
  }

  const handleEditConfirm = (actionId: string) => {
    if (editAction === "rejected" && !editReason.trim()) return

    setCompletedActions(
      completedActions.map((action) =>
        action.id === actionId
          ? {
              ...action,
              action: editAction as "accepted" | "rejected",
              reason: editAction === "rejected" ? editReason : undefined,
              timestamp: new Date().toLocaleTimeString(),
            }
          : action,
      ),
    )
    setEditingActionId(null)
    setEditAction("")
    setEditReason("")
  }

  const handleEditCancel = () => {
    setEditingActionId(null)
    setEditAction("")
    setEditReason("")
  }

  const handleSegmentClick = (segment: string) => {
    if (selectedSegment === segment) {
      setSelectedSegment(null)
    } else {
      setSelectedSegment(segment)
    }
  }

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
        return "PO"
    }
  }

  const getRecommendationDescription = (rec: Recommendation) => {
    if (rec.type === "purchase-order") {
      return `${rec.partName} - ${rec.quantity} units from ${rec.supplier}`
    } else if (rec.type === "inventory-deficit") {
      return `${rec.partName} - Deficit: ${rec.quantity} units needed`
    } else {
      return `${rec.partName} - Excess: ${rec.quantity} units over target`
    }
  }

  const getExplainability = (rec: Recommendation) => {
    if (rec.type === "inventory-deficit") {
      return `Based on current demand trends and lead times, ${rec.partName} inventory is projected to fall below safety stock levels within the next 2 weeks. Historical data shows a 23% increase in demand for this part, requiring immediate replenishment of ${rec.quantity} units to maintain service levels.`
    } else if (rec.type === "inventory-excess") {
      return `Analysis of the past 90 days shows ${rec.partName} has consistently exceeded target inventory levels by an average of ${rec.quantity} units. Demand forecasts indicate this trend will continue, tying up capital and warehouse space. Consider reducing order quantities or implementing promotional strategies.`
    } else {
      return `Supply chain optimization analysis recommends placing a purchase order for ${rec.quantity} units of ${rec.partName} from ${rec.supplier}. This supplier offers the best combination of price, lead time (7-10 days), and quality ratings (4.8/5.0). Order now to prevent stockouts and maintain optimal inventory levels.`
    }
  }

  const toggleExplainability = (recId: string) => {
    setShowExplainabilityId(showExplainabilityId === recId ? null : recId)
  }

  const getCategoryLabel = (type: RecommendationType) => {
    switch (type) {
      case "inventory-deficit":
        return "Low Inventory Alert"
      case "inventory-excess":
        return "Excess Inventory Alert"
      case "purchase-order":
        return "Purchase Order Required"
    }
  }

  const filteredRecommendations = activeRecommendations.filter((rec) => {
    const severityMatch = severityFilter === "all" || rec.priority === severityFilter
    const themeMatch =
      themeFilter === "all" ||
      (themeFilter === "inventory" && (rec.type === "inventory-deficit" || rec.type === "inventory-excess")) ||
      (themeFilter === "purchase" && rec.type === "purchase-order")
    return severityMatch && themeMatch
  })

  const inventoryAlerts = filteredRecommendations.filter(
    (r) => r.type === "inventory-deficit" || r.type === "inventory-excess",
  )
  const purchaseOrders = filteredRecommendations.filter((r) => r.type === "purchase-order")

  const getWeeksFromTimeRange = (timeRange: string): number => {
    switch (timeRange) {
      case "4w":
        return 4
      case "8w":
        return 8
      case "12w":
        return 12
      case "16w":
        return 16
      case "20w":
        return 20
      default:
        return 20
    }
  }

  const timeRangeWeeks = getWeeksFromTimeRange(filters.timeRange)
  const filteredTimeSeriesData = timeSeriesData.slice(0, timeRangeWeeks)

  const getSupplyRecommendation = (demand: number, scheduledSupply: number, inTransit: number, inventory: number) => {
    const totalAvailable = scheduledSupply + inTransit + inventory
    const gap = demand - totalAvailable

    if (gap > 0) {
      return { value: gap, type: "shortage" as const }
    } else if (gap < -5000) {
      return { value: Math.abs(gap), type: "excess" as const }
    }
    return { value: 0, type: "balanced" as const }
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">Loading supply chain data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-foreground">Supply Chain Trends</CardTitle>
            <Select value={unit} onValueChange={(value) => setUnit(value as "units" | "dollars")}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="units">Units</SelectItem>
                <SelectItem value="dollars">{currencySymbol}</SelectItem>
              </SelectContent>
            </Select>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Customize Metrics</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="demand"
                      checked={visibleMetrics.demand}
                      onCheckedChange={() => toggleMetric("demand")}
                    />
                    <label htmlFor="demand" className="text-sm font-medium leading-none cursor-pointer">
                      Demand
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scheduledSupply"
                      checked={visibleMetrics.scheduledSupply}
                      onCheckedChange={() => toggleMetric("scheduledSupply")}
                    />
                    <label htmlFor="scheduledSupply" className="text-sm font-medium leading-none cursor-pointer">
                      Scheduled Supply
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inTransit"
                      checked={visibleMetrics.inTransit}
                      onCheckedChange={() => toggleMetric("inTransit")}
                    />
                    <label htmlFor="inTransit" className="text-sm font-medium leading-none cursor-pointer">
                      In-Transit
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="targetInventory"
                      checked={visibleMetrics.targetInventory}
                      onCheckedChange={() => toggleMetric("targetInventory")}
                    />
                    <label htmlFor="targetInventory" className="text-sm font-medium leading-none cursor-pointer">
                      Target Inventory
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="targetInventoryDays"
                      checked={visibleMetrics.targetInventoryDays}
                      onCheckedChange={() => toggleMetric("targetInventoryDays")}
                    />
                    <label htmlFor="targetInventoryDays" className="text-sm font-medium leading-none cursor-pointer">
                      Target Inventory (days on hand)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onHandInventory"
                      checked={visibleMetrics.onHandInventory}
                      onCheckedChange={() => toggleMetric("onHandInventory")}
                    />
                    <label htmlFor="onHandInventory" className="text-sm font-medium leading-none cursor-pointer">
                      On Hand Inventory
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onHandInventoryDays"
                      checked={visibleMetrics.onHandInventoryDays}
                      onCheckedChange={() => toggleMetric("onHandInventoryDays")}
                    />
                    <label htmlFor="onHandInventoryDays" className="text-sm font-medium leading-none cursor-pointer">
                      On Hand Inventory (days on hand)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="supplyRecommendations"
                      checked={visibleMetrics.supplyRecommendations}
                      onCheckedChange={() => toggleMetric("supplyRecommendations")}
                    />
                    <label htmlFor="supplyRecommendations" className="text-sm font-medium leading-none cursor-pointer">
                      Supply Recommendations
                    </label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productOpen}
                  className="w-[200px] justify-between h-9 bg-transparent"
                >
                  {productOptions.find((p) => p.value === filters.product)?.label || "Select product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search product..."
                    value={productSearch}
                    onValueChange={setProductSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                      {filteredProductOptions.map((product) => (
                        <CommandItem
                          key={product.value}
                          value={product.value}
                          onSelect={(currentValue) => {
                            setFilters({ ...filters, product: currentValue })
                            setProductOpen(false)
                            setProductSearch("") // Clear search on select
                          }}
                          className={product.type === "product" ? "text-sm" : "font-medium"}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${filters.product === product.value ? "opacity-100" : "opacity-0"}`}
                          />
                          {product.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={locationOpen}
                  className="w-[180px] justify-between h-9 bg-transparent"
                >
                  {locations.find((l) => l.value === filters.location)?.label || "Select location..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-0">
                <Command>
                  <CommandInput placeholder="Search location..." />
                  <CommandList>
                    <CommandEmpty>No location found.</CommandEmpty>
                    <CommandGroup>
                      {locations.map((location) => (
                        <CommandItem
                          key={location.value}
                          value={location.value}
                          onSelect={(currentValue) => {
                            setFilters({ ...filters, location: currentValue })
                            setLocationOpen(false)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${filters.location === location.value ? "opacity-100" : "opacity-0"}`}
                          />
                          {location.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select value={filters.timeRange} onValueChange={(value) => setFilters({ ...filters, timeRange: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4w">Next 4 weeks</SelectItem>
                <SelectItem value="8w">Next 8 weeks</SelectItem>
                <SelectItem value="12w">Next 12 weeks</SelectItem>
                <SelectItem value="16w">Next 16 weeks</SelectItem>
                <SelectItem value="20w">Next 20 weeks</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === "chart" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
                className="h-8 px-3"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "segmentation" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("segmentation")}
                className="h-8 px-3"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-muted/50 p-4 border border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {viewMode === "segmentation" ? (
              selectedSegment ? (
                <>
                  <span className="font-semibold text-foreground">{selectedSegment} Segment Analysis:</span>{" "}
                  {selectedSegment[0] === "A"
                    ? "High-value items requiring close monitoring. "
                    : selectedSegment[0] === "B"
                      ? "Medium-value items with balanced approach. "
                      : "Low-value items suitable for periodic review. "}
                  {selectedSegment[1] === "X"
                    ? "Stable demand pattern allows for optimized inventory levels with minimal safety stock."
                    : selectedSegment[1] === "Y"
                      ? "Variable demand requires dynamic safety stock and flexible replenishment strategies."
                      : "Volatile demand necessitates higher safety stock and frequent monitoring to prevent stockouts."}
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">Segmentation Insights:</span> High-value items (A
                  category) represent 105 SKUs with $5.15M inventory value. AZ segment shows highest risk with $450K
                  replenishment needs due to volatile demand. Focus inventory optimization on AX and BX segments for
                  maximum ROI, while implementing safety stock strategies for volatile Z-category items.
                </>
              )
            ) : viewMode === "table" ? (
              <>
                <span className="font-semibold text-foreground">Forward-Looking Analysis:</span> Projected demand growth
                of 2.7% weekly over the next {timeRangeWeeks} weeks. Inventory levels trending downward, requiring
                proactive supply planning. Multiple weeks show potential shortages where demand exceeds available
                supply. Review supply recommendations to prevent stockouts and optimize inventory levels.
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">Supply Forecast:</span> Forward-looking 20-week
                projection shows steady demand growth with scheduled supply tracking closely. In-transit inventory
                provides buffer, while on-hand inventory requires careful monitoring. Trend lines indicate potential
                capacity constraints in weeks 15-20 requiring advance planning.
              </>
            )}
          </p>
        </div>

        {viewMode === "segmentation" ? (
          <SegmentationMatrix
            selectedSegment={selectedSegment}
            onSegmentClick={handleSegmentClick}
            onSegmentDetails={onSegmentDetails}
          />
        ) : viewMode === "chart" ? (
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={filteredTimeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground" opacity={0.3} />
              <XAxis
                dataKey="week"
                className="text-foreground"
                tick={{ fill: "currentColor", fontSize: 12 }}
                tickLine={{ stroke: "currentColor" }}
                axisLine={{ stroke: "currentColor" }}
              />
              <YAxis
                className="text-foreground"
                tick={{ fill: "currentColor", fontSize: 12 }}
                tickLine={{ stroke: "currentColor" }}
                axisLine={{ stroke: "currentColor" }}
                type="number"
                domain={['dataMin', 'dataMax']}
                allowDecimals={true}
                tickCount={5}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  if (value === 0) return "0"
                  
                  let displayValue = value
                  if (unit === "dollars") {
                    displayValue = value * unitToDollar
                  }
                  
                  // Handle different scales with 1 decimal precision
                  if (Math.abs(displayValue) >= 1000000) {
                    return unit === "dollars" 
                      ? formatCurrency(displayValue / 1000000) + "M"
                      : `${(displayValue / 1000000).toFixed(1)}M`
                  } else if (Math.abs(displayValue) >= 1000) {
                    return unit === "dollars"
                      ? formatCurrency(displayValue / 1000) + "K" 
                      : `${(displayValue / 1000).toFixed(1)}K`
                  } else {
                    return unit === "dollars"
                      ? formatCurrency(displayValue)
                      : displayValue.toFixed(1)
                  }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number) => formatValue(value)}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              {visibleMetrics.demand && (
                <Line type="monotone" dataKey="demand" stroke="#ef4444" strokeWidth={2} name="Demand" dot={false} />
              )}
              {visibleMetrics.scheduledSupply && (
                <Line
                  type="monotone"
                  dataKey="scheduledSupply"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Scheduled Supply"
                  dot={false}
                />
              )}
              {visibleMetrics.inTransit && (
                <Line
                  type="monotone"
                  dataKey="inTransit"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="In-Transit"
                  dot={false}
                />
              )}
              {visibleMetrics.targetInventory && (
                <Line
                  type="monotone"
                  dataKey="targetInventory"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target Inventory"
                  dot={false}
                />
              )}
              {visibleMetrics.targetInventoryDays && (
                <Line
                  type="monotone"
                  dataKey="targetInventoryDays"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target Inventory (days)"
                  dot={false}
                />
              )}
              {visibleMetrics.onHandInventory && (
                <Line
                  type="monotone"
                  dataKey="onHandInventory"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="On Hand Inventory"
                  dot={false}
                />
              )}
              {visibleMetrics.onHandInventoryDays && (
                <Line
                  type="monotone"
                  dataKey="onHandInventoryDays"
                  stroke="#4ade80"
                  strokeWidth={2}
                  name="On Hand Inventory (days)"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-muted z-10 min-w-[120px]">Measures</TableHead>
                  {filteredTimeSeriesData.map((week) => (
                    <TableHead key={week.week} className="text-center min-w-[100px]">
                      <div className="font-semibold">{week.week}</div>
                      <div className="text-xs text-muted-foreground font-normal">{week.date}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMetrics.demand && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted z-10 font-medium">Demand</TableCell>
                    {filteredTimeSeriesData.map((week) => (
                      <TableCell key={week.week} className="text-center">
                        {formatValue(week.demand)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {visibleMetrics.scheduledSupply && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted z-10 font-medium">Scheduled Supply</TableCell>
                    {filteredTimeSeriesData.map((week) => (
                      <TableCell key={week.week} className="text-center">
                        {formatValue(week.scheduledSupply)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {visibleMetrics.inTransit && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted z-10 font-medium">In-Transit</TableCell>
                    {filteredTimeSeriesData.map((week) => (
                      <TableCell key={week.week} className="text-center">
                        {formatValue(week.inTransit)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {visibleMetrics.targetInventory && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted z-10 font-medium">Target Inventory</TableCell>
                    {filteredTimeSeriesData.map((week) => (
                      <TableCell key={week.week} className="text-center text-muted-foreground">
                        {formatValue(week.targetInventory)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {visibleMetrics.targetInventoryDays && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted z-10 font-medium">
                      Target Inventory (days on hand)
                    </TableCell>
                    {filteredTimeSeriesData.map((week) => (
                      <TableCell key={week.week} className="text-center text-muted-foreground">
                        {week.targetInventoryDays} days
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {visibleMetrics.onHandInventory && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted z-10 font-medium">On Hand Inventory</TableCell>
                    {filteredTimeSeriesData.map((week) => {
                      const isBelowTarget = week.onHandInventory < week.targetInventory
                      const difference = week.onHandInventory - week.targetInventory
                      return (
                        <TableCell
                          key={week.week}
                          className={`text-center font-medium ${
                            isBelowTarget ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
                          }`}
                        >
                          <div>{formatValue(week.onHandInventory)}</div>
                          <div className="text-xs mt-0.5">
                            ({isBelowTarget ? "" : "+"}
                            {formatValue(Math.abs(difference))})
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )}
                {visibleMetrics.onHandInventoryDays && (
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted z-10 font-medium">
                      On Hand Inventory (days on hand)
                    </TableCell>
                    {filteredTimeSeriesData.map((week) => {
                      const onHandDays = week.onHandInventoryDays
                      const targetDays = week.targetInventoryDays
                      const isBelowTarget = onHandDays < targetDays
                      const differenceDays = onHandDays - targetDays
                      return (
                        <TableCell
                          key={week.week}
                          className={`text-center font-medium ${
                            isBelowTarget ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
                          }`}
                        >
                          <div>{onHandDays} days</div>
                          <div className="text-xs mt-0.5">
                            ({isBelowTarget ? "" : "+"}
                            {Math.abs(differenceDays).toFixed(1)} days)
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )}
                {visibleMetrics.supplyRecommendations && (
                  <TableRow className="border-t-2">
                    <TableCell className="sticky left-0 bg-muted z-10 font-semibold">Supply Recommendations</TableCell>
                    {filteredTimeSeriesData.map((week) => {
                      const rec = getSupplyRecommendation(
                        week.demand,
                        week.scheduledSupply,
                        week.inTransit,
                        week.onHandInventory,
                      )
                      return (
                        <TableCell
                          key={week.week}
                          className={`text-center font-medium ${
                            rec.type === "shortage"
                              ? "text-red-500 bg-red-500/10"
                              : rec.type === "excess"
                                ? "text-green-500 bg-green-500/10"
                                : ""
                          }`}
                        >
                          {rec.type === "shortage" && `↓ ${formatValue(rec.value)}`}
                          {rec.type === "excess" && `↑ ${formatValue(rec.value)}`}
                          {rec.type === "balanced" && "—"}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {(activeRecommendations.length > 0 || completedActions.length > 0) && (
          <div id="recommendations-section" className="space-y-4">
            <div className="flex items-center gap-6 border-b border-border">
              <button
                onClick={() => setActiveTab("recommendations")}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === "recommendations" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Recommendations
                {activeTab === "recommendations" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("actions")}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === "actions" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Actions
                {activeTab === "actions" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            </div>

            {activeTab === "recommendations" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={themeFilter} onValueChange={setThemeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Themes</SelectItem>
                      <SelectItem value="inventory">Inventory Alerts</SelectItem>
                      <SelectItem value="purchase">Purchase Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inventoryAlerts.length > 0 && (
                  <div className="space-y-3">
                    {inventoryAlerts.map((rec) => (
                      <div key={rec.id} className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                rec.type === "inventory-deficit" ? "bg-red-500/10" : "bg-amber-500/10"
                              }`}
                            >
                              <AlertTriangle
                                className={`h-5 w-5 ${rec.type === "inventory-deficit" ? "text-red-500" : "text-amber-500"}`}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={rec.type === "inventory-deficit" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {getCategoryLabel(rec.type)}
                                </Badge>
                                <Badge
                                  variant={
                                    rec.priority === "high"
                                      ? "destructive"
                                      : rec.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {rec.priority}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-primary/10"
                                  title="View explanation"
                                  onClick={() => toggleExplainability(rec.id)}
                                >
                                  <Sparkles
                                    className={`h-3.5 w-3.5 ${showExplainabilityId === rec.id ? "text-primary fill-primary" : "text-primary"}`}
                                  />
                                </Button>
                              </div>
                              <h4 className="font-semibold text-foreground text-sm mb-1">
                                {getRecommendationDescription(rec)}
                              </h4>
                              <p className="text-xs text-muted-foreground">Generated: {rec.generatedDate}</p>

                              {showExplainabilityId === rec.id && (
                                <div className="mt-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {getExplainability(rec)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {actioningId === rec.id && selectedAction === "rejected" ? (
                            <div className="flex flex-col gap-2 md:w-64">
                              <Input
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="h-9 text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleRejectConfirm(rec.id)}
                                  disabled={!rejectReason.trim()}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 bg-transparent"
                                  onClick={handleActionCancel}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Select
                              onValueChange={(value) => handleActionSelect(rec.id, value as "accepted" | "rejected")}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Take Action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="accepted">Accept</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {purchaseOrders.length > 0 && (
                  <div className="space-y-3">
                    {purchaseOrders.map((rec) => (
                      <div key={rec.id} className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/10">
                              <Package className="h-5 w-5 text-blue-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="default" className="text-xs">
                                  {getCategoryLabel(rec.type)}
                                </Badge>
                                <Badge
                                  variant={
                                    rec.priority === "high"
                                      ? "destructive"
                                      : rec.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {rec.priority}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-primary/10"
                                  title="View explanation"
                                  onClick={() => toggleExplainability(rec.id)}
                                >
                                  <Sparkles
                                    className={`h-3.5 w-3.5 ${showExplainabilityId === rec.id ? "text-primary fill-primary" : "text-primary"}`}
                                  />
                                </Button>
                              </div>
                              <h4 className="font-semibold text-foreground text-sm mb-1">
                                {getRecommendationDescription(rec)}
                              </h4>
                              <p className="text-xs text-muted-foreground">Generated: {rec.generatedDate}</p>

                              {showExplainabilityId === rec.id && (
                                <div className="mt-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {getExplainability(rec)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {actioningId === rec.id && selectedAction === "rejected" ? (
                            <div className="flex flex-col gap-2 md:w-64">
                              <Input
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="h-9 text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleRejectConfirm(rec.id)}
                                  disabled={!rejectReason.trim()}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 bg-transparent"
                                  onClick={handleActionCancel}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Select
                              onValueChange={(value) => handleActionSelect(rec.id, value as "accepted" | "rejected")}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Take Action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="accepted">Accept</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredRecommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recommendations match the selected filters.
                  </div>
                )}
              </div>
            )}

            {activeTab === "actions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Completed Actions</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Action
                  </Button>
                </div>

                <div className="space-y-3">
                  {completedActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                      {editingActionId === action.id ? (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm text-foreground font-medium">
                                {action.type === "purchase-order"
                                  ? `Order ${action.quantity} units of ${action.partName} from ${action.supplier}`
                                  : action.type === "inventory-deficit"
                                    ? `Address deficit: ${action.partName} - ${action.quantity} units needed`
                                    : `Reduce excess: ${action.partName} - ${action.quantity} units over target`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Select
                              value={editAction}
                              onValueChange={(value) => {
                                setEditAction(value as "accepted" | "rejected")
                                if (value === "accepted") {
                                  setEditReason("")
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="accepted">Accept</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                              </SelectContent>
                            </Select>

                            {editAction === "rejected" && (
                              <Input
                                placeholder="Enter reason for rejection..."
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                className="h-9 text-sm"
                              />
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1"
                                onClick={() => handleEditConfirm(action.id)}
                                disabled={editAction === "rejected" && !editReason.trim()}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-transparent"
                                onClick={handleEditCancel}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm text-foreground font-medium">
                                {action.type === "purchase-order"
                                  ? `Order ${action.quantity} units of ${action.partName} from ${action.supplier}`
                                  : action.type === "inventory-deficit"
                                    ? `Address deficit: ${action.partName} - ${action.quantity} units needed`
                                    : `Reduce excess: ${action.partName} - ${action.quantity} units over target`}
                              </p>
                              {action.reason && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-medium">Rejection reason:</span> {action.reason}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={action.action === "accepted" ? "default" : "destructive"}
                                className="capitalize shrink-0"
                              >
                                {action.action === "accepted" ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Accepted
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Rejected
                                  </>
                                )}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleEditAction(action.id, action.action, action.reason)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getBadgeLabel(action.type)}
                              </Badge>
                              <span>Generated: {action.generatedDate}</span>
                            </div>
                            <span>Actioned: {action.timestamp}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {completedActions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No actions yet. Accept or reject recommendations to see them here.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
