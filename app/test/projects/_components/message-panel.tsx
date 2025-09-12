"use client";

import { useEffect, useRef } from "react";

interface Message {
  id: string;
  text: string;
  type: "success" | "error" | "info";
  timestamp: Date;
}

interface MessagePanelProps {
  messages: Message[];
  onClearMessages: () => void;
}

export function MessagePanel({ messages, onClearMessages }: MessagePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMessageIcon = (type: Message["type"]) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "info":
        return "ℹ";
      default:
        return "•";
    }
  };

  const getMessageColor = (type: Message["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-fg-60";
    }
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-fg-60 text-[24px] mb-2">📡</div>
          <div className="text-fg-60 text-[11px]">
            API responses will appear here
          </div>
          <div className="text-fg-60 text-[9px] mt-1">
            Test an endpoint to see results
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-bk-40 border border-bd-50 rounded-lg p-3"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getMessageColor(
                  message.type
                )} bg-current/10`}
              >
                {getMessageIcon(message.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wide ${getMessageColor(
                      message.type
                    )}`}
                  >
                    {message.type}
                  </span>
                  <span className="text-fg-60 text-[9px] font-mono">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="text-fg-50 text-[11px] leading-relaxed break-words">
                  {message.text}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
