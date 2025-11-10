// CSV data loading utilities for the dashboard

export interface MetricData {
  metric_id: string
  metric_name: string
  unit_value: number
  financial_value: number
}

export interface MeasureData {
  measure_id: string
  measure_name: string
  product_id: string
  location_id: string
  weeks: number[] // w1 through w20
}

export interface ProductMapping {
  product_family: string
  product_id: string
}

export interface RecommendationData {
  id: string
  source: "recommendation" | "user_created_action"
  name: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "accepted" | "rejected"
  action_status?: "scheduled" | "in_progress" | "completed"
  start_date?: string
  completion_date?: string
  created_date?: string
}

export interface RecommendationMapping {
  recommendation_id: string
  display_name: string
}

export interface SegmentationData {
  product_id: string
  ABC_value: "A" | "B" | "C"
  XYZ_value: "X" | "Y" | "Z"
  on_hand_inventory_unit: number
  on_hand_inventory_financial: number
  target_inventory_unit: number
  target_inventory_financial: number
  on_hand_inventory_days: number
  target_inventory_days: number
}

// CSV parser
function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split("\n")
  return lines.map((line) => {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  })
}

import { loadDataFromS3 } from "./api-client"

// Generic CSV data loader
async function loadCSVData(filename: string): Promise<string> {
  const cloudMode = typeof window !== "undefined" && localStorage.getItem("cloudMode") === "true"
  const s3FolderPath = typeof window !== "undefined" && localStorage.getItem("s3FolderPath")

  console.log(`[v0] Loading ${filename} - cloudMode:`, cloudMode, "s3FolderPath:", s3FolderPath)

  if (cloudMode && s3FolderPath) {
    console.log(`[v0] Fetching ${filename} from S3 folder:`, s3FolderPath)
    const result = await loadDataFromS3(s3FolderPath)
    if (!result.success || !result.files) {
      console.error(`[v0] S3 load failed for ${filename}:`, result.error)
      throw new Error(result.error || "Failed to load from S3")
    }
    const file = result.files.find((f) => f.name === filename)
    if (!file) {
      console.error(`[v0] ${filename} not found in S3 data`)
      throw new Error(`${filename} not found in S3 data`)
    }
    console.log(`[v0] Successfully loaded ${filename} from S3, size:`, file.content.length)
    return file.content
  } else {
    console.log(`[v0] Fetching ${filename} from local data`)
    const response = await fetch(`/local_data/${filename}`)
    const text = await response.text()
    console.log(`[v0] Successfully loaded ${filename} from local, size:`, text.length)
    return text
  }
}

// Load metrics data
export async function loadMetrics(): Promise<MetricData[]> {
  try {
    const text = await loadCSVData("metrics.csv")
    const rows = parseCSV(text)
    
    return rows.slice(1).map((row) => ({
      metric_id: row[0],
      metric_name: row[1],
      unit_value: Number.parseFloat(row[2]),
      financial_value: Number.parseFloat(row[3]),
    }))
  } catch (error) {
    console.error("[v0] Error loading metrics:", error)
    return []
  }
}

// Load measures data
export async function loadMeasures(): Promise<MeasureData[]> {
  try {
    const text = await loadCSVData("measures.csv")
    const rows = parseCSV(text)
    
    return rows.slice(1).map((row) => ({
      measure_id: row[0],
      measure_name: row[1],
      product_id: row[2],
      location_id: row[3],
      weeks: row.slice(4, 24).map((val) => Number.parseFloat(val) || 0),
    }))
  } catch (error) {
    console.error("[v0] Error loading measures:", error)
    return []
  }
}

// Load product mappings
export async function loadProducts(): Promise<ProductMapping[]> {
  try {
    const text = await loadCSVData("products.csv")
    const rows = parseCSV(text)

    return rows.slice(1).map((row) => ({
      product_family: row[0],
      product_id: row[1],
    }))
  } catch (error) {
    console.error("[v0] Error loading products:", error)
    return []
  }
}

// Load recommendations
export async function loadRecommendations(): Promise<RecommendationData[]> {
  try {
    const text = await loadCSVData("recommendations.csv")
    const rows = parseCSV(text)

    return rows.slice(1).map((row) => ({
      id: row[0],
      source: (row[1] as "recommendation" | "user_created_action") || "recommendation",
      name: row[2],
      type: row[3],
      severity: (row[4] as "low" | "medium" | "high" | "critical") || "medium",
      status: (row[5] as "open" | "accepted" | "rejected") || "open",
      action_status: row[6] as "scheduled" | "in_progress" | "completed" | undefined,
      start_date: row[7] || undefined,
      completion_date: row[8] || undefined,
      created_date: row[9] || undefined,
    }))
  } catch (error) {
    console.error("[v0] Error loading recommendations:", error)
    return []
  }
}

// Load segmentation data
export async function loadSegmentation(): Promise<SegmentationData[]> {
  try {
    const text = await loadCSVData("segmentation.csv")
    const rows = parseCSV(text)

    return rows.slice(1).map((row) => ({
      product_id: row[0],
      ABC_value: (row[1] as "A" | "B" | "C") || "A",
      XYZ_value: (row[2] as "X" | "Y" | "Z") || "X",
      on_hand_inventory_unit: Number.parseFloat(row[3]) || 0,
      on_hand_inventory_financial: Number.parseFloat(row[4]) || 0,
      target_inventory_unit: Number.parseFloat(row[5]) || 0,
      target_inventory_financial: Number.parseFloat(row[6]) || 0,
      on_hand_inventory_days: Number.parseFloat(row[7]) || 0,
      target_inventory_days: Number.parseFloat(row[8]) || 0,
    }))
  } catch (error) {
    console.error("[v0] Error loading segmentation:", error)
    return []
  }
}

