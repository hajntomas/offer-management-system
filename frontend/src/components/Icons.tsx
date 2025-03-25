import React from 'react';

// Typy ikon, které máme k dispozici
export type IconName = 
  'search' | 'filter' | 'chevron-down' | 'chevron-up' | 
  'columns' | 'settings' | 'refresh' | 'download' | 
  'list' | 'grid' | 'arrow-up' | 'arrow-down' | 
  'arrow-right' | 'tag' | 'package' | 'x';

// Základní vlastnosti ikony
interface IconProps {
  className?: string;
  size?: number;
}

// Komponenta pro ikonu s konkrétním názvem
interface IconComponentProps extends IconProps {
  name: IconName;
}

// Hlavní komponenta pro všechny ikony
export const Icon = ({ name, className = '', size = 24 }: IconComponentProps) => {
  const getSVGPath = (iconName: IconName) => {
    switch (iconName) {
      case 'search':
        return <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19ZM11 19L21 21L19 11" strokeLinecap="round" strokeLinejoin="round" />;
      case 'filter':
        return <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" strokeLinecap="round" strokeLinejoin="round" />;
      case 'chevron-down':
        return <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />;
      case 'chevron-up':
        return <path d="M18 15L12 9L6 15" strokeLinecap="round" strokeLinejoin="round" />;
      case 'list':
        return <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" strokeLinecap="round" strokeLinejoin="round" />;
      case 'grid':
        return <path d="M10 3H3V10H10V3ZM21 3H14V10H21V3ZM21 14H14V21H21V14ZM10 14H3V21H10V14Z" strokeLinecap="round" strokeLinejoin="round" />;
      case 'arrow-up':
        return <path d="M12 19V5M5 12L12 5L19 12" strokeLinecap="round" strokeLinejoin="round" />;
      case 'arrow-down':
        return <path d="M12 5V19M19 12L12 19L5 12" strokeLinecap="round" strokeLinejoin="round" />;
      case 'arrow-right':
        return <path d="M5 12H19M19 12L12 5M19 12L12 19" strokeLinecap="round" strokeLinejoin="round" />;
      case 'x':
        return <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />;
      case 'tag':
        return <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" strokeLinecap="round" strokeLinejoin="round" />;
      case 'package':
        return <path d="M16.5 9.4L7.5 4.21M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00204 12 2.00204C11.6489 2.00204 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" strokeLinecap="round" strokeLinejoin="round" />;
      case 'settings':
        return <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />;
      case 'refresh':
        return <path d="M23 4V10H17M1 20V14H7M3.51 9A9 9 0 0 1 21 12.94M20.49 15C17.7 19.5 11.7 20.9 7.2 18.1" strokeLinecap="round" strokeLinejoin="round" />;
      case 'download':
        return <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" strokeLinecap="round" strokeLinejoin="round" />;
      case 'columns':
        return <path d="M12 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H12M12 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H12M12 3V21" strokeLinecap="round" strokeLinejoin="round" />;
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {getSVGPath(name)}
    </svg>
  );
};

// Exportujeme jednotlivé komponenty ikon pro jednodušší použití
export const Search = (props: IconProps) => <Icon name="search" {...props} />;
export const Filter = (props: IconProps) => <Icon name="filter" {...props} />;
export const ChevronDown = (props: IconProps) => <Icon name="chevron-down" {...props} />;
export const ChevronUp = (props: IconProps) => <Icon name="chevron-up" {...props} />;
export const List = (props: IconProps) => <Icon name="list" {...props} />;
export const Grid = (props: IconProps) => <Icon name="grid" {...props} />;
export const ArrowUp = (props: IconProps) => <Icon name="arrow-up" {...props} />;
export const ArrowDown = (props: IconProps) => <Icon name="arrow-down" {...props} />;
export const ArrowRight = (props: IconProps) => <Icon name="arrow-right" {...props} />;
export const X = (props: IconProps) => <Icon name="x" {...props} />;
export const Tag = (props: IconProps) => <Icon name="tag" {...props} />;
export const Package = (props: IconProps) => <Icon name="package" {...props} />;
export const Settings = (props: IconProps) => <Icon name="settings" {...props} />;
export const RefreshCw = (props: IconProps) => <Icon name="refresh" {...props} />;
export const Download = (props: IconProps) => <Icon name="download" {...props} />;
export const Columns = (props: IconProps) => <Icon name="columns" {...props} />;
