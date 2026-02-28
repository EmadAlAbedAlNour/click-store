import React, { createContext, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const typeStyles = {
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    iconColor: 'text-emerald-600'
  },
  error: {
    icon: AlertTriangle,
    border: 'border-red-200',
    bar: 'bg-red-500',
    iconColor: 'text-red-600'
  },
  info: {
    icon: Info,
    border: 'border-blue-200',
    bar: 'bg-blue-500',
    iconColor: 'text-blue-600'
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [stackTopPx, setStackTopPx] = useState(16);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const pushToast = (message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    window.setTimeout(() => removeToast(id), duration);
    return id;
  };

  const value = { pushToast, removeToast };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    let rafId = null;
    const baseTop = 16;

    const updateOffset = () => {
      rafId = null;
      const navShell = document.querySelector('header .nav-shell');
      if (!navShell) {
        setStackTopPx((prev) => (prev === baseTop ? prev : baseTop));
        return;
      }
      const rect = navShell.getBoundingClientRect();
      const nextTop = Math.max(baseTop, Math.round(rect.bottom + 10));
      setStackTopPx((prev) => (prev === nextTop ? prev : nextTop));
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateOffset);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack fixed z-[220] flex flex-col gap-3 w-[min(92vw,360px)]" style={{ top: `${stackTopPx}px` }}>
        {toasts.map((toast) => {
          const style = typeStyles[toast.type] || typeStyles.info;
          const Icon = style.icon;
          return (
            <div key={toast.id} className={`relative overflow-hidden rounded-2xl border ${style.border} bg-white/92 dark:bg-slate-900/92 dark:border-white/10 shadow-2xl backdrop-blur-xl`}>
              <div className="p-3.5 flex items-start gap-3">
                <Icon size={18} className={style.iconColor} />
                <div className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 leading-5">{toast.message}</div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  aria-label="Close notification"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full ${style.bar} toast-progress`}
                  style={{ ['--toast-duration']: `${toast.duration}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToastNotifications = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToastNotifications must be used within ToastProvider');
  return context;
};
