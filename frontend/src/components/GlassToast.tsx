import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastType = "success" | "error";

interface ToastState {
    show: boolean;
    msg: string;
    type: ToastType;
    id: number;
}

export function useToast() {
    const [toast, setToast] = useState<ToastState>({ show: false, msg: "", type: "success", id: 0 });

    const triggerToast = useCallback((msg: string, type: ToastType = "success") => {
        const id = Date.now();
        setToast({ show: true, msg, type, id });
        setTimeout(() => setToast(prev => prev.id === id ? { ...prev, show: false } : prev), 4000);
    }, []);

    const dismiss = useCallback(() => setToast(prev => ({ ...prev, show: false })), []);

    return { toast, triggerToast, dismiss };
}

interface GlassToastProps {
    toast: ToastState;
    dismiss?: () => void;
}

export function GlassToast({ toast }: GlassToastProps) {
    const isSuccess = toast.type === "success";

    return (
        <AnimatePresence>
            {toast.show && (
                <motion.div
                    key={toast.id}
                    // Adjusted for a smoother, less aggressive entry
                    initial={{ y: -80, x: "-50%", opacity: 0, scale: 0.85 }}
                    animate={{
                        y: 0,
                        x: "-50%",
                        opacity: 1,
                        scale: 1,
                        // Smoother spring physics
                        transition: { type: "spring", stiffness: 350, damping: 28, mass: 1 },
                    }}
                    exit={{
                        y: -50,
                        x: "-50%",
                        opacity: 0,
                        scale: 0.9,
                        // Quick fade out for the exit
                        transition: { duration: 0.25, ease: "easeOut" },
                    }}
                    style={{
                        position: "fixed",
                        top: "24px",
                        left: "50%",
                        zIndex: 99999,
                        /* White Glassmorphism styling */
                        background: "rgba(255, 255, 255, 0.5)", // Lowered opacity so blur is visible
                        backdropFilter: "blur(16px) saturate(180%)",
                        WebkitBackdropFilter: "blur(16px) saturate(180%)",
                        borderRadius: "99px",
                        padding: "12px 20px 12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        // Softer, wider shadow to float above UI
                        boxShadow: "0 10px 40px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.03)",
                        // Subtle white border to catch the light
                        border: "1px solid rgba(255, 255, 255, 0.8)",
                        maxWidth: "440px",
                        minWidth: "260px",
                        cursor: "default",
                        userSelect: "none",
                    }}
                >
                    {/* Icon bubble */}
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isSuccess
                                ? "rgba(52,211,153,0.15)" // Slightly more transparent background for light mode
                                : "rgba(248,113,113,0.15)",
                        }}
                    >
                        {isSuccess ? (
                            <CheckCircle2 size={20} style={{ color: "#10b981" }} strokeWidth={2.5} />
                        ) : (
                            <XCircle size={20} style={{ color: "#ef4444" }} strokeWidth={2.5} />
                        )}
                    </div>

                    {/* Text block */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827", // Very dark gray/black
                                letterSpacing: "-0.2px",
                                lineHeight: 1.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {isSuccess ? "Confirmed" : "Action Terminated"}
                        </span>
                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "rgba(17, 24, 39, 0.6)", // Semi-transparent dark gray
                                lineHeight: 1.4,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {toast.msg}
                        </span>
                    </div>

                    {/* Status dot */}
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: isSuccess ? "#10b981" : "#ef4444",
                            boxShadow: isSuccess
                                ? "0 0 10px rgba(16,185,129,0.4)"
                                : "0 0 10px rgba(239,68,68,0.4)",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default GlassToast;