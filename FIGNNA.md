# Fignna - Visual Development Tool

## Inspiration

I was frustrated with the disconnect between design and development. Designers create beautiful mockups, but developers have to rebuild everything from scratch in code. Meanwhile, AI coding tools are powerful but lack visual editing capabilities. I thought: "What if I could combine the best of both worlds?"

That's how Fignna was born - a tool that bridges the gap between visual design and AI-powered development, letting you build apps through both conversation and direct visual manipulation.

## What it does

Fignna is a revolutionary hybrid platform that combines visual design capabilities with AI-powered coding features. It offers three seamless modes:

**Edit Mode (Figma like)**

- Visual canvas for drag-and-drop design
- Real-time component manipulation
- Layers panel and properties for precise control
- Direct styling without API calls

**View Mode (Lovable Like)**

- AI chat interface for natural language development
- Live preview alongside conversation
- Streaming code generation and application

**Code Mode (VS Code Like)**

- Full-featured code editor with syntax highlighting
- File explorer with project management
- Terminal integration for debugging

The magic happens when these modes work together - you can start with a conversation, switch to visual editing for fine-tuning, then jump into code for advanced customization. All while working on the same live project in real-time.

## How I built it

**Frontend Architecture:**

- **Next.js 15.5.2** with App Router for modern React development
- **TypeScript 5** for type safety and better developer experience
- **Tailwind CSS v4** with custom semantic color system for consistent theming
- **MobX** for centralized state management following the EditorEngine pattern
- **CodeMirror** for the code editor with syntax highlighting and autocomplete

**AI Integration:**

- Multiple AI providers (Anthropic, OpenAI, Gemini, Groq) with unified interface
- Streaming responses for real-time code generation
- Context-aware conversations with project history

**Sandbox Environment:**

- **E2B sandboxes** for isolated project execution
- Real-time file synchronization between editor and sandbox
- Live preview generation with iframe embedding
- Automatic deployment on code changes

**Database & Auth:**

- **Neon PostgreSQL** with Drizzle ORM for robust data management
- **Better Auth** with Google OAuth for seamless authentication
- Project versioning and collaboration features
- Chat persistence with message threading

**Parsing & Analysis:**

- Custom TSX parser to extract React components for layers panel
- Tailwind class parser for visual style editing
- Real-time component tree generation

## Challenges I ran into

**State Synchronization Nightmare:**
The biggest challenge was keeping three different modes (Edit, View, Code) perfectly synchronized. I had to architect a centralized MobX store system where changes in one mode instantly reflect in others without data loss.

**File System Complexity:**
Managing files across local editor, database, and remote sandbox was incredibly complex. I built a multi-layer protection system to prevent data loss and ensure consistency across all environments.

**Real-time Performance:**
Parsing React components and Tailwind classes in real-time while maintaining smooth UI performance required careful optimization and debouncing strategies.

**AI Context Management:**
Keeping AI conversations contextually aware of the current project state, file changes, and user intentions across different modes was a significant architectural challenge.

**Iframe Security & Communication:**
Embedding live previews securely while maintaining communication between the parent app and sandbox required careful handling of CORS, CSP, and postMessage APIs.

## Accomplishments that I'm proud of

**Seamless Mode Switching:**
I achieved true seamless switching between visual design, AI chat, and code editing - something no other tool offers. Your work persists perfectly across all modes.

**Bulletproof Data Protection:**
After facing critical data loss issues, I built a multi-layer protection system that prevents empty file saves and ensures user work is never lost.

**Real-time Everything:**
From AI streaming to live previews to instant file synchronization - everything happens in real-time with smooth performance.

**High-Quality Visual Editor:**
I successfully recreated an intuitive visual editing experience, complete with layers panel, properties, and direct manipulation.

**Multi-AI Integration:**
Supporting multiple AI providers with a unified interface gives users choice and reliability.

**Production-Ready Architecture:**
Built with enterprise-grade technologies and patterns that can scale to thousands of users.

## What I learned

**Architecture Matters:**
Starting with a solid MobX-based architecture saved me countless hours. Centralized state management is crucial for complex applications with multiple interconnected features.

**User Experience is King:**
Small details like auto-expanding textareas, proper dropdown positioning, and smooth transitions make a huge difference in user satisfaction.

**Data Integrity is Critical:**
I learned the hard way that protecting user data requires multiple validation layers and careful race condition handling.

**AI UX is Different:**
Designing interfaces for AI interaction requires different patterns than traditional apps - streaming states, context awareness, and progressive disclosure are essential.

**Performance vs Features:**
Balancing rich features with smooth performance required careful optimization, especially for real-time parsing and rendering.

## What's next for fignna.com

**Enhanced AI Capabilities:**

- Multi-modal AI support (image, voice, video inputs)
- AI-powered design suggestions and auto-layouts
- Smart component generation from descriptions

**Advanced Visual Features:**

- Component library and design system management
- Advanced animations and interactions
- Responsive design tools with breakpoint management

**Collaboration & Sharing:**

- Real-time collaborative editing
- Project sharing and embedding
- Team workspaces and permissions

**Developer Tools:**

- Git integration for version control
- Package manager integration
- Deployment to multiple platforms (Vercel, Netlify, etc.)

**Platform Expansion:**

- Mobile app development support
- Desktop application generation
- API and backend service creation

**Ecosystem Growth:**

- Plugin system for third-party integrations
- Template marketplace
- Community-driven component library

## The Problem That Bothers Me

Recently, major design tools launched two separate products for building web apps: visual builders (like Framer) and AI builders (like Loveable).

Here's what frustrates me: Why do we need two different products for the same goal—building web apps?

**Understanding How No-Code Tools Work**

No-code tools like visual site builders aren't scalable. They map every user interaction to specific code snippets.

For example, you drag a button and it generates an HTML button tag with some predefined CSS. Do you think this is scalable? Can you build real logic with this?

Never.

This approach hits a wall fast. You're bound by the tool's limitations and can't scale for big applications.

**AI Builders Are Better, But Incomplete**

AI builders are more scalable. They create real projects in isolated cloud environments. So these are better, but incomplete.

For example, if you want to move two blocks around, what do you do? Most probably you'll prompt: "Can you change their position?" Instead of just... moving them.

**My Solution: Best of Both Worlds**

I'm building one tool that combines the visual power of design tools with the scalability of real code. Think of it as AI builder + visual builder, but unified.

You get a rich canvas with layers panel, styles panel, and direct visual editing—all while working with a real Next.js project (a React framework used by big companies like Anthropic, Nike, etc.) running in an isolated cloud environment. No limitations, no compromises.

Fignna represents the future where design and development converge into a single, powerful, AI-enhanced workflow.
