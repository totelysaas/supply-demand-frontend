"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send } from "lucide-react"
import { cn } from "@/lib/utils"

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your Trelliso AI assistant. Ask me anything about your supply chain data.",
    },
  ])

  const handleSend = () => {
    if (!message.trim()) return

    setMessages([...messages, { role: "user", content: message }])
    setMessage("")

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I can help you analyze that. Based on current data, I recommend reviewing your inventory levels in the North America region.",
        },
      ])
    }, 1000)
  }

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn("fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all", isOpen && "scale-0")}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      <Card
        className={cn(
          "fixed bottom-6 right-6 w-[380px] shadow-2xl transition-all duration-300 border-border",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-base font-semibold">Trelliso AI Assistant</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 bg-card">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
