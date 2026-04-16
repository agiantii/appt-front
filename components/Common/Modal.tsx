import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'default' | 'blackWhite';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  theme = 'default'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-[360px]',
    md: 'w-[480px]',
    lg: 'w-[640px]'
  };

  const isBlackWhite = theme === 'blackWhite';
  const containerClasses = isBlackWhite
    ? 'bg-white dark:bg-black border border-black/70 dark:border-white/70 rounded-2xl'
    : 'bg-card border border-border rounded-2xl';

  const headerBorderClasses = isBlackWhite
    ? 'border-b border-black/40 dark:border-white/40'
    : 'border-b border-border';

  const footerBorderClasses = isBlackWhite
    ? 'border-t border-black/40 dark:border-white/40'
    : 'border-t border-border';

  const titleClasses = isBlackWhite ? 'text-black dark:text-white' : 'text-foreground';

  const closeButtonClasses = isBlackWhite
    ? 'p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-black dark:text-white hover:text-black dark:hover:text-white transition-colors'
    : 'p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className={`absolute inset-0 ${isBlackWhite ? 'bg-black/70' : 'bg-black/60'} backdrop-blur-sm`} 
        onClick={onClose}
      />
      <div className={`relative ${sizeClasses[size]} ${containerClasses} shadow-2xl animate-in fade-in zoom-in-95 duration-200`}>
        <div className={`flex items-center justify-between px-5 py-4 ${headerBorderClasses}`}>
          <h3 className={`text-sm font-semibold ${titleClasses}`}>{title}</h3>
          <button 
            onClick={onClose}
            className={closeButtonClasses}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className={`flex items-center justify-end gap-3 px-5 py-4 ${footerBorderClasses}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'warning'
}) => {
  const typeStyles = {
    danger: 'bg-destructive hover:bg-destructive/90 text-foreground',
    warning: 'bg-warning hover:bg-warning/90 text-foreground',
    info: 'bg-info hover:bg-info/90 text-foreground'
  };

  const iconColors = {
    danger: 'text-destructive',
    warning: 'text-warning',
    info: 'text-info'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${typeStyles[type]}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder = '',
  defaultValue = '',
  confirmText = '确认',
  cancelText = '取消'
}) => {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmText}
          </button>
        </>
      }
    >
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        placeholder={placeholder}
        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
      />
    </Modal>
  );
};
