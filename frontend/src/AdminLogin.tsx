import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Mail, ArrowRight, CheckCircle, GraduationCap, 
  AlertCircle, X, ShieldCheck, Eye, EyeOff, Facebook, 
  Github, Linkedin 
} from "lucide-react";

const GoogleIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);

interface ToastState { show: boolean; message: string; type: "success" | "error"; }

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const loginParams = new URLSearchParams();
        loginParams.append("username", formData.email);
        loginParams.append("password", formData.password);
        
        const res = await axios.post("http://127.0.0.1:8000/api/v1/login", loginParams);
        
        if (res.data.role !== "instructor") {
            triggerToast("Access Denied. This portal is for Instructors only.", "error");
            setLoading(false); return;
        }
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("role", res.data.role);
        triggerToast("Welcome back, Instructor!", "success");
        setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
        triggerToast("Authentication failed. Check connection.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] font-sans p-6 overflow-hidden relative selection:bg-black selection:text-white">
      
      {/* Slow Moving Animated Background Gradients */}
      <motion.div 
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gray-200/50 blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ x: [0, -100, 0], y: [0, 50, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-300/40 blur-[150px] pointer-events-none" 
      />

      {/* Top Right Toggle */}
      <button onClick={() => navigate("/login")} className="absolute top-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-xl rounded-full shadow-sm text-gray-600 hover:text-black hover:bg-white transition-all z-50 font-bold text-sm border border-white/50">
        <GraduationCap size={18} /> Learner Portal
      </button>

      {/* Main Login Card (Light Glassmorphism) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[450px] p-10 border border-white z-10"
      >
        <div className="flex flex-col items-center text-center">
            
            <div className="mb-6 flex items-center justify-center p-4 bg-black text-white rounded-2xl shadow-lg">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Instructor Access</h1>
            <p className="text-gray-500 text-sm mb-8 px-4 font-medium">Secure login for SkillForge faculty and administration.</p>

            {/* Social Login */}
            <div className="flex gap-4 mb-8 w-full justify-center">
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white/50 hover:bg-white transition-all text-gray-700 shadow-sm"><GoogleIcon /></button>
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white/50 hover:bg-white transition-all text-[#1877F2] shadow-sm"><Facebook size={20} fill="currentColor" strokeWidth={0} /></button>
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white/50 hover:bg-white transition-all text-gray-900 shadow-sm"><Github size={20} /></button>
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white/50 hover:bg-white transition-all text-[#0A66C2] shadow-sm"><Linkedin size={20} fill="currentColor" strokeWidth={0} /></button>
            </div>

            <div className="flex items-center w-full mb-8">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="px-4 text-xs text-gray-400 font-bold tracking-widest uppercase">Or use email</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <form onSubmit={handleAuth} className="w-full space-y-4">
                <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                    <Mail className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                    <input type="email" name="email" placeholder="Instructor Email" required className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400" onChange={handleInputChange} />
                </div>

                <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                    <Lock className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" placeholder="Password" required
                        className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400"
                        onChange={handleInputChange}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-black focus:outline-none transition-colors ml-2 shrink-0">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 mt-4 rounded-xl font-bold text-white bg-black hover:bg-gray-800 shadow-lg shadow-black/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? "Verifying Identity..." : "Access Command Center"} <ArrowRight size={18} />
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 w-full">
                <p className="text-xs text-gray-500 font-medium">Need an account? Contact the <span className="font-bold text-black cursor-pointer hover:underline">University IT Admin</span>.</p>
            </div>
        </div>
      </motion.div>

      {/* Premium Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="fixed top-6 right-6 z-50 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4"
          >
            {toast.type === "success" ? <CheckCircle className="text-green-500" size={24} /> : <AlertCircle className="text-red-500" size={24} />}
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{toast.type === "success" ? "Access Granted" : "Access Denied"}</h4>
              <p className="text-gray-500 text-xs mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 text-gray-400 hover:text-black transition-colors"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLogin;