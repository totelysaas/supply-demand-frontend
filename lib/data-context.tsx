"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  loadMetrics,
  loadMeasures,
  loadProducts,
  loadRecommendations,
  loadSegmentation,
  loadRecommendationMappings,
  type MetricData,
  type MeasureData,
  type ProductMapping,
  type RecommendationData,
  type SegmentationData,
  type RecommendationMapping,
} from "./data-loader"

interface DataContextType {
  metrics: MetricData[]
  measures: MeasureData[]
  products: ProductMapping[]
  recommendations: RecommendationData[]
  segmentation: SegmentationData[]
  recommendationMappings: RecommendationMapping[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  dataSource: { type: "local" | "s3"; bucket?: string; folder?: string } | null
  reloadData: () => Promise<void>
  updateRecommendation: (recommendation: RecommendationData) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [measures, setMeasures] = useState<MeasureData[]>([])
  const [products, setProducts] = useState<ProductMapping[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([])
  const [segmentation, setSegmentation] = useState<SegmentationData[]>([])
  const [recommendationMappings, setRecommendationMappings] = useState<RecommendationMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dataSource, setDataSource] = useState<{ type: "local" | "s3"; bucket?: string; folder?: string } | null>(null)

  const getRecommendationUpdates = (): Record<string, Partial<RecommendationData>> => {
    if (typeof window === "undefined") return {}
    const stored = localStorage.getItem("recommendationUpdates")
    return stored ? JSON.parse(stored) : {}
  }

  const saveRecommendationUpdate = (id: string, updates: Partial<RecommendationData>) => {
    if (typeof window === "undefined") return
    const current = getRecommendationUpdates()
    current[id] = { ...current[id], ...updates }
    localStorage.setItem("recommendationUpdates", JSON.stringify(current))
  }

  const updateRecommendation = (recommendation: RecommendationData) => {
    // Update local state
    setRecommendations((prev) => prev.map((r) => (r.id === recommendation.id ? recommendation : r)))

    // Save to localStorage for persistence
    saveRecommendationUpdate(recommendation.id, recommendation)
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const cloudMode = typeof window !== "undefined" ? localStorage.getItem("cloudMode") === "true" : false
      const s3FolderPath = typeof window !== "undefined" ? localStorage.getItem("s3FolderPath") : null

      const [metricsData, measuresData, productsData, recommendationsData, segmentationData, mappingsData] =
        await Promise.all([
          loadMetrics(),
          loadMeasures(),
          loadProducts(),
          loadRecommendations(),
          loadSegmentation(),
          loadRecommendationMappings(),
        ])

      setMetrics(metricsData)
      setMeasures(measuresData)
      setProducts(productsData)

      const updates = getRecommendationUpdates()
      const mergedRecommendations = recommendationsData.map((rec) => {
        if (updates[rec.id]) {
          return { ...rec, ...updates[rec.id] }
        }
        return rec
      })
      setRecommendations(mergedRecommendations)

      setSegmentation(segmentationData)
      setRecommendationMappings(mappingsData)
      setError(null)

      setLastUpdated(new Date())
      setDataSource(
        cloudMode && s3FolderPath
          ? { type: "s3", bucket: "supply-demand-inventory-1762030832", folder: s3FolderPath }
          : { type: "local" },
      )
    } catch (err) {
      console.error("[v0] Error loading data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load data"
      setError(errorMessage)
      if (typeof window !== "undefined") {
        setTimeout(() => {
          alert(`Error loading data: ${errorMessage}`)
        }, 100)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cloudMode") {
        console.log("[v0] Cloud mode changed, reloading data")
        loadAllData()
      }
    }

    const handleCustomEvent = () => {
      console.log("[v0] Custom data reload event received")
      loadAllData()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("reloadData", handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("reloadData", handleCustomEvent)
    }
  }, [])

  return (
    <DataContext.Provider
      value={{
        metrics,
        measures,
        products,
        recommendations,
        segmentation,
        recommendationMappings,
        loading,
        error,
        lastUpdated,
        dataSource,
        reloadData: loadAllData,
        updateRecommendation,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
