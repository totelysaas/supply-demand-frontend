"use client"

import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useData } from "@/lib/data-context"
import { formatDistanceToNow } from "date-fns"

export function DataSourceInfo() {
  const { lastUpdated, dataSource } = useData()

  if (!lastUpdated || !dataSource) {
    return null
  }

  const timeAgo = formatDistanceToNow(lastUpdated, { addSuffix: true })

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="hidden sm:inline">Updated {timeAgo}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button className="hover:text-foreground transition-colors">
            <Info className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Data Source Information</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{lastUpdated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source Type:</span>
                <span className="font-medium capitalize">
                  {dataSource.type === "s3" ? "Cloud (S3)" : "Local Files"}
                </span>
              </div>
              {dataSource.type === "s3" && dataSource.bucket && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">S3 Bucket:</span>
                    <span className="font-mono text-xs">{dataSource.bucket}</span>
                  </div>
                  {dataSource.folder && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Folder:</span>
                      <span className="font-mono text-xs">{dataSource.folder}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
