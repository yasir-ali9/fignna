import { makeAutoObservable } from 'mobx';

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    isStreaming?: boolean;
}

export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export class AIManager {
    // Current chat session
    currentSession: ChatSession | null = null;
    
    // Chat state
    isGenerating: boolean = false;
    isConnected: boolean = false;
    currentStreamingMessage: string = '';
    
    // Session history
    sessions: ChatSession[] = [];
    
    constructor() {
        makeAutoObservable(this);
    }

    // Session management
    createSession(): ChatSession {
        const session: ChatSession = {
            id: `session_${Date.now()}`,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.sessions.push(session);
        this.currentSession = session;
        return session;
    }

    selectSession(sessionId: string) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            this.currentSession = session;
        }
    }

    // Message management
    addUserMessage(content: string): ChatMessage {
        if (!this.currentSession) {
            this.createSession();
        }

        const message: ChatMessage = {
            id: `msg_${Date.now()}`,
            content,
            role: 'user',
            timestamp: new Date()
        };

        this.currentSession!.messages.push(message);
        this.currentSession!.updatedAt = new Date();
        
        return message;
    }

    addAssistantMessage(content: string): ChatMessage {
        if (!this.currentSession) {
            this.createSession();
        }

        const message: ChatMessage = {
            id: `msg_${Date.now()}`,
            content,
            role: 'assistant',
            timestamp: new Date()
        };

        this.currentSession!.messages.push(message);
        this.currentSession!.updatedAt = new Date();
        
        return message;
    }

    // Streaming management
    startStreaming() {
        this.isGenerating = true;
        this.currentStreamingMessage = '';
    }

    updateStreamingMessage(content: string) {
        this.currentStreamingMessage = content;
    }

    finishStreaming() {
        if (this.currentStreamingMessage) {
            this.addAssistantMessage(this.currentStreamingMessage);
        }
        this.isGenerating = false;
        this.currentStreamingMessage = '';
    }

    // Connection state
    setConnected(connected: boolean) {
        this.isConnected = connected;
    }

    // Getters
    get hasCurrentSession(): boolean {
        return this.currentSession !== null;
    }

    get currentMessages(): ChatMessage[] {
        return this.currentSession?.messages || [];
    }

    get lastMessage(): ChatMessage | null {
        const messages = this.currentMessages;
        return messages.length > 0 ? messages[messages.length - 1] : null;
    }

    get messageCount(): number {
        return this.currentMessages.length;
    }
}