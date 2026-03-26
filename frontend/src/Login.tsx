import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Lock, Mail, ArrowRight, CheckCircle, 
  ShieldCheck, Eye, EyeOff, Facebook, Github, Linkedin, 
  Smartphone, MessageSquare, AlertCircle, X, Layers 
} from "lucide-react";

// 🔥 FIREBASE IMPORTS (Untouched)
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXMCCFrTxjwz7qb4JbfC3x-adc_QDWsOA",
  authDomain: "iqmath-auth.firebaseapp.com",
  projectId: "iqmath-auth",
  storageBucket: "iqmath-auth.firebasestorage.app",
  messagingSenderId: "493820113400",
  appId: "1:493820113400:web:2f0660263a9cb8795da60d",
  measurementId: "G-P2TS6H9MMZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface ToastState { show: boolean; message: string; type: "success" | "error"; }

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false); 
  const role = "student"; 
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  
  const triggerToast = (message: string, type: "success" | "error" = "success") => { 
      setToast({ show: true, message, type }); 
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000); 
  };

  const onCaptchVerify = () => {
    if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {},
            'expired-callback': () => { triggerToast("Captcha Expired. Refresh page.", "error"); }
        });
    }
  };

  const onSignInSubmit = () => {
    if (!phone || phone.length < 10) return triggerToast("Please enter a valid phone number", "error");
    
    setLoading(true);
    onCaptchVerify();
    
    const phoneNumber = phone.startsWith("+") ? phone : "+91" + phone; 
    const appVerifier = (window as any).recaptchaVerifier;

    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then((confirmationResult) => {
      (window as any).confirmationResult = confirmationResult;
      setConfirmationResult(confirmationResult);
      setLoading(false);
      setShowOtpInput(true);
      triggerToast("OTP Sent Successfully! Check your phone.", "success");
    }).catch((error) => {
      console.error(error);
      setLoading(false);
      triggerToast("Failed to send OTP. Try again later.", "error");
    });
  };

  const verifyOtp = () => {
    if(!otp) return;
    setLoading(true);
    confirmationResult.confirm(otp).then(async (result: any) => {
        setIsPhoneVerified(true);
        setLoading(false);
        triggerToast("Phone Verified! Creating Account...", "success");
        await finalizeSignup();
    }).catch((error: any) => {
        setLoading(false);
        triggerToast("Invalid OTP. Please try again.", "error");
    });
  };

  const finalizeSignup = async () => {
      try {
        await axios.post("http://127.0.0.1:8000/api/v1/users", { 
            email: formData.email, 
            password: formData.password, 
            name: formData.name, 
            role: role,
            phone_number: phone 
        });
        triggerToast("Account created successfully! Please Sign In.", "success");
        
        setIsSignUp(false);
        setShowOtpInput(false);
        setIsPhoneVerified(false);
        setOtp("");
        setPhone("");
      } catch (err) {
        triggerToast("Database Error. This Email might already exist.", "error");
      }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUp) {
        setLoading(true);
        try {
            const loginParams = new URLSearchParams(); 
            loginParams.append("username", formData.email); 
            loginParams.append("password", formData.password);
            
            const res = await axios.post("http://127.0.0.1:8000/api/v1/login", loginParams);
            
            if (res.data.role !== "student") { 
                triggerToast("Please use the Admin Portal for Instructor access.", "error"); 
                setLoading(false); 
                return; 
            }
            localStorage.setItem("token", res.data.access_token); 
            localStorage.setItem("role", res.data.role);
            triggerToast("Login Successful! Forging environment...", "success"); 
            setTimeout(() => navigate("/student-dashboard"), 1000);
        } catch (err: any) { 
            triggerToast("Authentication failed. Check credentials.", "error"); 
            setLoading(false); 
        }
    } else {
        if (!isPhoneVerified) { onSignInSubmit(); } 
        else { finalizeSignup(); }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] font-sans p-6 overflow-hidden relative selection:bg-black selection:text-white">
      
      <div id="recaptcha-container"></div> 

      {/* Slow Moving Animated Background Gradients */}
      <motion.div 
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gray-200/50 blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ x: [0, -100, 0], y: [0, 50, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-300/40 blur-[150px] pointer-events-none" 
      />
      
      {/* Admin Toggle */}
      <button onClick={() => navigate("/admin-login")} className="absolute top-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-xl rounded-full shadow-sm text-gray-600 hover:text-black hover:bg-white transition-all z-50 font-bold text-sm border border-white/50">
        <ShieldCheck size={18} /> Admin Access
      </button>

      {/* Main Glass Container */}
      <div className="relative bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden w-full max-w-[1000px] min-h-[650px] flex border border-white">
        
        {/* ======================================================= */}
        {/* 🔑 SIGN IN FORM (LEFT)                                  */}
        {/* ======================================================= */}
        <div className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-20 ${isSignUp ? 'translate-x-full opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <form onSubmit={handleAuth} className="bg-transparent flex flex-col items-center justify-center h-full px-12 text-center text-gray-900">
            
            <div className="mb-8 flex items-center gap-2">
              <div className="w-8 h-8 bg-black flex items-center justify-center rounded-[6px] shadow-md"><Layers className="text-white" size={18} strokeWidth={2.5} /></div>
              <h1 className="text-2xl font-bold tracking-tight">Skill<span className="text-gray-400">Forge</span></h1>
            </div>
            
            <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 text-sm mb-8 font-medium">Enter your details to access the coding arena</p>

            <div className="flex gap-4 mb-6 w-full justify-center">
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm"><GoogleIcon /></button>
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm text-[#1877F2]"><Facebook size={20} fill="currentColor" strokeWidth={0} /></button>
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm text-black"><Github size={20} /></button>
                <button type="button" className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm text-[#0A66C2]"><Linkedin size={20} fill="currentColor" strokeWidth={0} /></button>
            </div>

            <div className="flex items-center w-full mb-6">
                <div className="h-px bg-gray-200 flex-1"></div><span className="px-4 text-xs text-gray-400 font-bold uppercase tracking-widest">Or email</span><div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="w-full max-w-[350px] space-y-4">
                <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                    <Mail className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                    <input type="email" name="email" placeholder="Email Address" required className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400" onChange={handleInputChange} />
                </div>
                <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                    <Lock className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" required className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400" onChange={handleInputChange} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-black focus:outline-none ml-2 shrink-0">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
            </div>

            <p className="mt-4 text-xs text-gray-500 font-bold cursor-pointer hover:text-black self-end mr-4 transition-colors">Forgot Password?</p>
            <button type="submit" disabled={loading} className={`mt-6 w-full max-w-[350px] py-4 rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-black/10`}>
                {loading ? "Authenticating..." : "Sign In"} <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* ======================================================= */}
        {/* 📝 SIGN UP FORM (RIGHT)                                 */}
        {/* ======================================================= */}
        <div className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-10 ${isSignUp ? 'translate-x-full opacity-100 z-30' : 'opacity-0 pointer-events-none'}`}>
          
          {!showOtpInput ? (
              <form onSubmit={handleAuth} className="bg-transparent flex flex-col items-center justify-center h-full px-12 text-center text-gray-900">
                <h1 className="text-3xl font-black mb-2 tracking-tight">Create Account</h1>
                <p className="text-gray-500 text-sm mb-8 font-medium">Join the next generation of engineers</p>

                <div className="w-full max-w-[350px] space-y-4">
                    <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                        <User className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                        <input type="text" name="name" placeholder="Full Name" required className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400" onChange={handleInputChange} />
                    </div>
                    <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                        <Mail className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                        <input type="email" name="email" placeholder="Email Address" required className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400" onChange={handleInputChange} />
                    </div>
                    <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                        <Lock className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                        <input type={showPassword ? "text" : "password"} name="password" placeholder="Create Password" required className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400" onChange={handleInputChange} />
                    </div>
                    <div className="flex items-center bg-white/60 rounded-xl px-4 py-3.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                        <Smartphone className="text-gray-400 mr-3 shrink-0" size={20} strokeWidth={1.5} />
                        <input type="tel" value={phone} placeholder="Phone (e.g. 9999999999)" required className="bg-transparent outline-none flex-1 text-sm font-semibold text-gray-900 placeholder-gray-400" onChange={(e) => setPhone(e.target.value)} />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="mt-8 w-full max-w-[350px] py-4 rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-black/10">
                    {loading ? "Sending OTP..." : "Get OTP & Verify"} <CheckCircle size={18} />
                </button>
              </form>
          ) : (
              <div className="bg-transparent flex flex-col items-center justify-center h-full px-12 text-center w-full text-gray-900 animate-fade-in">
                  <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                      <MessageSquare className="text-black" size={32} />
                  </div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight">Verify Identity</h2>
                  <p className="text-gray-500 text-sm mb-8 font-medium">Enter the 6-digit code sent to {phone}</p>
                  
                  <div className="w-full max-w-[250px] mb-8">
                      <input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="••••••" 
                        maxLength={6}
                        className="w-full text-center text-4xl font-bold tracking-[0.5em] py-3 border-b-2 border-gray-300 focus:border-black outline-none bg-transparent text-black placeholder-gray-300 transition-colors"
                      />
                  </div>

                  <button onClick={verifyOtp} disabled={loading} className="w-full max-w-[250px] py-4 rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                      {loading ? "Verifying..." : "Confirm Account"}
                  </button>
                  <button onClick={() => setShowOtpInput(false)} className="mt-6 text-sm text-gray-500 font-bold hover:text-black transition-colors">Change Phone Number</button>
              </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* 🎭 SLIDING OVERLAY PANEL (The High-Contrast Dark Area)  */}
        {/* ======================================================= */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-40 ${isSignUp ? '-translate-x-full rounded-r-[2rem] rounded-l-[4rem]' : 'rounded-l-[2rem] rounded-r-[4rem] shadow-2xl'}`}>
          <div className={`relative -left-full h-full w-[200%] bg-gradient-to-br from-gray-900 to-black text-white transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}`}>
            
            {/* OVERLAY: RIGHT (Prompts Sign Up) */}
            <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-16 text-center transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h1 className="text-5xl font-black mb-6 leading-tight tracking-tighter">Forge your <br/>future.</h1>
              <p className="text-base font-medium mb-10 text-gray-400 max-w-[320px] leading-relaxed">Join the platform powering the next generation of top-tier software engineers.</p>
              <button onClick={() => setIsSignUp(true)} className="px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:bg-gray-200 hover:scale-105 transition-all active:scale-95 shadow-xl shadow-white/10">
                Create Account
              </button>
            </div>

            {/* OVERLAY: LEFT (Prompts Sign In) */}
            <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-16 text-center transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h1 className="text-5xl font-black mb-6 leading-tight tracking-tighter">Already a <br/>Builder?</h1>
              <p className="text-base font-medium mb-10 text-gray-400 max-w-[320px] leading-relaxed">Sign in to your arena and pick up exactly where you left off.</p>
              <button onClick={() => setIsSignUp(false)} className="px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:bg-gray-200 hover:scale-105 transition-all active:scale-95 shadow-xl shadow-white/10">
                Sign In
              </button>
            </div>

          </div>
        </div>

      </div>
      
      {/* Premium Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="fixed top-6 right-6 z-50 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4"
          >
            {toast.type === "success" ? <CheckCircle className="text-green-500" size={24} /> : <AlertCircle className="text-red-500" size={24} />}
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{toast.type === "success" ? "Success" : "Error"}</h4>
              <p className="text-gray-500 text-xs mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 text-gray-400 hover:text-black transition-colors"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;