/**
 * File Icons System for Code Editor
 * Provides scalable, theme-aware file type icons
 */

import React from 'react';

// Default file icon (fallback)
export const DefaultFileIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" 
      fill="currentColor"
      opacity="0.7"
    />
  </svg>
);

// Folder icon
export const FolderIcon: React.FC<{ size?: number; className?: string; isOpen?: boolean }> = ({ 
  size = 16, 
  className = "",
  isOpen = false 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {isOpen ? (
      <path 
        d="M19 20H4C2.89 20 2 19.1 2 18V6C2 4.89 2.89 4 4 4H10L12 6H19C20.1 6 21 6.89 21 8H21L4 8V18L6.14 10H23.21L20.93 18.5C20.7 19.37 19.92 20 19 20Z" 
        fill="#60A5FA"
      />
    ) : (
      <path 
        d="M10 4H4C2.89 4 2 4.89 2 6V18C2 19.1 2.89 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.89 21.1 6 20 6H12L10 4Z" 
        fill="#60A5FA"
      />
    )}
  </svg>
);

// JavaScript icon
export const JavaScriptIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M8.38255 7.31818H10.5104V14.4176C10.5104 15.0739 10.3629 15.6439 10.0679 16.1278C9.77625 16.6117 9.37024 16.9846 8.84988 17.2464C8.32952 17.5083 7.72464 17.6392 7.03525 17.6392C6.42208 17.6392 5.86526 17.5315 5.36479 17.3161C4.86763 17.0973 4.47322 16.7659 4.18155 16.3217C3.88989 15.8743 3.74571 15.3125 3.74902 14.6364H5.89178C5.89841 14.9048 5.9531 15.1352 6.05584 15.3274C6.1619 15.5163 6.30608 15.6622 6.48837 15.7649C6.67398 15.8643 6.89273 15.9141 7.14462 15.9141C7.40977 15.9141 7.63349 15.8577 7.81578 15.745C8.00139 15.629 8.14225 15.46 8.23837 15.2379C8.33449 15.0159 8.38255 14.7424 8.38255 14.4176V7.31818ZM17.8137 10.2464C17.7739 9.84541 17.6032 9.53385 17.3016 9.31179C17 9.08972 16.5906 8.97869 16.0736 8.97869C15.7223 8.97869 15.4256 9.02841 15.1837 9.12784C14.9417 9.22396 14.7561 9.35819 14.6269 9.53054C14.5009 9.70289 14.4379 9.89844 14.4379 10.1172C14.4313 10.2995 14.4694 10.4586 14.5523 10.5945C14.6385 10.7304 14.7561 10.848 14.9053 10.9474C15.0544 11.0436 15.2268 11.1281 15.4223 11.201C15.6179 11.2706 15.8267 11.3303 16.0487 11.38L16.9635 11.5987C17.4076 11.6982 17.8153 11.8307 18.1865 11.9964C18.5577 12.1622 18.8792 12.366 19.151 12.608C19.4228 12.8499 19.6333 13.1349 19.7824 13.4631C19.9349 13.7912 20.0128 14.1674 20.0161 14.5916C20.0128 15.2147 19.8537 15.755 19.5388 16.2124C19.2272 16.6664 18.7765 17.0194 18.1865 17.2713C17.5999 17.5199 16.8923 17.6442 16.0637 17.6442C15.2417 17.6442 14.5258 17.5182 13.9159 17.2663C13.3094 17.0144 12.8354 16.6416 12.4941 16.1477C12.156 15.6506 11.9787 15.0357 11.9621 14.3033H14.0452C14.0684 14.6446 14.1662 14.9297 14.3385 15.1584C14.5142 15.3838 14.7478 15.5545 15.0395 15.6705C15.3345 15.7831 15.6676 15.8395 16.0388 15.8395C16.4034 15.8395 16.7199 15.7865 16.9884 15.6804C17.2602 15.5743 17.4706 15.4268 17.6198 15.2379C17.7689 15.049 17.8435 14.8319 17.8435 14.5866C17.8435 14.358 17.7755 14.1657 17.6396 14.0099C17.5071 13.8542 17.3115 13.7216 17.053 13.6122C16.7978 13.5028 16.4846 13.4034 16.1134 13.3139L15.0047 13.0355C14.1463 12.8267 13.4685 12.5002 12.9713 12.0561C12.4742 11.612 12.2272 11.0137 12.2306 10.2614C12.2272 9.64489 12.3913 9.1063 12.7227 8.6456C13.0575 8.1849 13.5165 7.82528 14.0999 7.56676C14.6832 7.30824 15.3461 7.17898 16.0885 7.17898C16.8442 7.17898 17.5038 7.30824 18.0672 7.56676C18.634 7.82528 19.0748 8.1849 19.3896 8.6456C19.7045 9.1063 19.8669 9.63991 19.8769 10.2464H17.8137Z" 
      fill="#F59E0B"
    />
  </svg>
);

