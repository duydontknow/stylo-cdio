import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  bodyClassName,
  size = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full md:max-w-[95vw] h-full md:h-[95vh]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className={cn(
                "w-full bg-surface shadow-glass rounded-[2rem] md:rounded-3xl overflow-hidden pointer-events-auto",
                size === 'full' ? "rounded-none md:rounded-3xl" : "",
                sizes[size],
                className
              )}
            >
              {(title || onClose) && (
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 shrink-0">
                  {title && <h3 className="text-lg md:text-xl font-bold text-primary">{title}</h3>}
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="p-2 -mr-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}
              <div className={cn("p-5 md:p-6", bodyClassName)}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
