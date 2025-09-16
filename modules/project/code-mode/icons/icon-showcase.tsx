/**
 * Icon Showcase - Demo component to display all available file icons
 * Useful for testing and documentation
 */

import React from 'react';
import { FileIcon } from './file-icons';

const DEMO_FILES = [
  // JavaScript
  { name: 'app.js', type: 'JavaScript' },
  { name: 'utils.mjs', type: 'JavaScript (Module)' },
  
  // React
  { name: 'Component.jsx', type: 'React JSX' },
  
  // TypeScript
  { name: 'types.ts', type: 'TypeScript' },
  { name: 'App.tsx', type: 'React TypeScript' },
  
  // Config files
  { name: 'tsconfig.json', type: 'TypeScript Config' },
  { name: 'next.config.js', type: 'Next.js Config' },
  
  // JSON
  { name: 'package.json', type: 'JSON' },
  { name: 'data.jsonc', type: 'JSON with Comments' },
  
  // Markdown
  { name: 'README.md', type: 'Markdown' },
  { name: 'docs.mdx', type: 'MDX' },
  
  // Shell
  { name: 'build.sh', type: 'Shell Script' },
  { name: 'deploy.bash', type: 'Bash Script' },
  
  // CSS
  { name: 'styles.css', type: 'CSS' },
  { name: 'main.scss', type: 'SCSS' },
  { name: 'postcss.config.js', type: 'PostCSS' },
  
  // SVG files
  { name: 'icon.svg', type: 'SVG Vector' },
  
  // Text files
  { name: 'README.txt', type: 'Text File' },
  
  // Environment files
  { name: '.env', type: 'Environment Variables' },
  { name: '.env.local', type: 'Local Environment' },
  
  // Image files
  { name: 'photo.png', type: 'PNG Image' },
  { name: 'banner.jpg', type: 'JPEG Image' },
  { name: 'avatar.webp', type: 'WebP Image' },
  { name: 'icon.gif', type: 'GIF Image' },
  
  // Git files
  { name: '.gitignore', type: 'Git Ignore' },
  { name: '.git', type: 'Git Directory' },
  
  // Special files
  { name: 'supabase', type: 'Supabase' },
  
  // Default
  { name: 'unknown.xyz', type: 'Unknown File Type' },
];

const DEMO_FOLDERS = [
  { name: 'src', isOpen: false },
  { name: 'components', isOpen: true },
  { name: 'utils', isOpen: false },
];

export const IconShowcase: React.FC = () => {
  return (
    <div className="p-6 bg-bk-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-fg-30 mb-6">File Icons Showcase</h1>
        
        {/* Folders */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-fg-30 mb-4">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_FOLDERS.map((folder) => (
              <div key={folder.name} className="flex items-center gap-3 p-3 bg-bk-40 rounded-lg">
                <FileIcon
                  filename={folder.name}
                  isDirectory={true}
                  isOpen={folder.isOpen}
                  size={20}
                />
                <div>
                  <div className="text-fg-30 font-medium">{folder.name}</div>
                  <div className="text-fg-60 text-sm">{folder.isOpen ? 'Open' : 'Closed'} Folder</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Files */}
        <div>
          <h2 className="text-lg font-semibold text-fg-30 mb-4">Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_FILES.map((file) => (
              <div key={file.name} className="flex items-center gap-3 p-3 bg-bk-40 rounded-lg">
                <FileIcon
                  filename={file.name}
                  size={20}
                />
                <div>
                  <div className="text-fg-30 font-medium">{file.name}</div>
                  <div className="text-fg-60 text-sm">{file.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Variations */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-fg-30 mb-4">Size Variations</h2>
          <div className="flex items-center gap-6 p-4 bg-bk-40 rounded-lg">
            <div className="text-center">
              <FileIcon filename="app.js" size={12} />
              <div className="text-fg-60 text-xs mt-1">12px</div>
            </div>
            <div className="text-center">
              <FileIcon filename="app.js" size={16} />
              <div className="text-fg-60 text-xs mt-1">16px</div>
            </div>
            <div className="text-center">
              <FileIcon filename="app.js" size={20} />
              <div className="text-fg-60 text-xs mt-1">20px</div>
            </div>
            <div className="text-center">
              <FileIcon filename="app.js" size={24} />
              <div className="text-fg-60 text-xs mt-1">24px</div>
            </div>
            <div className="text-center">
              <FileIcon filename="app.js" size={32} />
              <div className="text-fg-60 text-xs mt-1">32px</div>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="mt-8 p-4 bg-bk-40 rounded-lg">
          <h3 className="text-md font-semibold text-fg-30 mb-2">Usage Example</h3>
          <pre className="text-fg-60 text-sm overflow-x-auto">
{`import { FileIcon } from '@/components/code-editor/icons/file-icons';

// Basic usage
<FileIcon filename="app.js" size={16} />

// Folder usage
<FileIcon 
  filename="components" 
  isDirectory={true} 
  isOpen={true} 
  size={16} 
/>

// With custom className
<FileIcon 
  filename="styles.css" 
  size={20} 
  className="text-blue-500" 
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default IconShowcase;