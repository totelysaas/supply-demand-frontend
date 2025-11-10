"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, FolderOpen } from "lucide-react"
import { listS3Folders } from "@/lib/api-client"

interface CloudModeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (folderName: string) => void
}

export function CloudModeModal({ open, onOpenChange, onConfirm }: CloudModeModalProps) {
  const [folderName, setFolderName] = useState("")
  const [availableFolders, setAvailableFolders] = useState<string[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [showFolders, setShowFolders] = useState(false)

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
      setAvailableFolders([])
    }
  }, [open])

  const handleConfirm = () => {
    if (folderName.trim()) {
      onConfirm(folderName.trim())
      setFolderName("")
    }
  }

  const handleCancel = () => {
    setFolderName("")
    onOpenChange(false)
  }

  const handleSelectFolder = (folder: string) => {
    setFolderName(folder)
    setShowFolders(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enable Cloud Mode</DialogTitle>
          <DialogDescription>
            Enter the S3 folder name to load data from. The folder should contain your CSV files in the bucket
            "supply-demand-inventory-1762030832".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <div className="flex gap-2">
              <Input
                id="folder-name"
                placeholder="e.g., dataset/input"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && folderName.trim()) {
                    handleConfirm()
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFolders(!showFolders)}
                disabled={loadingFolders}
              >
                {loadingFolders ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to load from the root of the bucket, or specify a folder path like "dataset/input"
            </p>
          </div>

          {showFolders && (
            <div className="space-y-2">
              <Label>Available Folders ({availableFolders.length})</Label>
              {availableFolders.length > 0 ? (
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-1">
                    {availableFolders.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => handleSelectFolder(folder)}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <FolderOpen className="inline-block h-4 w-4 mr-2" />
                        {folder}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No folders found in the bucket.</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!folderName.trim()}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
