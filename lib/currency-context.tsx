"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Currency = "USD" | "EUR" | "INR"

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatCurrency: (value: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD")

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency") as Currency
    if (savedCurrency && ["USD", "EUR", "INR"].includes(savedCurrency)) {
      setCurrencyState(savedCurrency)
    }
  }, [])

  // Save currency to localStorage when it changes
  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem("currency", newCurrency)
  }

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value)
    const isNegative = value < 0

    let formatted: string
    if (absValue >= 1000000) {
      formatted = `${(absValue / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      formatted = `${(absValue / 1000).toFixed(1)}K`
    } else {
      formatted = absValue.toFixed(0)
    }

    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹"
    return `${isNegative ? "-" : ""}${symbol}${formatted}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
