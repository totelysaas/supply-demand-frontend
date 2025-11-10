"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useData } from "@/lib/data-context"
import { AlertTriangle, Sparkles, Check, X, Plus, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActionStatusModal } from "./action-status-modal"
import { AddActionModal } from "./add-action-modal"
import type { RecommendationData } from "@/lib/data-loader"

export function RecommendationsSection() {
  const { recommendations, recommendationMappings, loading, updateRecommendation } = useData()
  const [activeTab, setActiveTab] = useState<"recommendations" | "actions">("recommendations")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [themeFilter, setThemeFilter] = useState<string>("all")
  const [editingAction, setEditingAction] = useState<{
    action: RecommendationData
    currentStatus: "recommendation" | "rejected" | "created" | "scheduled" | "in_progress" | "completed"
  } | null>(null)
  const [showAddAction, setShowAddAction] = useState(false)

  const mappingLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    recommendationMappings.forEach((mapping) => {
      lookup.set(mapping.recommendation_id, mapping.display_name)
    })
    return lookup
  }, [recommendationMappings])

  const filteredByTab = useMemo(() => {
    if (activeTab === "recommendations") {
      return recommendations.filter((r) => r.status === "open" || r.status === "rejected")
    } else {
      return recommendations.filter(
        (r) => r.status === "accepted" || (r.source === "user_created_action" && r.status !== "open"),
      )
    }
  }, [recommendations, activeTab])

  const filteredRecommendations = useMemo(() => {
    let filtered = filteredByTab

    if (severityFilter !== "all") {
      filtered = filtered.filter((r) => r.severity === severityFilter)
    }

    if (themeFilter !== "all") {
      filtered = filtered.filter((r) => r.type === themeFilter)
    }

    return filtered
  }, [filteredByTab, severityFilter, themeFilter])

  const themes = useMemo(() => {
    const uniqueThemes = new Set(recommendations.map((r) => r.type))
    return Array.from(uniqueThemes).sort()
  }, [recommendations])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white hover:bg-red-700"
      case "high":
        return "bg-red-600 text-white hover:bg-red-700"
      case "medium":
        return "bg-blue-600 text-white hover:bg-blue-700"
      case "low":
        return "bg-gray-600 text-white hover:bg-gray-700"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    if (type.includes("inventory")) {
      return "bg-red-600 text-white"
    }
    return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  }

  const getIconColor = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
      case "low":
        return "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getActionStatusColor = (status?: string) => {
    switch (status) {
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
      case "created":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatType = (type: string) => {
    const displayName = mappingLookup.get(type)
    if (displayName) {
      return displayName
    }

    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const handleAccept = (rec: RecommendationData) => {
    updateRecommendation({
      ...rec,
      status: "accepted",
      action_status: "scheduled",
      start_date: new Date().toISOString().split("T")[0],
    })
  }

  const handleReject = (rec: RecommendationData) => {
    updateRecommendation({
      ...rec,
      status: "rejected",
    })
  }

  const handleStatusClick = (action: RecommendationData) => {
    let currentStatus: "recommendation" | "rejected" | "created" | "scheduled" | "in_progress" | "completed"

    if (action.status === "rejected") {
      currentStatus = "rejected"
    } else if (action.status === "open") {
      currentStatus = "recommendation"
    } else if (action.action_status) {
      currentStatus = action.action_status
    } else {
      currentStatus = "created"
    }

    setEditingAction({ action, currentStatus })
  }

  const handleUpdateActionStatus = (
    actionId: string,
    status: "open" | "rejected" | "accepted",
    actionStatus?: "created" | "scheduled" | "in_progress" | "completed",
    startDate?: string,
    completionDate?: string,
  ) => {
    const action = recommendations.find((r) => r.id === actionId)
    if (action) {
      updateRecommendation({
        ...action,
        status,
        action_status: actionStatus,
        start_date: startDate,
        completion_date: completionDate,
      })
    }
  }

  const handleCreateAction = (name: string, type: string, severity: string) => {
    const newAction: RecommendationData = {
      id: `ACT-${Date.now()}`,
      source: "user_created_action",
      name,
      type,
      severity,
      status: "created",
      action_status: "created",
      created_date: new Date().toISOString().split("T")[0],
    }
    updateRecommendation(newAction)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading recommendations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-8 border-b">
        <button
          onClick={() => setActiveTab("recommendations")}
          className={cn(
            "pb-3 text-lg font-semibold transition-colors relative",
            activeTab === "recommendations"
              ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Recommendations
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={cn(
            "pb-3 text-lg font-semibold transition-colors relative",
            activeTab === "actions"
              ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Actions
        </button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={themeFilter} onValueChange={setThemeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Themes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            {themes.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {formatType(theme)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeTab === "actions" && (
          <Button onClick={() => setShowAddAction(true)} size="sm" className="ml-auto gap-2">
            <Plus className="h-4 w-4" />
            Add New Action
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {filteredRecommendations.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No {activeTab === "recommendations" ? "recommendations" : "actions"} available
          </div>
        ) : (
          filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={cn("p-2 rounded-lg shrink-0", getIconColor(rec.severity))}>
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-xs font-medium", getTypeColor(rec.type))}>{formatType(rec.type)}</Badge>
                  <Badge className={cn("text-xs font-medium", getSeverityColor(rec.severity))}>{rec.severity}</Badge>
                  {rec.source === "recommendation" && <Sparkles className="h-4 w-4 text-blue-600" />}
                  {rec.source === "user_created_action" && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>User Created</span>
                    </div>
                  )}
                  {activeTab === "recommendations" && rec.status === "rejected" && (
                    <Badge
                      className={cn(
                        "text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity",
                        getActionStatusColor("rejected"),
                      )}
                      onClick={() => handleStatusClick(rec)}
                    >
                      rejected
                    </Badge>
                  )}
                  {activeTab === "actions" && rec.action_status && (
                    <Badge
                      className={cn(
                        "text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity",
                        getActionStatusColor(rec.action_status),
                      )}
                      onClick={() => handleStatusClick(rec)}
                    >
                      {rec.action_status.replace("_", " ")}
                    </Badge>
                  )}
                </div>

                <p className="text-sm font-medium leading-tight">{rec.name}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {rec.created_date && <span>Created: {formatDate(rec.created_date)}</span>}
                  {activeTab === "actions" && rec.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Start: {formatDate(rec.start_date)}
                    </span>
                  )}
                  {activeTab === "actions" && rec.completion_date && (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Completed: {formatDate(rec.completion_date)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeTab === "recommendations" && rec.status !== "rejected" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleAccept(rec)} className="gap-1">
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(rec)} className="gap-1">
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {editingAction && (
        <ActionStatusModal
          open={!!editingAction}
          onOpenChange={(open) => !open && setEditingAction(null)}
          action={editingAction.action}
          currentStatus={editingAction.currentStatus}
          onSave={handleUpdateActionStatus}
        />
      )}

      <AddActionModal open={showAddAction} onOpenChange={setShowAddAction} types={themes} onSave={handleCreateAction} />
    </div>
  )
}
