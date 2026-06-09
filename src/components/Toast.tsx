import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<{
  notify: (message: string, kind?: ToastKind) => void
} | null>(null)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = ++counter
      setToasts((t) => [...t, { id, kind, message }])
      setTimeout(() => remove(id), 4200)
    },
    [remove]
  )

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-night-800/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur animate-[fadeIn_.15s_ease-out]"
          >
            {t.kind === 'success' && (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            )}
            {t.kind === 'error' && (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            )}
            {t.kind === 'info' && (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
            )}
            <p className="flex-1 text-sm text-slate-200">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>')
  return ctx
}
