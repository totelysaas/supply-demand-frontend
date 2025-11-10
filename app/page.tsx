"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricsCards } from "@/components/metrics-cards"
import { TrendingCharts } from "@/components/trending-charts"
import { FloatingChat } from "@/components/floating-chat"
import { SegmentDetailsModal } from "@/components/segment-details-modal"
import { CurrencyProvider } from "@/lib/currency-context"
import { DataProvider } from "@/lib/data-context"
import { RecommendationsSection } from "@/components/recommendations-section"

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"chart" | "table" | "segmentation">("chart")
  const [filters, setFilters] = useState({
    product: "All Products",
    location: "All Locations", 
    timeRange: "20w",
  })
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSegment, setModalSegment] = useState<string | null>(null)

  const handleSegmentDetails = (segment: string) => {
    setModalSegment(segment)
    setModalOpen(true)
  }

  return (
    <DataProvider>
      <CurrencyProvider>
        <div className="min-h-screen bg-background">
          <DashboardHeader />

          <main className="container mx-auto px-4 py-6 space-y-6">
            <MetricsCards selectedSegment={selectedSegment} filters={filters} setFilters={setFilters} />

            <TrendingCharts
              viewMode={viewMode}
              setViewMode={setViewMode}
              filters={filters}
              setFilters={setFilters}
              selectedSegment={selectedSegment}
              setSelectedSegment={setSelectedSegment}
              onSegmentDetails={handleSegmentDetails}
            />

            <RecommendationsSection />
          </main>

          <FloatingChat />

          <SegmentDetailsModal open={modalOpen} onOpenChange={setModalOpen} segment={modalSegment} totalItems={0} />
        </div>
      </CurrencyProvider>
    </DataProvider>
  )
}