// React JSX icon
export const ReactIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 13.6773C12.9263 13.6773 13.6773 12.9263 13.6773 12C13.6773 11.0737 12.9263 10.3227 12 10.3227C11.0737 10.3227 10.3227 11.0737 10.3227 12C10.3227 12.9263 11.0737 13.6773 12 13.6773Z" 
      fill="#38BDF8"
    />
    <path 
      d="M12 15.4364C16.9706 15.4364 21 13.8979 21 12C21 10.1022 16.9706 8.56366 12 8.56366C7.02944 8.56366 3 10.1022 3 12C3 13.8979 7.02944 15.4364 12 15.4364Z" 
      stroke="#38BDF8"
    />
    <path 
      d="M9.02403 13.7182C11.5093 18.0228 14.8564 20.7432 16.5 19.7942C18.1436 18.8453 17.4613 14.5865 14.976 10.2818C12.4907 5.9772 9.14359 3.25687 7.5 4.20579C5.85642 5.15472 6.53875 9.41357 9.02403 13.7182Z" 
      stroke="#38BDF8"
    />
    <path 
      d="M9.02403 10.2818C6.53875 14.5865 5.85642 18.8453 7.5 19.7943C9.14359 20.7432 12.4907 18.0228 14.976 13.7182C17.4613 9.41358 18.1436 5.15472 16.5 4.2058C14.8564 3.25687 11.5093 5.97721 9.02403 10.2818Z" 
      stroke="#38BDF8"
    />
  </svg>
);

// TypeScript icon
export const TypeScriptIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M3.23446 9.09304V7.31818H11.5967V9.09304H8.47949V17.5H6.35165V9.09304H3.23446ZM18.4972 10.2464C18.4575 9.84541 18.2868 9.53385 17.9852 9.31179C17.6836 9.08972 17.2742 8.97869 16.7572 8.97869C16.4059 8.97869 16.1092 9.02841 15.8673 9.12784C15.6253 9.22396 15.4397 9.35819 15.3105 9.53054C15.1845 9.70289 15.1215 9.89844 15.1215 10.1172C15.1149 10.2995 15.153 10.4586 15.2359 10.5945C15.3221 10.7304 15.4397 10.848 15.5889 10.9474C15.738 11.0436 15.9104 11.1281 16.1059 11.201C16.3015 11.2706 16.5103 11.3303 16.7323 11.38L17.6471 11.5987C18.0912 11.6982 18.4989 11.8307 18.8701 11.9964C19.2413 12.1622 19.5628 12.366 19.8346 12.608C20.1064 12.8499 20.3169 13.1349 20.466 13.4631C20.6185 13.7912 20.6963 14.1674 20.6997 14.5916C20.6963 15.2147 20.5373 15.755 20.2224 16.2124C19.9108 16.6664 19.4601 17.0194 18.8701 17.2713C18.2835 17.5199 17.5758 17.6442 16.7472 17.6442C15.9253 17.6442 15.2094 17.5182 14.5995 17.2663C13.993 17.0144 13.519 16.6416 13.1776 16.1477C12.8396 15.6506 12.6623 15.0357 12.6457 14.3033H14.7288C14.752 14.6446 14.8498 14.9297 15.0221 15.1584C15.1978 15.3838 15.4314 15.5545 15.7231 15.6705C16.0181 15.7831 16.3512 15.8395 16.7224 15.8395C17.087 15.8395 17.4035 15.7865 17.672 15.6804C17.9437 15.5743 18.1542 15.4268 18.3034 15.2379C18.4525 15.049 18.5271 14.8319 18.5271 14.5866C18.5271 14.358 18.4591 14.1657 18.3232 14.0099C18.1907 13.8542 17.9951 13.7216 17.7366 13.6122C17.4814 13.5028 17.1682 13.4034 16.797 13.3139L15.6883 13.0355C14.8299 12.8267 14.1521 12.5002 13.6549 12.0561C13.1578 11.612 12.9108 11.0137 12.9142 10.2614C12.9108 9.64489 13.0749 9.1063 13.4063 8.6456C13.7411 8.1849 14.2001 7.82528 14.7835 7.56676C15.3668 7.30824 16.0297 7.17898 16.7721 7.17898C17.5278 7.17898 18.1874 7.30824 18.7508 7.56676C19.3176 7.82528 19.7584 8.1849 20.0732 8.6456C20.3881 9.1063 20.5505 9.63991 20.5605 10.2464H18.4972Z" 
      fill="#2563EB"
    />
  </svg>
);

