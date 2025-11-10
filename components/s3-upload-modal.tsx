"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { loadDataFromS3 } from "@/lib/api-client"

interface UploadedFile {
  name: string
  size: number
  content: string
}

interface S3UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (files: UploadedFile[]) => void
}

export function S3UploadModal({ open, onOpenChange, onUploadComplete }: S3UploadModalProps) {
  const [bucketName, setBucketName] = useState("")
  const [folderPath, setFolderPath] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleUpload = async () => {
    if (!bucketName.trim()) {
      setError("Please enter a bucket name")
      return
    }

    setUploading(true)
    setError(null)
    setUploadedFiles([])
    setUploadComplete(false)

    console.log("[v0] Starting S3 upload from modal")
    console.log("[v0] Bucket:", bucketName.trim())
    console.log("[v0] Folder:", folderPath.trim())

    try {
      const result = await uploadFromS3(bucketName.trim(), folderPath.trim())

      console.log("[v0] Server action result:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to upload from S3")
      }

      setUploadedFiles(result.files)
      setUploadComplete(true)
      console.log("[v0] Upload successful, files:", result.files.length)

      if (onUploadComplete) {
        onUploadComplete(result.files)
      }
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      setError(err.message || "Failed to upload from S3")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setBucketName("")
    setFolderPath("")
    setUploadedFiles([])
    setError(null)
    setUploadComplete(false)
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload from S3</DialogTitle>
          <DialogDescription>Enter your S3 bucket name and optional folder path to upload CSV files.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bucket-name">S3 Bucket Name *</Label>
            <Input
              id="bucket-name"
              placeholder="my-bucket-name"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              disabled={uploading || uploadComplete}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-path">Folder Path (optional)</Label>
            <Input
              id="folder-path"
              placeholder="data/csv-files"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              disabled={uploading || uploadComplete}
            />
            <p className="text-xs text-muted-foreground">Leave empty to upload from the root of the bucket</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Upload Failed</p>
                <p className="text-sm text-destructive/90 mt-1">{error}</p>
              </div>
            </div>
          )}

          {uploadComplete && uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Successfully uploaded {uploadedFiles.length} file(s)</span>
              </div>
              <div className="border border-border rounded-lg divide-y divide-border max-h-[200px] overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      Uploaded
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {uploadComplete ? (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !bucketName.trim()}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
