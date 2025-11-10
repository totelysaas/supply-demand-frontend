"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SegmentDetailsModal } from "@/components/segment-details-modal"
import { cn } from "@/lib/utils"
import { Info, Pencil } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"
import { useData } from "@/lib/data-context"
import { aggregateSegmentation } from "@/lib/data-loader"

const segmentDescriptions: Record<string, string> = {
  AX: "Lean inventory - high value meets predictability",
  AY: "Dynamic planning - valuable but variable",
  AZ: "Strategic buffer - protect critical revenue",
  BX: "Automated control - reliable mid-tier performers",
  BY: "Flexible response - adapt to moderate swings",
  BZ: "Balanced approach - mitigate uncertainty carefully",
  CX: "Bulk simplicity - cheap and steady",
  CY: "Liberal stock - low cost, moderate variability",
  CZ: "Accept risk - not worth the complexity",
}

const abcDescriptions: Record<string, string> = {
  A: "Top 80% of Sales",
  B: "80-95% of Sales",
  C: "Bottom 5% of Sales",
}

const xyzDescriptions: Record<string, string> = {
  X: "Demand Variation <20%",
  Y: "Demand Variation = 20% - 50%",
  Z: "Demand Variation > 50%",
}

const getSegmentColor = (abc: string, xyz: string) => {
  if (abc === "A" && xyz === "X") return "bg-green-500/10 border-green-500/30"
  if (abc === "A" && xyz === "Y") return "bg-yellow-500/10 border-yellow-500/30"
  if (abc === "A" && xyz === "Z") return "bg-red-500/10 border-red-500/30"
  if (abc === "B" && xyz === "X") return "bg-green-500/5 border-green-500/20"
  if (abc === "B" && xyz === "Y") return "bg-yellow-500/5 border-yellow-500/20"
  if (abc === "B" && xyz === "Z") return "bg-red-500/5 border-red-500/20"
  return "bg-muted/30 border-border"
}

interface SegmentationMatrixProps {
  selectedSegment: string | null
  onSegmentClick: (segment: string) => void
  onSegmentDetails?: (segment: string) => void
}