// React TypeScript icon
export const ReactTSIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 13.6773C12.9263 13.6773 13.6773 12.9263 13.6773 12C13.6773 11.0737 12.9263 10.3227 12 10.3227C11.0737 10.3227 10.3227 11.0737 10.3227 12C10.3227 12.9263 11.0737 13.6773 12 13.6773Z" 
      fill="#2563EB"
    />
    <path 
      d="M12 15.4364C16.9706 15.4364 21 13.8979 21 12C21 10.1022 16.9706 8.56366 12 8.56366C7.02944 8.56366 3 10.1022 3 12C3 13.8979 7.02944 15.4364 12 15.4364Z" 
      stroke="#2563EB"
    />
    <path 
      d="M9.02403 13.7182C11.5093 18.0228 14.8564 20.7432 16.5 19.7942C18.1436 18.8453 17.4613 14.5865 14.976 10.2818C12.4907 5.9772 9.14359 3.25687 7.5 4.20579C5.85642 5.15472 6.53875 9.41357 9.02403 13.7182Z" 
      stroke="#2563EB"
    />
    <path 
      d="M9.02403 10.2818C6.53875 14.5865 5.85642 18.8453 7.5 19.7943C9.14359 20.7432 12.4907 18.0228 14.976 13.7182C17.4613 9.41358 18.1436 5.15472 16.5 4.2058C14.8564 3.25687 11.5093 5.97721 9.02403 10.2818Z" 
      stroke="#2563EB"
    />
  </svg>
);

// JSON icon
export const JsonIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M4.77778 6.66667C4.77778 5.19391 5.97169 4 7.44444 4C7.93536 4 8.33333 4.39797 8.33333 4.88889C8.33333 5.3798 7.93536 5.77778 7.44444 5.77778C6.95353 5.77778 6.55556 6.17575 6.55556 6.66667V10.1675C6.55556 10.8682 6.28251 11.5173 5.82622 12C6.28251 12.4827 6.55556 13.1318 6.55556 13.8325V17.3333C6.55556 17.8243 6.95353 18.2222 7.44444 18.2222C7.93536 18.2222 8.33333 18.6202 8.33333 19.1111C8.33333 19.602 7.93536 20 7.44444 20C5.97169 20 4.77778 18.8061 4.77778 17.3333V13.8325C4.77778 13.4246 4.50018 13.0691 4.10448 12.9701L3.6733 12.8623C3.2776 12.7635 3 12.4079 3 12C3 11.5921 3.2776 11.2365 3.6733 11.1377L4.10448 11.0299C4.50018 10.9309 4.77778 10.5754 4.77778 10.1675V6.66667ZM19 6.66667C19 5.19391 17.8061 4 16.3333 4C15.8424 4 15.4444 4.39797 15.4444 4.88889C15.4444 5.3798 15.8424 5.77778 16.3333 5.77778C16.8243 5.77778 17.2222 6.17575 17.2222 6.66667V10.1675C17.2222 10.8682 17.4953 11.5173 17.9516 12C17.4953 12.4827 17.2222 13.1318 17.2222 13.8325V17.3333C17.2222 17.8243 16.8243 18.2222 16.3333 18.2222C15.8424 18.2222 15.4444 18.6202 15.4444 19.1111C15.4444 19.602 15.8424 20 16.3333 20C17.8061 20 19 18.8061 19 17.3333V13.8325C19 13.4246 19.2776 13.0691 19.6733 12.9701L20.1044 12.8623C20.5002 12.7635 20.7778 12.4079 20.7778 12C20.7778 11.5921 20.5002 11.2365 20.1044 11.1377L19.6733 11.0299C19.2776 10.9309 19 10.5754 19 10.1675V6.66667Z" 
      fill="#2563EB"
    />
  </svg>
);

