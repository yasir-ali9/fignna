"use client";

import { useState } from "react";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";

interface ChatsProps {
  onBack: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string, chatName: string) => void;
  onCreateChat: () => void;
}

// Helper function to group chats by date
const groupChatsByDate = (chats: any[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: { [key: string]: any[] } = {};

  chats.forEach((chat) => {
    const chatDate = new Date(chat.createdAt);
    const chatDateOnly = new Date(
      chatDate.getFullYear(),
      chatDate.getMonth(),
      chatDate.getDate()
    );

    let groupKey: string;

    if (chatDateOnly.getTime() === today.getTime()) {
      groupKey = "Today";
    } else if (chatDateOnly.getTime() === yesterday.getTime()) {
      groupKey = "Yesterday";
    } else if (chatDate >= weekAgo) {
      groupKey = chatDate.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      groupKey = chatDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          chatDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(chat);
  });

  // Sort groups by most recent first
  const sortedGroups = Object.entries(groups).sort(
    ([keyA, chatsA], [keyB, chatsB]) => {
      const latestA = Math.max(
        ...chatsA.map((chat) => new Date(chat.createdAt).getTime())
      );
      const latestB = Math.max(
        ...chatsB.map((chat) => new Date(chat.createdAt).getTime())
      );
      return latestB - latestA;
    }
  );

  return sortedGroups;
};

export const Chats = observer(
  ({ onBack, onSelectChat, onDeleteChat, onCreateChat }: ChatsProps) => {
    const engine = useEditorEngine();
    const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

    const groupedChats = groupChatsByDate(engine.chat.chats);

    // Handle chat selection with loading state
    const handleSelectChat = async (chatId: string) => {
      setLoadingChatId(chatId);
      try {
        await onSelectChat(chatId);
      } finally {
        setLoadingChatId(null);
      }
    };

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-bd-50 p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-fg-70 hover:text-fg-50 cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              <span style={{ fontSize: "11px" }} className="font-medium">
                Back to Chat
              </span>
            </button>
            <button
              onClick={onCreateChat}
              disabled={engine.chat.isCreatingChat}
              className="text-fg-60 hover:text-fg-70 cursor-pointer disabled:opacity-50"
              title="New Chat"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {engine.chat.error && (
          <div
            className="mx-3 mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600"
            style={{ fontSize: "11px" }}
          >
            {engine.chat.error}
            <button
              onClick={() => engine.chat.clearError()}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Chat History Heading */}
        <div className="px-3 pt-3 pb-2">
          <h2 style={{ fontSize: "12px" }} className="font-medium text-fg-70">
            Chats
          </h2>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {engine.chat.isLoadingChats ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-fg-30" style={{ fontSize: "11px" }}>
                Loading chats...
              </div>
            </div>
          ) : engine.chat.chats.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-fg-30 mb-2" style={{ fontSize: "11px" }}>
                  No chats yet
                </div>
                <button
                  onClick={onCreateChat}
                  className="px-3 py-1 bg-ac-01 text-white rounded hover:bg-ac-01/90 cursor-pointer"
                  style={{ fontSize: "11px" }}
                >
                  Create your first chat
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedChats.map(([dateGroup, chats]) => (
                <div key={dateGroup}>
                  {/* Date Group Header */}
                  <div className="mb-2">
                    <h3
                      style={{ fontSize: "10px" }}
                      className="font-medium text-fg-60 tracking-wide"
                    >
                      {dateGroup}
                    </h3>
                  </div>

                  {/* Chats in this date group */}
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          engine.chat.activeChat?.id === chat.id
                            ? "bg-bk-40 text-fg-70"
                            : "bg-bk-50 text-fg-50 hover:bg-bk-40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex-1 min-w-0 flex items-center"
                            onClick={() => handleSelectChat(chat.id)}
                          >
                            {loadingChatId === chat.id ? (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 20 20"
                                className="animate-spin mr-2"
                                fill="currentColor"
                              >
                                <path d="M10 3.5A6.5 6.5 0 0 0 3.5 10A.75.75 0 0 1 2 10a8 8 0 1 1 8 8a.75.75 0 0 1 0-1.5a6.5 6.5 0 1 0 0-13" />
                              </svg>
                            ) : null}
                            <div
                              className="font-medium truncate text-fg-60"
                              style={{ fontSize: "11px" }}
                            >
                              {chat.name} ({chat.messageCount || 0} messages)
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            {engine.chat.activeChat?.id === chat.id && (
                              <span
                                className="px-1.5 py-0.5 bg-bk-70 text-fg-60 rounded text-xs font-mono uppercase tracking-wider"
                                style={{ fontSize: "8px" }}
                                title="Active Chat"
                              >
                                current
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id, chat.name);
                              }}
                              className="p-1 text-fg-30 opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
                              title="Delete Chat"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M11.5 4a1.5 1.5 0 0 0-3 0zm-4 0a2.5 2.5 0 0 1 5 0h5a.5.5 0 0 1 0 1h-1.054l-.808 7H14.63l.808-7H4.561l1.18 10.23A2 2 0 0 0 7.728 17h2.357a1.5 1.5 0 0 0 0 1H7.728a3 3 0 0 1-2.98-2.656L3.554 5H2.5a.5.5 0 0 1 0-1zm4 9a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
