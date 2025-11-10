"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Warehouse,
  Plus,
  X,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import { useCurrency } from "@/lib/currency-context"
import { useData } from "@/lib/data-context"
import { getProductFamilies } from "@/lib/data-loader"

import { ICON_MAP } from "@/lib/constants"

interface MetricsCardsProps {
  selectedSegment: string | null
  filters: {
    product: string
    location: string
    timeRange: string
  }
  setFilters: (filters: any) => void
}

export function MetricsCards({ selectedSegment, filters, setFilters }: MetricsCardsProps) {
  const [visibleMetricIds, setVisibleMetricIds] = useState<string[]>(["demand", "inventory", "stockouts", "excess"])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [unit, setUnit] = useState<"units" | "$">("units")
  const [productOpen, setProductOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [productSearch, setProductSearch] = useState("")

  const { formatCurrency, currency } = useCurrency()
  const { metrics, products, measures, loading } = useData()

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹"

  const productOptions = useMemo(() => {
    const families = getProductFamilies(products)
    const options: { value: string; label: string; type: "family" | "product" }[] = []

    options.push({ value: "All Products", label: "All Products", type: "family" })

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
      return productOptions.filter((opt) => opt.type === "family")
    }
    const searchLower = productSearch.toLowerCase()
    return productOptions.filter((opt) => opt.label.toLowerCase().includes(searchLower))
  }, [productOptions, productSearch])

  const locations = [
    { value: "All Locations", label: "All Locations" },
    ...Array.from(new Set(measures.map((m) => m.location_id)))
      .sort()
      .map((loc) => ({ value: loc, label: loc })),
  ]

  useEffect(() => {
    if (selectedSegment) {
      setVisibleMetricIds(["inventory", "excess", "deficit", "replenishment"])
    } else {
      setVisibleMetricIds(["demand", "inventory", "stockouts", "excess"])
    }
  }, [selectedSegment])

  const formatMetricValue = (metricId: string, value: number) => {
    if (metricId === "fillrate" || metricId === "ontime") {
      return `${value.toFixed(1)}%`
    } else if (metricId === "leadtime") {
      return `${value.toFixed(1)}d`
    } else if (metricId === "turns") {
      return `${value.toFixed(1)}x`
    }

    if (unit === "$") {
      return formatCurrency(value)
    } else {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`
      }
      return value.toString()
    }
  }

  const getMetricValue = (metricId: string) => {
    const metricData = metrics.find((m) => m.metric_id === metricId)
    if (!metricData) return null

    const Icon = ICON_MAP[metricId] || Package

    const currentValue = unit === "units" ? metricData.unit_value : metricData.financial_value

    const priorValue = currentValue * 0.9
    const change = ((currentValue - priorValue) / priorValue) * 100

    return {
      id: metricId,
      title: metricData.metric_name,
      value: formatMetricValue(metricId, currentValue),
      icon: Icon,
      change: change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`,
      trend: change >= 0 ? "up" : "down",
      description: metricData.metric_name,
    }
  }

  const allMetrics = metrics.map((m) => ({
    id: m.metric_id,
    title: m.metric_name,
    value: unit === "units" ? m.unit_value : m.financial_value,
    icon: ICON_MAP[m.metric_id] || Package,
    description: m.metric_name,
  }))

  const visibleMetrics = visibleMetricIds.map((id) => getMetricValue(id)).filter(Boolean) as any[]
  const availableMetrics = allMetrics.filter((m) => !visibleMetricIds.includes(m.id))

  const addMetric = (metricId: string) => {
    setVisibleMetricIds([...visibleMetricIds, metricId])
    setIsPopoverOpen(false)
  }

  const removeMetric = (metricId: string) => {
    setVisibleMetricIds(visibleMetricIds.filter((id) => id !== metricId))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Key Metrics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Key Metrics</h2>
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={productOpen}
                className="w-[180px] justify-between h-9 bg-transparent"
              >
                {productOptions.find((p) => p.value === filters.product)?.label || "Select product..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0">
              <Command>
                <CommandInput placeholder="Search product..." value={productSearch} onValueChange={setProductSearch} />
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
                          setProductSearch("")
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

          <Select value={unit} onValueChange={(value: "units" | "$") => setUnit(value)}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="units">Units</SelectItem>
              <SelectItem value="$">{currencySymbol}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {availableMetrics.length > 0 && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Metric
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">Available Metrics</p>
                {availableMetrics.map((metric) => {
                  const Icon = metric.icon
                  return (
                    <Button
                      key={metric.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-auto py-2"
                      onClick={() => addMetric(metric.id)}
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{metric.title}</span>
                        <span className="text-xs text-muted-foreground">{metric.description}</span>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleMetrics.map((metric) => {
          const Icon = metric.icon
          const isPositive = metric.trend === "up"

          return (
            <Card
              key={metric.id}
              className="bg-card border-border hover:border-primary/50 transition-colors relative group"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMetric(metric.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-foreground mb-1">{metric.value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-chart-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn("text-sm font-medium", isPositive ? "text-chart-4" : "text-destructive")}>
                    {metric.change}
                  </span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