export function SegmentationMatrix({ selectedSegment, onSegmentClick, onSegmentDetails }: SegmentationMatrixProps) {
  const { formatCurrency } = useCurrency()

  const { segmentation, products, loading } = useData()

  // Helper function to format values, showing "-" for zero/empty values
  const formatValue = (value: number, isCurrency = false): string => {
    if (value === 0) return "-"
    return isCurrency ? formatCurrency(value) : value.toString()
  }

  // Helper function to format items count
  const formatItems = (count: number): string => {
    if (count === 0) return "- items"
    return `${count} items`
  }

  const segmentationData = useMemo(() => {
    if (loading || segmentation.length === 0) return []

    const aggregated = aggregateSegmentation(segmentation, products, "All Products")

    const result = []
    for (const [key, value] of aggregated.entries()) {
      const abc = key[0] as "A" | "B" | "C"
      const xyz = key[1] as "X" | "Y" | "Z"

      const avgWeeklyCost = value.currentFinancial / 4

      result.push({
        abc,
        xyz,
        items: value.items,
        inventoryValue: value.currentFinancial,
        excessInventory: Math.max(0, value.currentFinancial - value.targetFinancial),
        stockout: 0,
        replenishment: Math.max(0, value.targetFinancial - value.currentFinancial),
        currentInventoryWeeks: value.items > 0 ? Math.round(value.currentDays) : 0,
        targetInventoryWeeks: value.items > 0 ? Math.round(value.targetDays) : 0,
        avgWeeklyCost,
      })
    }

    return result
  }, [segmentation, products, loading])

  const [targetLevels, setTargetLevels] = useState<Record<string, number>>(
    segmentationData.reduce(
      (acc, seg) => {
        acc[`${seg.abc}${seg.xyz}`] = seg.targetInventoryWeeks
        return acc
      },
      {} as Record<string, number>,
    ),
  )

  const [editingSegment, setEditingSegment] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [unitOfMeasure, setUnitOfMeasure] = useState<Record<string, "days" | "quantity">>(
    segmentationData.reduce(
      (acc, seg) => {
        acc[`${seg.abc}${seg.xyz}`] = "days"
        return acc
      },
      {} as Record<string, "days" | "quantity">,
    ),
  )
  const [editUnit, setEditUnit] = useState<"days" | "quantity">("days")

  const [itemsModalSegment, setItemsModalSegment] = useState<string | null>(null)
  const [itemsModalCount, setItemsModalCount] = useState<number>(0)

  const handleSegmentClick = (segmentKey: string) => {
    onSegmentClick(segmentKey)
  }

  const handleEditClick = (e: React.MouseEvent, segmentKey: string) => {
    e.stopPropagation()
    setEditingSegment(segmentKey)
    setEditValue(targetLevels[segmentKey] || 0)
    setEditUnit(unitOfMeasure[segmentKey] || "days")
  }

  const handleItemsClick = (e: React.MouseEvent, segmentKey: string, itemCount: number) => {
    e.stopPropagation()
    setItemsModalSegment(segmentKey)
    setItemsModalCount(itemCount)
  }

  const handleSaveEdit = () => {
    if (editingSegment) {
      setTargetLevels((prev) => ({ ...prev, [editingSegment]: editValue }))
      setUnitOfMeasure((prev) => ({ ...prev, [editingSegment]: editUnit }))
      setEditingSegment(null)
    }
  }

  const getCurrentInventoryValue = (segment: (typeof segmentationData)[0]) => {
    return segment.currentInventoryWeeks * segment.avgWeeklyCost
  }

  const getSegmentsInOrder = (abc: "A" | "B" | "C") => {
    const xyzOrder = ["X", "Y", "Z"]
    const segments = segmentationData.filter((d) => d.abc === abc)

    // Sort segments by XYZ value to ensure X, Y, Z column order
    return xyzOrder.map((xyz) => {
      return segments.find((seg) => seg.xyz === xyz) || null
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-center text-muted-foreground py-8">Loading segmentation data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">ABC-XYZ Segmentation Analysis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Strategic SKU classification combining sales financial contribution and demand variability
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="grid gap-2" style={{ gridTemplateColumns: "auto 1fr 1fr 1fr" }}>
          <div className="flex items-center justify-center h-12"></div>
          <div className="flex flex-col items-center justify-center h-12 space-y-0.5">
            <div className="font-semibold text-foreground text-sm">
              X<span className="text-xs text-muted-foreground ml-1">(Stable)</span>
            </div>
            <div className="text-[10px] text-muted-foreground text-center leading-tight">{xyzDescriptions.X}</div>
          </div>
          <div className="flex flex-col items-center justify-center h-12 space-y-0.5">
            <div className="font-semibold text-foreground text-sm">
              Y<span className="text-xs text-muted-foreground ml-1">(Variable)</span>
            </div>
            <div className="text-[10px] text-muted-foreground text-center leading-tight">{xyzDescriptions.Y}</div>
          </div>
          <div className="flex flex-col items-center justify-center h-12 space-y-0.5">
            <div className="font-semibold text-foreground text-sm">
              Z<span className="text-xs text-muted-foreground ml-1">(Volatile)</span>
            </div>
            <div className="text-[10px] text-muted-foreground text-center leading-tight">{xyzDescriptions.Z}</div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-[80px]">
            <div className="font-semibold text-foreground text-sm">
              A<span className="text-xs text-muted-foreground ml-1">(High)</span>
            </div>
            <div className="text-[10px] text-muted-foreground text-center leading-tight px-2">{abcDescriptions.A}</div>
          </div>
          {getSegmentsInOrder("A").map((segment, index) => {
            if (!segment) {
              return <div key={`A-${index}`} className="min-h-[120px]" />
            }

            const segmentKey = `${segment.abc}${segment.xyz}`
            const isSelected = selectedSegment === segmentKey
            const targetWeeks = targetLevels[segmentKey] || segment.targetInventoryWeeks
            const targetValue = targetWeeks * segment.avgWeeklyCost
            const currentValue = getCurrentInventoryValue(segment)

            return (
              <Card
                key={segmentKey}
                onClick={() => handleSegmentClick(segmentKey)}
                className={cn(
                  "border-2 hover:shadow-md transition-all cursor-pointer",
                  getSegmentColor(segment.abc, segment.xyz),
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <CardContent className="p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-foreground">{segmentKey}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-xs" side="top">
                          {segmentDescriptions[segmentKey]}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleItemsClick(e, segmentKey, segment.items)}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        {segment.items} items
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => handleEditClick(e, segmentKey)}
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs border-t border-border pt-1.5">
                    <div>
                      <div className="text-muted-foreground mb-0.5">Current Inventory:</div>
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-medium text-foreground">{formatCurrency(currentValue)}</span>
                        <span className="text-muted-foreground">{segment.currentInventoryWeeks} days</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Target Inventory:</div>
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-medium text-blue-600">{formatCurrency(targetValue)}</span>
                        <span className="text-muted-foreground">
                          {targetWeeks} {unitOfMeasure[segmentKey] === "days" ? "days" : "units"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-[80px]">
            <div className="font-semibold text-foreground text-sm">
              B<span className="text-xs text-muted-foreground ml-1">(Medium)</span>
            </div>
            <div className="text-[10px] text-muted-foreground text-center leading-tight px-2">{abcDescriptions.B}</div>
          </div>
          {getSegmentsInOrder("B").map((segment, index) => {
            if (!segment) {
              return <div key={`B-${index}`} className="min-h-[120px]" />
            }

            const segmentKey = `${segment.abc}${segment.xyz}`
            const isSelected = selectedSegment === segmentKey
            const targetWeeks = targetLevels[segmentKey] || segment.targetInventoryWeeks
            const targetValue = targetWeeks * segment.avgWeeklyCost
            const currentValue = getCurrentInventoryValue(segment)

            return (
              <Card
                key={segmentKey}
                onClick={() => handleSegmentClick(segmentKey)}
                className={cn(
                  "border-2 hover:shadow-md transition-all cursor-pointer",
                  getSegmentColor(segment.abc, segment.xyz),
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <CardContent className="p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-foreground">{segmentKey}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-xs" side="top">
                          {segmentDescriptions[segmentKey]}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleItemsClick(e, segmentKey, segment.items)}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        {segment.items} items
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => handleEditClick(e, segmentKey)}
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs border-t border-border pt-1.5">
                    <div>
                      <div className="text-muted-foreground mb-0.5">Current Inventory:</div>
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-medium text-foreground">{formatCurrency(currentValue)}</span>
                        <span className="text-muted-foreground">{segment.currentInventoryWeeks} days</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Target Inventory:</div>
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-medium text-blue-600">{formatCurrency(targetValue)}</span>
                        <span className="text-muted-foreground">
                          {targetWeeks} {unitOfMeasure[segmentKey] === "days" ? "days" : "units"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-[80px]">
            <div className="font-semibold text-foreground text-sm">
              C<span className="text-xs text-muted-foreground ml-1">(Low)</span>
            </div>
            <div className="text-[10px] text-muted-foreground text-center leading-tight px-2">{abcDescriptions.C}</div>
          </div>
          {getSegmentsInOrder("C").map((segment, index) => {
            if (!segment) {
              return <div key={`C-${index}`} className="min-h-[120px]" />
            }

            const segmentKey = `${segment.abc}${segment.xyz}`
            const isSelected = selectedSegment === segmentKey
            const targetWeeks = targetLevels[segmentKey] || segment.targetInventoryWeeks
            const targetValue = targetWeeks * segment.avgWeeklyCost
            const currentValue = getCurrentInventoryValue(segment)

            return (
              <Card
                key={segmentKey}
                onClick={() => handleSegmentClick(segmentKey)}
                className={cn(
                  "border-2 hover:shadow-md transition-all cursor-pointer",
                  getSegmentColor(segment.abc, segment.xyz),
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <CardContent className="p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-foreground">{segmentKey}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-xs" side="top">
                          {segmentDescriptions[segmentKey]}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleItemsClick(e, segmentKey, segment.items)}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        {segment.items} items
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => handleEditClick(e, segmentKey)}
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs border-t border-border pt-1.5">
                    <div>
                      <div className="text-muted-foreground mb-0.5">Current Inventory:</div>
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-medium text-foreground">{formatCurrency(currentValue)}</span>
                        <span className="text-muted-foreground">{segment.currentInventoryWeeks} days</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Target Inventory:</div>
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-medium text-blue-600">{formatCurrency(targetValue)}</span>
                        <span className="text-muted-foreground">
                          {targetWeeks} {unitOfMeasure[segmentKey] === "days" ? "days" : "units"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={editingSegment !== null} onOpenChange={(open) => !open && setEditingSegment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Target Inventory - {editingSegment}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target Value</label>
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(Number.parseFloat(e.target.value) || 0)}
                step="0.5"
                min="0"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Unit of Measure</label>
              <Select value={editUnit} onValueChange={(value: "days" | "quantity") => setEditUnit(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days on Hand</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSegment(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SegmentDetailsModal
        open={itemsModalSegment !== null}
        onOpenChange={(open) => !open && setItemsModalSegment(null)}
        segment={itemsModalSegment}
        totalItems={itemsModalCount}
      />
    </div>
  )
}
