"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RecommendationData } from "@/lib/data-loader"

interface ActionStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: RecommendationData
  currentStatus: "recommendation" | "rejected" | "created" | "scheduled" | "in_progress" | "completed"
  onSave: (
    actionId: string,
    status: "open" | "rejected" | "accepted",
    actionStatus?: "created" | "scheduled" | "in_progress" | "completed",
    startDate?: string,
    completionDate?: string,
  ) => void
}

export function ActionStatusModal({ open, onOpenChange, action, currentStatus, onSave }: ActionStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [startDate, setStartDate] = useState(action.start_date || "")
  const [completionDate, setCompletionDate] = useState(action.completion_date || "")

  useEffect(() => {
    setSelectedStatus(currentStatus)
    setStartDate(action.start_date || "")
    setCompletionDate(action.completion_date || "")
  }, [action, currentStatus])

  const handleSave = () => {
    let status: "open" | "rejected" | "accepted" = "open"
    let actionStatus: "created" | "scheduled" | "in_progress" | "completed" | undefined

    if (selectedStatus === "recommendation") {
      status = "open"
    } else if (selectedStatus === "rejected") {
      status = "rejected"
    } else {
      status = "accepted"
      actionStatus = selectedStatus as "created" | "scheduled" | "in_progress" | "completed"
    }

    onSave(action.id, status, actionStatus, startDate || undefined, completionDate || undefined)
    onOpenChange(false)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "recommendation":
        return "Recommendation"
      case "rejected":
        return "Rejected"
      case "created":
        return "Created"
      case "scheduled":
        return "Scheduled"
      case "in_progress":
        return "In Progress"
      case "completed":
        return "Completed"
      default:
        return status
    }
  }

  const needsStartDate =
    selectedStatus === "scheduled" || selectedStatus === "in_progress" || selectedStatus === "completed"
  const needsCompletionDate = selectedStatus === "completed"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Action Status</DialogTitle>
          <DialogDescription>Change the status and update relevant dates.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Action</Label>
            <p className="text-sm text-muted-foreground">{action.name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommendation">Recommendation</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsStartDate && (
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date {needsStartDate && "*"}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Select start date"
                required={needsStartDate}
              />
            </div>
          )}

          {needsCompletionDate && (
            <div className="space-y-2">
              <Label htmlFor="completion-date">Completion Date *</Label>
              <Input
                id="completion-date"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                placeholder="Select completion date"
                required
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