// Markdown icon
export const MarkdownIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M3 15.7143V8H5.32258L7.64516 10.8361L9.96774 8H12.2903V15.7143H9.96774V11.2899L7.64516 14.1261L5.32258 11.2899V15.7143H3ZM17.5161 15.7143L14.0323 11.9706H16.3548V8H18.6774V11.9706H21L17.5161 15.7143Z" 
      fill="#60A5FA"
    />
  </svg>
);

// Shell script icon
export const ShellIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 25 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M4.33643 17L10.3364 11L4.33643 5" 
      stroke="#14B8A6" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12.3364 19H20.3364" 
      stroke="#14B8A6" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// PostCSS icon
export const PostCSSIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M20.7986 12C20.7986 14.3335 19.8716 16.5715 18.2215 18.2215C16.5715 19.8716 14.3335 20.7986 12 20.7986C9.66646 20.7986 7.42851 19.8716 5.77846 18.2215C4.12841 16.5715 3.20142 14.3335 3.20142 12C3.20142 9.66648 4.12841 7.42853 5.77846 5.77847C7.42851 4.12842 9.66646 3.20143 12 3.20143C14.3335 3.20143 16.5715 4.12842 18.2215 5.77847C19.8716 7.42853 20.7986 9.66648 20.7986 12" 
      stroke="#F87171" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M19.772 15.8984H4.22797L11.9998 4.67896L19.772 15.8984Z" 
      stroke="#F87171" 
      strokeWidth="2" 
      strokeLinecap="square" 
      strokeLinejoin="round"
    />
    <path 
      d="M8.88483 9.17352H15.1151V15.4038H8.88483V9.17352Z" 
      stroke="#F87171" 
      strokeWidth="2" 
      strokeLinecap="square" 
      strokeLinejoin="round"
    />
  </svg>
);

// Supabase icon
export const SupabaseIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size}
    className={className}
  >
    <defs>
      <linearGradient id="a" x1="53.974" x2="94.163" y1="54.974" y2="71.829" gradientTransform="scale(.22936 .21239)" gradientUnits="userSpaceOnUse">
        <stop offset="0" style={{stopColor:"#249361", stopOpacity:1}}/>
        <stop offset="1" style={{stopColor:"#3ecf8e", stopOpacity:1}}/>
      </linearGradient>
      <linearGradient id="b" x1="36.156" x2="54.484" y1="30.578" y2="65.081" gradientTransform="scale(.22936 .21239)" gradientUnits="userSpaceOnUse">
        <stop offset="0" style={{stopColor:"#000", stopOpacity:.2}}/>
        <stop offset="1" style={{stopColor:"#000", stopOpacity:0}}/>
      </linearGradient>
    </defs>
    <path d="M14.613 23.422c-.656.765-1.988.348-2.004-.629l-.23-14.285H22.75c1.879 0 2.926 2.012 1.758 3.37Zm0 0" style={{stroke:"none", fillRule:"nonzero", fill:"url(#a)"}}/>
    <path d="M14.613 23.422c-.656.765-1.988.348-2.004-.629l-.23-14.285H22.75c1.879 0 2.926 2.012 1.758 3.37Zm0 0" style={{stroke:"none", fillRule:"nonzero", fill:"url(#b)"}}/>
    <path d="M10.395.441c.656-.765 1.984-.347 2 .63l.101 14.284H2.254c-1.879 0-2.926-2.011-1.758-3.37Zm0 0" style={{stroke:"none", fillRule:"nonzero", fill:"#3ecf8e", fillOpacity:1}}/>
  </svg>
);

