# Code or View Panel

This component provides the content display area for Chat Mode, showing either preview or code based on the tab selection in the TopRibbon.

## Purpose

- **Preview Content**: Shows live preview of web site or web app
- **Code Content**: Displays the generated code with syntax highlighting

## Architecture Change

**Previous**: Component managed its own tab state internally
**Current**: Receives active tab as prop from TopRibbon via ChatMode

## Features

- **Controlled Component**: Tab state managed by parent components
- **Clean Content Display**: No tab headers, pure content area
- **Consistent Styling**: Matches other panel components
- **Placeholder Content**: Ready for future implementation

## Props

```tsx
interface CodeOrViewPanelProps {
  activeTab?: 'preview' | 'code';
}
```

## Data Flow

```
TopRibbon (tab state) → ChatMode → CodeOrViewPanel (content display)
```

## Similar To

- Loveable.dev's preview/code content area
- Bolt.new's output panel

## Future Enhancements

- Live iframe preview integration
- Real-time code updates from AI responses
