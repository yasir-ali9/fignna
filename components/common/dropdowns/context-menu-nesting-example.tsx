"use client";

import { observer } from "mobx-react-lite";
import {
  ContextMenuNested,
  useContextMenuNested,
} from "./context-menu-nesting";

// Example usage component to demonstrate the nested context menu
export const ContextMenuNestedExample = observer(() => {
  const { contextMenu, showContextMenu, hideContextMenu } =
    useContextMenuNested();

  // Example menu items with nesting, icons, shortcuts, and selections
  const menuItems = [
    {
      id: "file",
      label: "File",
      submenu: [
        {
          id: "new",
          label: "New",
          shortcut: "Ctrl+N",
          onClick: () => console.log("New file"),
        },
        {
          id: "open",
          label: "Open",
          shortcut: "Ctrl+O",
          onClick: () => console.log("Open file"),
        },
        {
          id: "recent",
          label: "Recent Files",
          submenu: [
            {
              id: "file1",
              label: "project.tsx",
              onClick: () => console.log("Open project.tsx"),
            },
            {
              id: "file2",
              label: "components.tsx",
              onClick: () => console.log("Open components.tsx"),
            },
            {
              id: "file3",
              label: "styles.css",
              onClick: () => console.log("Open styles.css"),
            },
          ],
        },
        {
          id: "separator1",
          label: "",
          separator: true,
        },
        {
          id: "save",
          label: "Save",
          shortcut: "Ctrl+S",
          onClick: () => console.log("Save file"),
        },
        {
          id: "save-as",
          label: "Save As...",
          shortcut: "Ctrl+Shift+S",
          onClick: () => console.log("Save as"),
        },
      ],
    },
    {
      id: "edit",
      label: "Edit",
      submenu: [
        {
          id: "undo",
          label: "Undo",
          shortcut: "Ctrl+Z",
          onClick: () => console.log("Undo"),
        },
        {
          id: "redo",
          label: "Redo",
          shortcut: "Ctrl+Y",
          onClick: () => console.log("Redo"),
        },
        {
          id: "separator2",
          label: "",
          separator: true,
        },
        {
          id: "cut",
          label: "Cut",
          shortcut: "Ctrl+X",
          onClick: () => console.log("Cut"),
        },
        {
          id: "copy",
          label: "Copy",
          shortcut: "Ctrl+C",
          onClick: () => console.log("Copy"),
        },
        {
          id: "paste",
          label: "Paste",
          shortcut: "Ctrl+V",
          onClick: () => console.log("Paste"),
        },
      ],
    },
    {
      id: "view",
      label: "View",
      submenu: [
        {
          id: "sidebar",
          label: "Show Sidebar",
          selected: true,
          onClick: () => console.log("Toggle sidebar"),
        },
        {
          id: "minimap",
          label: "Show Minimap",
          selected: false,
          onClick: () => console.log("Toggle minimap"),
        },
        {
          id: "breadcrumbs",
          label: "Show Breadcrumbs",
          selected: true,
          onClick: () => console.log("Toggle breadcrumbs"),
        },
        {
          id: "separator3",
          label: "",
          separator: true,
        },
        {
          id: "zoom",
          label: "Zoom",
          submenu: [
            {
              id: "zoom-in",
              label: "Zoom In",
              shortcut: "Ctrl++",
              onClick: () => console.log("Zoom in"),
            },
            {
              id: "zoom-out",
              label: "Zoom Out",
              shortcut: "Ctrl+-",
              onClick: () => console.log("Zoom out"),
            },
            {
              id: "zoom-reset",
              label: "Reset Zoom",
              shortcut: "Ctrl+0",
              onClick: () => console.log("Reset zoom"),
            },
          ],
        },
      ],
    },
    {
      id: "separator4",
      label: "",
      separator: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
        </svg>
      ),
      shortcut: "Ctrl+,",
      onClick: () => console.log("Open settings"),
    },
    {
      id: "help",
      label: "Help",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
        </svg>
      ),
      shortcut: "F1",
      onClick: () => console.log("Open help"),
    },
  ];

  return (
    <div className="p-8">
      <div className="bg-bk-50 border border-bd-50 rounded-lg p-4">
        <h3 className="text-fg-30 font-medium mb-2">
          Nested Context Menu Example
        </h3>
        <p className="text-fg-50 text-sm mb-4">
          Right-click the button below to see the nested context menu in action.
        </p>

        <button
          onContextMenu={showContextMenu}
          className="px-4 py-2 bg-ac-01 text-fg-70 rounded-lg hover:bg-ac-01/90 transition-colors cursor-pointer"
        >
          Right-click me for context menu
        </button>

        <div className="mt-4 text-xs text-fg-60">
          <p>Features demonstrated:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Multi-level nesting (File → Recent Files)</li>
            <li>Icons and selected states (View menu)</li>
            <li>Keyboard shortcuts (Ctrl+N, Ctrl+S, etc.)</li>
            <li>Separators between menu sections</li>
            <li>Hover interactions and smooth animations</li>
          </ul>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenuNested
        items={menuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={hideContextMenu}
      />
    </div>
  );
});