// Next.js icon
export const NextJSIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="none"
    className={className}
  >
    <path fill="url(#a)" d="M15.889 6.4h1.867v8.4h-1.867z" />
    <path fill="url(#b)" d="M7.333 7.55V6.4h1.471l12.259 15.69-1.471 1.15L7.333 7.55Z" />
    <path fill="#64748B" d="M6.4 6.4h1.867v11.2H6.4z" />
    <defs>
      <linearGradient id="a" x1="16.822" x2="16.822" y1="9.5" y2="14.8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#64748B" />
        <stop offset="1" stopColor="#64748B" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="b" x1="14.567" x2="20.327" y1="15.267" y2="22.665" gradientUnits="userSpaceOnUse">
        <stop stopColor="#64748B" />
        <stop offset="1" stopColor="#64748B" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

// TSConfig icon
export const TSConfigIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M15.9694 13.5604C16.2655 14.6244 15.6499 15.7305 14.6137 15.9966L14.0642 16.1376C14.0219 16.4184 14 16.7065 14 17C14 17.3072 14.024 17.6083 14.0702 17.9012L14.5776 18.028C15.6241 18.2896 16.2462 19.407 15.9415 20.4781L15.7663 21.0942C16.1794 21.4706 16.6501 21.7762 17.1624 21.9936L17.6264 21.4873C18.3681 20.6781 19.6119 20.6783 20.3535 21.4878L20.8226 22C21.3338 21.785 21.8041 21.4823 22.2174 21.1091L22.0311 20.4397C21.735 19.3756 22.3506 18.2695 23.3868 18.0035L23.9358 17.8625C23.9781 17.5817 24 17.2936 24 17C24 16.6929 23.976 16.3917 23.9298 16.0987L23.4228 15.972C22.3763 15.7105 21.7543 14.5931 22.059 13.5219L22.234 12.9063C21.821 12.5297 21.3502 12.2241 20.8379 12.0066L20.3741 12.5127C19.6324 13.322 18.3885 13.3217 17.647 12.5122L17.1778 12C16.6666 12.2149 16.1962 12.5175 15.783 12.8907L15.9694 13.5604ZM19 18.464C18.2469 18.464 17.6364 17.8085 17.6364 17C17.6364 16.1916 18.2469 15.5361 19 15.5361C19.7531 15.5361 20.3636 16.1916 20.3636 17C20.3636 17.8085 19.7531 18.464 19 18.464Z" 
      fill="#64748B"
    />
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M3.23447 7.31818V9.09304H6.35165V17.5H8.4795V9.09304H11.5967V7.31818H3.23447ZM17.9852 9.31179C18.2868 9.53385 18.4575 9.84541 18.4973 10.2464H19.793C20.0296 10.1243 20.2863 10.0475 20.5493 10.0189C20.5068 9.50559 20.3481 9.04781 20.0732 8.6456C19.7584 8.1849 19.3176 7.82528 18.7508 7.56676C18.1874 7.30824 17.5278 7.17898 16.7721 7.17898C16.0297 7.17898 15.3668 7.30824 14.7835 7.56676C14.2001 7.82528 13.7411 8.1849 13.4063 8.6456C13.0749 9.1063 12.9108 9.64489 12.9142 10.2614C12.9108 11.0137 13.1578 11.612 13.6549 12.0561C13.7247 12.1184 13.7979 12.1784 13.8748 12.236C13.9942 11.929 14.1846 11.6479 14.4384 11.4187C14.7182 11.166 15.0185 10.9351 15.337 10.7294C15.2995 10.6866 15.2658 10.6416 15.2359 10.5945C15.153 10.4586 15.1149 10.2995 15.1215 10.1172C15.1215 9.89844 15.1845 9.70289 15.3105 9.53054C15.4397 9.35819 15.6253 9.22396 15.8673 9.12784C16.1092 9.02841 16.4059 8.97869 16.7572 8.97869C17.2742 8.97869 17.6836 9.08973 17.9852 9.31179ZM12.6681 14.6665C12.8044 14.5256 12.96 14.4031 13.1312 14.3033H12.6457C12.6485 14.4277 12.656 14.5488 12.6681 14.6665Z" 
      fill="#2563EB"
    />
  </svg>
);

