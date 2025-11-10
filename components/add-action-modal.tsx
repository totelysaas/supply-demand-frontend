"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AddActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  types: string[]
  onSave: (name: string, type: string, severity: string) => void
}

export function AddActionModal({ open, onOpenChange, types, onSave }: AddActionModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [severity, setSeverity] = useState("medium")

  const handleSave = () => {
    if (!name || !type) return
    onSave(name, type, severity)
    setName("")
    setType("")
    setSeverity("medium")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Action</DialogTitle>
          <DialogDescription>Add a new user-created action to your supply chain management.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action-name">Action Name *</Label>
            <Textarea
              id="action-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Order additional inventory for Product X"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-type">Action Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity *</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name || !type}>
            Create Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
