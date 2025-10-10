"use client";

import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/providers/theme-provider";
import {
  ContextMenuNested,
  useContextMenuNested,
} from "@/components/menu/context-menu-nesting";
import { Logo } from "@/components/logo";

export const LogoDropdown = observer(() => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { contextMenu, showContextMenu, hideContextMenu } =
    useContextMenuNested();

  // Handle logo button click to show context menu
  const handleLogoClick = (event: React.MouseEvent) => {
    event.preventDefault();
    showContextMenu(event);
  };

  // Define menu items with Projects and Theme options
  const menuItems = [
    {
      id: "projects",
      label: "Projects",
      onClick: () => router.push("/projects"),
    },
    {
      id: "theme",
      label: "Theme",
      submenu: [
        {
          id: "system",
          label: "System",
          selected: theme === "system",
          onClick: () => setTheme("system"),
        },
        {
          id: "dark",
          label: "Dark",
          selected: theme === "dark",
          onClick: () => setTheme("dark"),
        },
        {
          id: "light",
          label: "Light",
          selected: theme === "light",
          onClick: () => setTheme("light"),
        },
      ],
    },
  ];

  return (
    <>
      {/* Logo Button */}
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-1 pl-1 px-1.5 py-1.5 hover:bg-bk-40 rounded-lg transition-colors group cursor-pointer"
      >
        {/* Fignna Logo */}
        <div className="w-4.5 h-4.5 text-fg-70 hover:opacity-80 group-hover:text-fg-30">
          <Logo className="w-4.5 h-4.5" />
        </div>

        {/* Chevron Down */}
        <div className="w-3 h-3 text-fg-60 group-hover:text-fg-50 transition-transform duration-200">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Context Menu */}
      <ContextMenuNested
        items={menuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={hideContextMenu}
      />
    </>
  );
});