// SVG icon (for .svg files)
export const SVGIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="5" y="5" width="14" height="14" stroke="#52525B" strokeWidth="1.5"/>
    <rect x="3" y="3" width="4" height="4" rx="1" fill="#F472B6"/>
    <rect x="17" y="3" width="4" height="4" rx="1" fill="#F472B6"/>
    <rect x="17" y="17" width="4" height="4" rx="1" fill="#F472B6"/>
    <rect x="3" y="17" width="4" height="4" rx="1" fill="#F472B6"/>
  </svg>
);

// Git icon
export const GitIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M20.6613 11.1983L12.8016 3.33948C12.3493 2.88684 11.6153 2.88684 11.1625 3.33948L9.53048 4.97163L11.6006 7.04176C12.0819 6.87927 12.6335 6.98822 13.0169 7.37173C13.4023 7.75763 13.5105 8.31395 13.3439 8.79682L15.3392 10.7921C15.8219 10.6257 16.3788 10.7332 16.7643 11.1193C17.3032 11.658 17.3032 12.531 16.7643 13.0698C16.2253 13.6089 15.3524 13.6089 14.8131 13.0698C14.4079 12.6643 14.3077 12.069 14.5129 11.5697L12.6522 9.70896L12.652 14.6056C12.7834 14.6706 12.9074 14.7574 13.0168 14.8664C13.5556 15.4051 13.5556 16.2779 13.0168 16.8174C12.478 17.3561 11.6046 17.3561 11.0663 16.8174C10.5275 16.2779 10.5275 15.4051 11.0663 14.8664C11.1995 14.7335 11.3535 14.6329 11.5179 14.5655V9.62334C11.3535 9.55619 11.1996 9.45633 11.0662 9.32235C10.6581 8.91455 10.5598 8.31557 10.7691 7.8144L8.72837 5.77335L3.33959 11.162C2.8868 11.615 2.8868 12.349 3.33959 12.8017L11.1989 20.6605C11.6514 21.1132 12.3852 21.1132 12.8383 20.6605L20.6612 12.8388C21.1139 12.386 21.1139 11.6517 20.6612 11.1989" 
      fill="#F87171"
    />
  </svg>
);

// Text file icon (.txt)
export const TextIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="4" y="6" width="16" height="2" rx="1" fill="#64748B"/>
    <rect x="4" y="11" width="12" height="2" rx="1" fill="#64748B"/>
    <rect x="4" y="16" width="16" height="2" rx="1" fill="#64748B"/>
  </svg>
);

// Environment file icon (.env)
export const EnvIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M5.93871 5.3696C6.53094 7.4206 5.29981 9.55287 3.22737 10.0657L2.1283 10.3376C2.04383 10.8788 2 11.4342 2 12.0001C2 12.5921 2.04797 13.1725 2.14034 13.7373L3.15512 13.9817C5.24827 14.4859 6.49237 16.64 5.88302 18.7047L5.53253 19.8924C6.3588 20.6178 7.30021 21.207 8.32477 21.626L9.25282 20.6501C10.7362 19.0902 13.2239 19.0905 14.7069 20.6511L15.6451 21.6384C16.6676 21.2239 17.6083 20.6404 18.4347 19.921L18.0622 18.6306C17.47 16.5794 18.7011 14.4471 20.7736 13.9344L21.8717 13.6626C21.9562 13.1213 22 12.566 22 12.0001C22 11.408 21.952 10.8275 21.8597 10.2625L20.8456 10.0183C18.7527 9.51431 17.5086 7.36021 18.1179 5.29529L18.468 4.10856C17.6419 3.38275 16.7004 2.79352 15.6758 2.37436L14.7481 3.34982C13.2647 4.90999 10.7771 4.90943 9.29402 3.34888L8.35562 2.36157C7.33313 2.77584 6.39248 3.35923 5.56602 4.07864L5.93871 5.3696ZM12.0001 14.822C10.4937 14.822 9.27276 13.5586 9.27276 12.0001C9.27276 10.4416 10.4937 9.17812 12.0001 9.17812C13.5063 9.17812 14.7272 10.4416 14.7272 12.0001C14.7272 13.5586 13.5063 14.822 12.0001 14.822Z" 
      fill="#64748B"
    />
  </svg>
);

