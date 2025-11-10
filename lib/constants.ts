import {
  Package,
  Truck,
  Warehouse,
  TrendingUp,
  PackagePlus,
  PackageMinus,
  RefreshCw,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

// Shared icon mappings
export const ICON_MAP: Record<string, any> = {
  demand: Package,
  supply: Truck,
  inventory: Warehouse,
  fillrate: TrendingUp,
  excess: PackagePlus,
  deficit: PackageMinus,
  replenishment: RefreshCw,
  revenue: DollarSign,
  leadtime: Clock,
  stockouts: AlertTriangle,
  ontime: CheckCircle,
  turns: RefreshCw,
}

// Required CSV files
export const REQUIRED_CSV_FILES = [
  "metrics.csv",
  "measures.csv", 
  "products.csv",
  "recommendations.csv",
  "recommendations_mapping.csv",
  "segmentation.csv",
] as const
