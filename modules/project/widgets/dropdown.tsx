"use client";

import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/providers/theme-provider";
import {
  ContextMenuNested,
  useContextMenuNested,
} from "@/components/menu/context-menu-nesting";

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
        <div className="w-5 h-5 text-fg-50 group-hover:text-fg-30">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.98485 8.15152L8.98485 7.4697L7.62121 7.4697L7.62121 8.15152L8.30303 8.15152L8.98485 8.15152ZM13.8333 9.36364L13.8333 8.68182L12.4697 8.68182L12.4697 9.36364L13.1515 9.36364L13.8333 9.36364ZM7.51788 7.36637L7.03576 7.84848L8 8.81272L8.48212 8.3306L8 7.84848L7.51788 7.36637ZM12.6694 8.27546L12.1873 8.75758L13.1515 9.72181L13.6336 9.23969L13.1515 8.75758L12.6694 8.27546ZM8.30303 20.8788L8.98485 20.8788L8.98485 8.15152L8.30303 8.15152L7.62121 8.15152L7.62121 20.8788L8.30303 20.8788ZM13.1515 20.8788L13.8333 20.8788L13.8333 9.36364L13.1515 9.36364L12.4697 9.36364L12.4697 20.8788L13.1515 20.8788ZM12.8485 3L12.3664 2.51788L7.51788 7.36637L8 7.84848L8.48212 8.3306L13.3306 3.48212L12.8485 3ZM18 3.90909L17.5179 3.42697L12.6694 8.27546L13.1515 8.75758L13.6336 9.23969L18.4821 4.39121L18 3.90909Z"
              fill="currentColor"
            />
          </svg>
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