// Image file icon (.png, .jpg, .jpeg, .webp, .gif, .bmp, .ico)
export const ImageIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 16, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="#C084FC" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="15" cy="9" r="2" fill="#C084FC"/>
    <path d="M5 19L10.5858 13.4142C11.3668 12.6332 12.6332 12.6332 13.4142 13.4142L19 19" stroke="#C084FC" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

// File extension to icon mapping
export const FILE_ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  // JavaScript
  'js': JavaScriptIcon,
  'mjs': JavaScriptIcon,
  
  // React
  'jsx': ReactIcon,
  
  // TypeScript
  'ts': TypeScriptIcon,
  
  // React TypeScript
  'tsx': ReactTSIcon,
  
  // JSON
  'json': JsonIcon,
  'jsonc': JsonIcon,
  
  // Markdown
  'md': MarkdownIcon,
  'mdx': MarkdownIcon,
  
  // Shell
  'sh': ShellIcon,
  'bash': ShellIcon,
  'zsh': ShellIcon,
  
  // CSS
  'css': PostCSSIcon,
  'scss': PostCSSIcon,
  'sass': PostCSSIcon,
  'less': PostCSSIcon,
  'postcss': PostCSSIcon,
  
  // SVG files
  'svg': SVGIcon,
  
  // Text files
  'txt': TextIcon,
  'text': TextIcon,
  
  // Image files
  'png': ImageIcon,
  'jpg': ImageIcon,
  'jpeg': ImageIcon,
  'webp': ImageIcon,
  'gif': ImageIcon,
  'bmp': ImageIcon,
  'ico': ImageIcon,
  'tiff': ImageIcon,
  'tif': ImageIcon,
};

// Special filename to icon mapping
export const SPECIAL_FILE_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  // Config files
  'tsconfig.json': TSConfigIcon,
  'tsconfig.base.json': TSConfigIcon,
  'tsconfig.build.json': TSConfigIcon,
  
  // Next.js
  'next.config.js': NextJSIcon,
  'next.config.ts': NextJSIcon,
  'next.config.mjs': NextJSIcon,
  
  // Supabase
  'supabase': SupabaseIcon,
  
  // Git files
  '.git': GitIcon,
  '.gitignore': GitIcon,
  '.gitattributes': GitIcon,
  '.gitmodules': GitIcon,
  '.gitkeep': GitIcon,
  
  // Environment files
  '.env': EnvIcon,
  '.env.local': EnvIcon,
  '.env.development': EnvIcon,
  '.env.production': EnvIcon,
  '.env.staging': EnvIcon,
  '.env.test': EnvIcon,
  '.env.example': EnvIcon,
};

/**
 * Get the appropriate icon component for a file
 */
export const getFileIcon = (
  filename: string, 
  isDirectory: boolean = false
): React.FC<{ size?: number; className?: string; isOpen?: boolean }> => {
  if (isDirectory) {
    return FolderIcon as any;
  }
  
  // Check special filenames first
  const lowerFilename = filename.toLowerCase();
  if (SPECIAL_FILE_MAP[lowerFilename]) {
    return SPECIAL_FILE_MAP[lowerFilename] as any;
  }
  
  // Check by extension
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension && FILE_ICON_MAP[extension]) {
    return FILE_ICON_MAP[extension] as any;
  }
  
  // Default file icon
  return DefaultFileIcon as any;
};

/**
 * File Icon Component - Main component to use in file explorer
 */
export const FileIcon: React.FC<{
  filename: string;
  isDirectory?: boolean;
  isOpen?: boolean;
  size?: number;
  className?: string;
}> = ({ 
  filename, 
  isDirectory = false, 
  isOpen = false, 
  size = 16, 
  className = "" 
}) => {
  const IconComponent = getFileIcon(filename, isDirectory);
  
  return (
    <IconComponent 
      size={size} 
      className={className} 
      {...(isDirectory ? { isOpen } : {})}
    />
  );
};

export default FileIcon;