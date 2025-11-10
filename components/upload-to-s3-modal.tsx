"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, XCircle, Upload, Loader2, FolderOpen } from "lucide-react"
import { uploadFilesToS3, listS3Folders } from "@/lib/api-client"

interface UploadToS3ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FileUploadStatus {
  name: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
  size: string
}

export function UploadToS3Modal({ open, onOpenChange }: UploadToS3ModalProps) {
  const [bucket] = useState("supply-demand-inventory-1762030832")
  const [folder, setFolder] = useState("")
  const [availableFolders, setAvailableFolders] = useState<string[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [showFolders, setShowFolders] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<FileUploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFolders = async () => {
    setLoadingFolders(true)
    try {
      const result = await listS3Folders()
      if (result.success) {
        setAvailableFolders(result.folders)
        setShowFolders(true)
      }
    } catch (error) {
      console.error("[v0] Error loading folders:", error)
    } finally {
      setLoadingFolders(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadFolders()
    } else {
      setShowFolders(false)
      setFolder("")
      setFiles([])
      setUploadStatuses([])
      setError(null)
    }
  }, [open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    setUploadStatuses(
      selectedFiles.map((file) => ({
        name: file.name,
        status: "pending",
        progress: 0,
        size: formatFileSize(file.size),
      })),
    )
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload")
      return
    }

    setIsUploading(true)
    setError(null)

    console.log("[v0] Starting upload of", files.length, "files to folder:", folder)

    // Update all files to uploading status
    setUploadStatuses((prev) =>
      prev.map((status) => ({ ...status, status: "uploading", progress: 50 }))
    )

    try {
      const result = await uploadFilesToS3(folder, files)

      if (result.success) {
        console.log("[v0] Successfully uploaded all files")
        setUploadStatuses((prev) =>
          prev.map((status) => ({ ...status, status: "success", progress: 100 }))
        )
      } else {
        console.error("[v0] Upload failed:", result.error)
        setError(result.error || "Upload failed")
        setUploadStatuses((prev) =>
          prev.map((status) => ({ ...status, status: "error", progress: 0 }))
        )
      }
    } catch (err) {
      console.error("[v0] Error uploading files:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadStatuses((prev) =>
        prev.map((status) => ({ ...status, status: "error", progress: 0 }))
      )
    }

    setIsUploading(false)
    console.log("[v0] Upload process completed")
  }

  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      setUploadStatuses([])
      setFolder("")
      setError(null)
      onOpenChange(false)
    }
  }

  const allUploadsComplete = uploadStatuses.length > 0 && uploadStatuses.every((s) => s.status !== "pending")
  const hasErrors = uploadStatuses.some((s) => s.status === "error")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Files to S3</DialogTitle>
          <DialogDescription>
            Upload CSV files to your S3 bucket. You can optionally specify a folder path.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bucket">S3 Bucket</Label>
            <Input id="bucket" value={bucket} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="folder">Folder Path (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadFolders}
                disabled={loadingFolders || isUploading}
                className="h-8"
              >
                {loadingFolders ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FolderOpen className="h-3 w-3" />
                )}
                <span className="ml-1">Browse</span>
              </Button>
            </div>
            <Input
              id="folder"
              placeholder="e.g., dataset/input"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              disabled={isUploading}
            />
            
            {showFolders && availableFolders.length > 0 && (
              <div className="border rounded-md">
                <div className="p-2 text-sm font-medium border-b bg-muted/50">Available Folders:</div>
                <ScrollArea className="h-32">
                  <div className="p-1">
                    {availableFolders.map((folderPath) => (
                      <Button
                        key={folderPath}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 text-xs"
                        onClick={() => {
                          setFolder(folderPath)
                          setShowFolders(false)
                        }}
                      >
                        <FolderOpen className="h-3 w-3 mr-2" />
                        {folderPath}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Leave empty to upload to the root of the bucket. Folder will be created if it doesn't exist.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Select Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Select one or more CSV files to upload</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadStatuses.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-lg p-3">
              <div className="text-sm font-medium">Upload Progress</div>
              {uploadStatuses.map((status, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {status.status === "pending" && <Upload className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {status.status === "uploading" && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                      )}
                      {status.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                      {status.status === "error" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <span className="truncate" title={status.name}>
                        {status.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">{status.size}</span>
                  </div>
                  {status.status === "uploading" && <Progress value={status.progress} className="h-1" />}
                  {status.error && <p className="text-xs text-destructive">{status.error}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {allUploadsComplete ? "Close" : "Cancel"}
          </Button>
          {!allUploadsComplete && (
            <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
