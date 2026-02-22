import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-[360px]',
    md: 'w-[480px]',
    lg: 'w-[640px]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className={`relative ${sizeClasses[size]} bg-[#1c1c1f] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/5">
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
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white'
  };

  const iconColors = {
    danger: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400'
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
            className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
        <p className="text-sm text-white/70 leading-relaxed">{message}</p>
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
            className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="px-4 py-2 text-xs font-medium bg-white text-black hover:bg-white/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
        className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10"
      />
    </Modal>
  );
};
