'use client';

interface Message {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

interface MessagePanelProps {
  messages: Message[];
  onClearMessages: () => void;
}

// Component for displaying API messages and notifications
export function MessagePanel({ messages, onClearMessages }: MessagePanelProps) {
  // Get icon for message type
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  // Get color classes for message type
  const getMessageColors = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'info': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-fg-50 bg-bk-50 border-bd-50';
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">Messages</span>
        {messages.length > 0 && (
          <button
            onClick={onClearMessages}
            className="text-[9px] text-fg-60 hover:text-fg-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-[10px] text-fg-60 text-center py-4">
            No messages yet
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-2 rounded-md border text-[10px] ${
                getMessageColors(message.type)
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-[9px] mt-0.5">
                  {getMessageIcon(message.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="break-words leading-tight">
                    {message.text}
                  </div>
                  <div className="text-[9px] opacity-60 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}