// frontend/src/components/DesignSystem.tsx
// Jednotný design systém pro konzistentní vzhled napříč aplikací

// Definice typů pro theming
export type ThemeColors = {
  primary: {
    main: string;
    hover: string;
    text: string;
    light: string;
    dark: string;
  };
  secondary: {
    main: string;
    hover: string;
    text: string;
  };
  success: {
    main: string;
    hover: string;
    text: string;
    light: string;
  };
  danger: {
    main: string;
    hover: string;
    text: string;
    light: string;
  };
  warning: {
    main: string;
    hover: string;
    text: string;
    light: string;
  };
  info: {
    main: string;
    hover: string;
    text: string;
    light: string;
  };
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
};

export type ThemeSpacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
};

export type ThemeFontSizes = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
};

export type ThemeShadows = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

export type ThemeRadii = {
  sm: string;
  md: string;
  lg: string;
  full: string;
};

// Hlavní definice barev a stylů
export const colors: ThemeColors = {
  primary: {
    main: '#3b82f6', // Blue-500
    hover: '#2563eb', // Blue-600
    text: '#ffffff',
    light: '#eff6ff', // Blue-50
    dark: '#1e40af', // Blue-800
  },
  secondary: {
    main: '#6b7280', // Gray-500
    hover: '#4b5563', // Gray-600
    text: '#ffffff',
  },
  success: {
    main: '#10b981', // Green-500
    hover: '#059669', // Green-600
    text: '#ffffff',
    light: '#d1fae5', // Green-50
  },
  danger: {
    main: '#ef4444', // Red-500
    hover: '#dc2626', // Red-600
    text: '#ffffff',
    light: '#fee2e2', // Red-50
  },
  warning: {
    main: '#f59e0b', // Amber-500
    hover: '#d97706', // Amber-600
    text: '#ffffff',
    light: '#fffbeb', // Amber-50
  },
  info: {
    main: '#3b82f6', // Blue-500
    hover: '#2563eb', // Blue-600
    text: '#ffffff',
    light: '#eff6ff', // Blue-50
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Rozestupy pro padding, margin atd.
export const spacing: ThemeSpacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
};

// Velikosti fontů
export const fontSizes: ThemeFontSizes = {
  xs: '0.75rem',  // 12px
  sm: '0.875rem', // 14px
  md: '1rem',     // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem',  // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
};

// Stíny
export const shadows: ThemeShadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Zaoblení rohů
export const radii: ThemeRadii = {
  sm: '0.125rem', // 2px
  md: '0.25rem',  // 4px
  lg: '0.5rem',   // 8px
  full: '9999px', // Plně zaoblené
};

// Styly pro typografii
export const typography = {
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  pageTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: fontSizes.md,
    color: colors.gray[700],
    lineHeight: 1.5,
  },
  smallText: {
    fontSize: fontSizes.sm,
    color: colors.gray[600],
  },
};

// Styly pro containery
export const containers = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    boxShadow: shadows.sm,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: '#ffffff',
    boxShadow: shadows.sm,
    marginBottom: spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

// Styly pro tabulky
export const tables = {
  container: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    overflow: 'hidden',
    boxShadow: shadows.sm,
  },
  header: {
    padding: `${spacing.sm} ${spacing.md}`,
    textAlign: 'left',
    borderBottom: `1px solid ${colors.gray[200]}`,
    backgroundColor: colors.gray[50],
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    color: colors.gray[600],
    textTransform: 'uppercase',
  },
  cell: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderBottom: `1px solid ${colors.gray[200]}`,
    fontSize: fontSizes.sm,
  },
};

// Styly pro formuláře
export const forms = {
  label: {
    display: 'block',
    marginBottom: spacing.xs,
    fontWeight: 'bold',
    fontSize: fontSizes.sm,
    color: colors.gray[700],
  },
  input: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: radii.md,
    fontSize: fontSizes.md,
    lineHeight: 1.5,
    '&:focus': {
      outline: 'none',
      borderColor: colors.primary.main,
      boxShadow: `0 0 0 3px ${colors.primary.light}`,
    },
  },
  select: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: radii.md,
    fontSize: fontSizes.md,
    lineHeight: 1.5,
    backgroundColor: '#ffffff',
    '&:focus': {
      outline: 'none',
      borderColor: colors.primary.main,
      boxShadow: `0 0 0 3px ${colors.primary.light}`,
    },
  },
  checkbox: {
    marginRight: spacing.xs,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
};

