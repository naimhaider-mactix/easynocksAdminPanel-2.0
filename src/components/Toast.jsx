// ─────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
  ),
  error: <XCircle size={16} className="text-red-500 flex-shrink-0" />,
  warning: <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />,
  info: <Info size={16} className="text-blue-500 flex-shrink-0" />,
};

const STYLES = {
  success: "border-emerald-200 bg-emerald-50",
  error: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      duration,
    );
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-[13px] font-medium text-gray-800
                        pointer-events-auto min-w-[260px] max-w-[360px]
                        ${STYLES[t.type]}
                        animate-[slideInRight_0.3s_ease]`}
            style={{ animation: "slideInRight 0.3s ease" }}
          >
            {ICONS[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─────────────────────────────────────────────
// Confirm Modal
// ─────────────────────────────────────────────
import { AlertTriangle } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmClass,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ animation: "fadeIn 0.15s ease" }}
        onClick={onCancel}
      />
      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.2)] w-full max-w-[380px] p-6"
        style={{ animation: "scaleIn 0.2s ease" }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[15px] text-gray-900 mb-1">
              {title}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all ${confirmClass ?? "bg-amber-700 hover:bg-amber-800"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
