"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const generateSegmentItems = (segment: string, totalItems: number) => {
  const items = []
  const locations = ["Warehouse A", "Warehouse B", "Warehouse C", "Distribution Center 1", "Distribution Center 2"]
  const [abc, xyz] = segment.split("")

  for (let i = 0; i < totalItems; i++) {
    const hasExcess = Math.random() > 0.6
    const hasStockout = !hasExcess && Math.random() > 0.7
    const safetyStockQty = Math.floor(Math.random() * 500) + 100
    const currentInventory = Math.floor(Math.random() * 1000) + 50
    const excessAmount = hasExcess ? Math.floor(Math.random() * 200) + 50 : 0
    const stockoutAmount = hasStockout ? Math.floor(Math.random() * 150) + 30 : 0
    const replenishmentAmount = hasStockout ? stockoutAmount + safetyStockQty : Math.floor(Math.random() * 300)

    items.push({
      id: `PART-${segment}-${String(i + 1).padStart(5, "0")}`,
      partNumber: `${segment}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      abc,
      xyz,
      safetyStockQty,
      safetyStockWeeks: (safetyStockQty / (currentInventory / 4)).toFixed(1),
      currentInventory,
      excessAmount,
      stockoutAmount,
      replenishmentAmount,
    })
  }
  return items
}

interface SegmentDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segment: string | null
  totalItems: number
}

export function SegmentDetailsModal({ open, onOpenChange, segment, totalItems }: SegmentDetailsModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const allItems = useMemo(() => {
    if (!segment) return []
    return generateSegmentItems(segment, totalItems)
  }, [segment, totalItems])

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems
    const query = searchQuery.toLowerCase()
    return allItems.filter(
      (item) =>
        item.partNumber.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query),
    )
  }, [allItems, searchQuery])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value)
  }

  if (!segment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Segment {segment} Details
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredItems.length.toLocaleString()} items)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by part number, location, or ID..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[140px]">Part Number</TableHead>
                <TableHead className="w-[160px]">Location</TableHead>
                <TableHead className="w-[80px] text-center">ABC</TableHead>
                <TableHead className="w-[80px] text-center">XYZ</TableHead>
                <TableHead className="w-[120px] text-right">Safety Stock (Qty)</TableHead>
                <TableHead className="w-[120px] text-right">Safety Stock (Weeks)</TableHead>
                <TableHead className="w-[120px] text-right">Current Inventory</TableHead>
                <TableHead className="w-[120px] text-right">Excess</TableHead>
                <TableHead className="w-[120px] text-right">Stockout</TableHead>
                <TableHead className="w-[120px] text-right">Replenishment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                  <TableCell className="text-sm">{item.location}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-semibold">
                      {item.abc}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-semibold">
                      {item.xyz}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNumber(item.safetyStockQty)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.safetyStockWeeks}w</TableCell>
                  <TableCell className="text-right font-medium">{formatNumber(item.currentInventory)}</TableCell>
                  <TableCell className="text-right">
                    {item.excessAmount > 0 ? (
                      <span className="text-red-500 font-medium">{formatNumber(item.excessAmount)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.stockoutAmount > 0 ? (
                      <span className="text-amber-500 font-medium">{formatNumber(item.stockoutAmount)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-blue-500 font-medium">{formatNumber(item.replenishmentAmount)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage + 1).toLocaleString()} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredItems.length).toLocaleString()} of{" "}
            {filteredItems.length.toLocaleString()} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