// Styly pro tlačítka
export const buttons = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radii.md,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
    border: 'none',
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  primary: {
    backgroundColor: colors.primary.main,
    color: colors.primary.text,
    '&:hover:not(:disabled)': {
      backgroundColor: colors.primary.hover,
    },
  },
  secondary: {
    backgroundColor: colors.secondary.main,
    color: colors.secondary.text,
    '&:hover:not(:disabled)': {
      backgroundColor: colors.secondary.hover,
    },
  },
  success: {
    backgroundColor: colors.success.main,
    color: colors.success.text,
    '&:hover:not(:disabled)': {
      backgroundColor: colors.success.hover,
    },
  },
  danger: {
    backgroundColor: colors.danger.main,
    color: colors.danger.text,
    '&:hover:not(:disabled)': {
      backgroundColor: colors.danger.hover,
    },
  },
  outline: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.gray[300]}`,
    color: colors.gray[700],
    '&:hover:not(:disabled)': {
      backgroundColor: colors.gray[50],
    },
  },
  link: {
    backgroundColor: 'transparent',
    color: colors.primary.main,
    padding: 0,
    fontWeight: 'normal',
    '&:hover:not(:disabled)': {
      color: colors.primary.hover,
      textDecoration: 'underline',
    },
  },
  sm: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: fontSizes.xs,
  },
  lg: {
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: fontSizes.md,
  },
};

// Styly pro state messages (success, error, etc.)
export const statusMessage = {
  base: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  success: {
    backgroundColor: colors.success.light,
    color: colors.success.hover,
    borderLeft: `4px solid ${colors.success.main}`,
  },
  error: {
    backgroundColor: colors.danger.light,
    color: colors.danger.hover,
    borderLeft: `4px solid ${colors.danger.main}`,
  },
  warning: {
    backgroundColor: colors.warning.light,
    color: colors.warning.hover,
    borderLeft: `4px solid ${colors.warning.main}`,
  },
  info: {
    backgroundColor: colors.info.light,
    color: colors.info.hover,
    borderLeft: `4px solid ${colors.info.main}`,
  },
};

// Styly pro modaly
export const modals = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    zIndex: 50,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: radii.lg,
    boxShadow: shadows.xl,
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
  },
  header: {
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    margin: 0,
  },
  body: {
    padding: spacing.lg,
    overflowY: 'auto',
  },
  footer: {
    padding: `${spacing.md} ${spacing.lg}`,
    borderTop: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: fontSizes['2xl'],
    cursor: 'pointer',
    color: colors.gray[500],
    '&:hover': {
      color: colors.gray[700],
    },
  },
};

// Pomocné funkce pro kombinování stylů s defaultními hodnotami
export const mergeStyles = (baseStyle: Record<string, any>, overrideStyle?: Record<string, any>) => {
  if (!overrideStyle) return baseStyle;
  return { ...baseStyle, ...overrideStyle };
};

// Komponenty pro design systém

// Button komponenta s různými variantami
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  style,
  ...props
}) => {
  let buttonStyle = { ...buttons.base };
  
  // Varianta tlačítka
  switch (variant) {
    case 'primary':
      buttonStyle = { ...buttonStyle, ...buttons.primary };
      break;
    case 'secondary':
      buttonStyle = { ...buttonStyle, ...buttons.secondary };
      break;
    case 'success':
      buttonStyle = { ...buttonStyle, ...buttons.success };
      break;
    case 'danger':
      buttonStyle = { ...buttonStyle, ...buttons.danger };
      break;
    case 'outline':
      buttonStyle = { ...buttonStyle, ...buttons.outline };
      break;
    case 'link':
      buttonStyle = { ...buttonStyle, ...buttons.link };
      break;
  }
  
  // Velikost tlačítka
  switch (size) {
    case 'sm':
      buttonStyle = { ...buttonStyle, ...buttons.sm };
      break;
    case 'lg':
      buttonStyle = { ...buttonStyle, ...buttons.lg };
      break;
  }
  
  // Plná šířka tlačítka
  if (fullWidth) {
    buttonStyle.width = '100%';
  }
  
  return (
    <button
      style={{ ...buttonStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};

// Input komponenta s labelem
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  style,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div style={forms.fieldGroup}>
      {label && (
        <label 
          htmlFor={inputId} 
          style={forms.label}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{ ...forms.input, ...(error ? { borderColor: colors.danger.main } : {}), ...style }}
        {...props}
      />
      {error && (
        <div style={{ color: colors.danger.main, fontSize: fontSizes.sm, marginTop: spacing.xs }}>
          {error}
        </div>
      )}
    </div>
  );
};

// Select komponenta s labelem
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string, label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  id,
  options,
  style,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div style={forms.fieldGroup}>
      {label && (
        <label 
          htmlFor={selectId} 
          style={forms.label}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        style={{ ...forms.select, ...(error ? { borderColor: colors.danger.main } : {}), ...style }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div style={{ color: colors.danger.main, fontSize: fontSizes.sm, marginTop: spacing.xs }}>
          {error}
        </div>
      )}
    </div>
  );
};

// Card komponenta pro obsahové boxy
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => {
  return (
    <div style={{ ...containers.card, ...style }}>
      {title && <h2 style={typography.cardTitle}>{title}</h2>}
      {children}
    </div>
  );
};

// StatusMessage komponenta pro zobrazení stavových zpráv
export interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ type, children, style }) => {
  let messageStyle = { ...statusMessage.base };
  
  switch (type) {
    case 'success':
      messageStyle = { ...messageStyle, ...statusMessage.success };
      break;
    case 'error':
      messageStyle = { ...messageStyle, ...statusMessage.error };
      break;
    case 'warning':
      messageStyle = { ...messageStyle, ...statusMessage.warning };
      break;
    case 'info':
      messageStyle = { ...messageStyle, ...statusMessage.info };
      break;
  }
  
  return (
    <div style={{ ...messageStyle, ...style }}>
      {children}
    </div>
  );
};

// Modal komponenta
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '500px'
}) => {
  if (!isOpen) return null;
  
  return (
    <div style={modals.overlay}>
      <div style={{ ...modals.container, maxWidth }}>
        <div style={modals.header}>
          <h3 style={modals.title}>{title}</h3>
          <button onClick={onClose} style={modals.closeButton}>
            &times;
          </button>
        </div>
        <div style={modals.body}>
          {children}
        </div>
        {footer && (
          <div style={modals.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Table komponenta pro zobrazení tabulkových dat
export interface TableProps {
  columns: Array<{
    key: string;
    header: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, record: any) => React.ReactNode;
  }>;
  data: Array<any>;
  style?: React.CSSProperties;
}

export const Table: React.FC<TableProps> = ({ columns, data, style }) => {
  return (
    <table style={{ ...tables.container, ...style }}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th 
              key={column.key} 
              style={{ 
                ...tables.header, 
                width: column.width,
                textAlign: column.align || 'left' as any
              }}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((record, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td 
                key={`${index}-${column.key}`} 
                style={{ 
                  ...tables.cell, 
                  textAlign: column.align || 'left' as any
                }}
              >
                {column.render 
                  ? column.render(record[column.key], record) 
                  : record[column.key]}
              </td>
            ))}
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td 
              colSpan={columns.length} 
              style={{ ...tables.cell, textAlign: 'center', padding: spacing.xl }}
            >
              Žádná data k zobrazení
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

// Layout komponenta s hlavičkou a obsahem
export interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, children, actions }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.gray[50] }}>
      <header style={containers.header}>
        <h1 style={typography.pageTitle}>{title}</h1>
        {actions && <div>{actions}</div>}
      </header>
      <main style={containers.page}>
        {children}
      </main>
    </div>
  );
};

// Grid layout systém
export interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: keyof ThemeSpacing;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  columns = 12, 
  gap = 'md',
  style
}) => {
  return (
    <div 
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing[gap],
        ...style
      }}
    >
      {children}
    </div>
  );
};

export interface GridItemProps {
  children: React.ReactNode;
  span?: number;
  style?: React.CSSProperties;
}

export const GridItem: React.FC<GridItemProps> = ({ 
  children, 
  span = 1,
  style
}) => {
  return (
    <div 
      style={{ 
        gridColumn: `span ${span}`,
        ...style
      }}
    >
      {children}
    </div>
  );
};

// Exportujeme vše pod názvem DesignSystem pro jednodušší import
const DesignSystem = {
  colors,
  spacing,
  fontSizes,
  shadows,
  radii,
  typography,
  containers,
  tables,
  forms,
  buttons,
  statusMessage,
  modals,
  mergeStyles,
  Button,
  Input,
  Select,
  Card,
  StatusMessage,
  Modal,
  Table,
  PageLayout,
  Grid,
  GridItem
};

export default DesignSystem;