export async function loadRecommendationMappings(): Promise<RecommendationMapping[]> {
  try {
    const text = await loadCSVData("recommendations_mapping.csv")
    const rows = parseCSV(text)

    return rows.slice(1).map((row) => ({
      recommendation_id: row[0],
      display_name: row[1],
    }))
  } catch (error) {
    console.error("[v0] Error loading recommendation mappings:", error)
    return []
  }
}

// Utility functions
export function filterProductsByFamily(products: ProductMapping[], family: string): string[] {
  if (!Array.isArray(products)) return []
  if (family === "All Products" || family === "all") {
    return products.map((p) => p.product_id)
  }
  return products.filter((p) => p.product_family === family).map((p) => p.product_id)
}

export function getProductFamilies(products: ProductMapping[]): string[] {
  if (!Array.isArray(products)) return []
  return [...new Set(products.map((p) => p.product_family))].sort()
}

export function getLocations(measures: MeasureData[]): string[] {
  if (!Array.isArray(measures)) return []
  return [...new Set(measures.map((m) => m.location_id))].sort()
}

export function aggregateSegmentation(
  segmentation: SegmentationData[],
  products: ProductMapping[],
  productFamily: string,
): Map<
  string,
  { items: number; currentUnit: number; currentFinancial: number; targetUnit: number; targetFinancial: number; currentDays: number; targetDays: number }
> {
  if (!Array.isArray(segmentation) || !Array.isArray(products)) {
    return new Map()
  }

  // Initialize all possible ABC/XYZ combinations
  const result = new Map<
    string,
    { items: number; currentUnit: number; currentFinancial: number; targetUnit: number; targetFinancial: number; currentDays: number; targetDays: number }
  >()

  // Create all 9 combinations (A,B,C × X,Y,Z)
  const abcValues = ['A', 'B', 'C']
  const xyzValues = ['X', 'Y', 'Z']
  
  abcValues.forEach(abc => {
    xyzValues.forEach(xyz => {
      const key = `${abc}${xyz}`
      result.set(key, { items: 0, currentUnit: 0, currentFinancial: 0, targetUnit: 0, targetFinancial: 0, currentDays: 0, targetDays: 0 })
    })
  })

  // Filter products by family
  const productIds = filterProductsByFamily(products, productFamily)

  // Filter segmentation by products
  const filtered = segmentation.filter((s) => productIds.includes(s.product_id))

  // Aggregate actual data into the initialized combinations
  filtered.forEach((s) => {
    const key = `${s.ABC_value}${s.XYZ_value}`
    if (result.has(key)) {
      const agg = result.get(key)!
      agg.items++
      agg.currentUnit += s.on_hand_inventory_unit
      agg.currentFinancial += s.on_hand_inventory_financial
      agg.targetUnit += s.target_inventory_unit
      agg.targetFinancial += s.target_inventory_financial
      agg.currentDays += s.on_hand_inventory_days
      agg.targetDays += s.target_inventory_days
    }
  })

  // Calculate average days for each segment
  result.forEach((value) => {
    if (value.items > 0) {
      value.currentDays = value.currentDays / value.items
      value.targetDays = value.targetDays / value.items
    }
  })

  return result
}

export function aggregateMeasures(
  measures: MeasureData[],
  products: ProductMapping[],
  productFamily: string,
  location: string,
): Map<string, number[]> {
  if (!Array.isArray(measures) || !Array.isArray(products)) {
    return new Map()
  }

  // Filter products by family
  const productIds = (productFamily === "All Products" || productFamily === "all")
    ? products.map(p => p.product_id)
    : products.filter((p) => p.product_family === productFamily).map((p) => p.product_id)

  // Filter measures by product and location
  let filteredMeasures = measures.filter((m) => productIds.includes(m.product_id))

  if (location !== "All Locations" && location !== "all") {
    filteredMeasures = filteredMeasures.filter((m) => m.location_id === location)
  }

  // Group by measure type
  const grouped = new Map<string, MeasureData[]>()
  filteredMeasures.forEach((m) => {
    const key = m.measure_id
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(m)
  })

  // Aggregate values
  const result = new Map<string, number[]>()
  grouped.forEach((measureList, measureId) => {
    // For days on hand, calculate average
    if (measureId.includes("days")) {
      const weekAverages = Array(20).fill(0)
      for (let week = 0; week < 20; week++) {
        const values = measureList.map((m) => m.weeks[week]).filter(v => !isNaN(v))
        weekAverages[week] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      }
      result.set(measureId, weekAverages)
    } else {
      // For other measures, sum the values
      const weekSums = Array(20).fill(0)
      for (let week = 0; week < 20; week++) {
        weekSums[week] = measureList.reduce((sum, m) => sum + (m.weeks[week] || 0), 0)
      }
      result.set(measureId, weekSums)
    }
  })

  return result
}
