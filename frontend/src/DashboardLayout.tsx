import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard, BookOpen, Users, Settings, LogOut,
    Bell, ChevronDown, Zap, Code, Send, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- CUSTOM HOOK: CLICK OUTSIDE TO CLOSE ---
function useOnClickOutside(ref: any, handler: any) {
    useEffect(() => {
        const listener = (event: any) => {
            if (!ref.current || ref.current.contains(event.target)) return;
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // States
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notiTab, setNotiTab] = useState<"alerts" | "announce">("alerts");

    // Announcement Form State
    const [announceTarget, setAnnounceTarget] = useState("all");
    const [announceMsg, setAnnounceMsg] = useState("");
    const [announceSuccess, setAnnounceSuccess] = useState(false);

    // Refs for click-outside
    const profileRef = useRef<HTMLDivElement>(null);
    const notiRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(profileRef, () => setShowProfile(false));
    useOnClickOutside(notiRef, () => setShowNotifications(false));

    const navItems = [
        { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { name: "Courses", path: "/dashboard/courses", icon: BookOpen },
        { name: "Students", path: "/dashboard/students", icon: Users },
        { name: "Code Arena", path: "/dashboard/code-arena", icon: Code },
    ];

    const handleSendAnnouncement = () => {
        if (!announceMsg.trim()) return;
        setAnnounceSuccess(true);
        setTimeout(() => {
            setAnnounceSuccess(false);
            setAnnounceMsg("");
            setShowNotifications(false);
        }, 2000);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-black selection:text-white relative pb-20">

            {/* 🎨 THEME: Abstract Black/White/Gray Gradient Mesh */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px] pointer-events-none opacity-90 z-0" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-slate-200/50 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="fixed top-[20%] right-[20%] w-[30%] h-[30%] bg-gray-300/30 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* 🚀 TOP NAVIGATION BAR */}
            <nav className="sticky top-0 z-50 px-4 md:px-8 py-4">
                <div className="max-w-[1600px] mx-auto bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-between px-6 py-3">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                            <Zap size={20} className="text-white fill-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-black">SkillForge<span className="text-gray-400">.</span></span>
                    </div>

                    {/* Horizontal Links */}
                    <div className="hidden lg:flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button key={item.name} onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isActive ? 'bg-white text-black shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-black hover:bg-white/50'}`}
                                >
                                    <item.icon size={16} /> {item.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 relative">

                        {/* NOTIFICATION CENTER */}
                        <div ref={notiRef} className="relative">
                            <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }} className={`relative p-2.5 rounded-xl transition-colors ${showNotifications ? 'bg-slate-100 text-black' : 'text-slate-400 hover:text-black hover:bg-slate-50'}`}>
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-14 right-0 w-[380px] bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-50 flex flex-col"
                                    >
                                        <div className="flex p-2 bg-slate-50/50 border-b border-slate-100">
                                            <button onClick={() => setNotiTab("alerts")} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${notiTab === "alerts" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>Alerts</button>
                                            <button onClick={() => setNotiTab("announce")} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${notiTab === "announce" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>Announce</button>
                                        </div>

                                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {notiTab === "alerts" ? (
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="text-xs font-bold text-slate-800 mb-1">New Assignment Submitted</p>
                                                        <p className="text-[10px] text-slate-500">Rahul S. submitted "Graph Algorithms" for Advanced Python.</p>
                                                    </div>
                                                    <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                                                        <p className="text-xs font-bold text-red-800 mb-1">Proctoring Alert</p>
                                                        <p className="text-[10px] text-red-600">Multiple faces detected during Code Arena test.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    {announceSuccess ? (
                                                        <div className="py-10 flex flex-col items-center justify-center text-emerald-500">
                                                            <CheckCircle size={40} className="mb-2" />
                                                            <p className="text-sm font-black">Announcement Sent!</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <select value={announceTarget} onChange={(e) => setAnnounceTarget(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-black">
                                                                <option value="all">Broadcast to All Students</option>
                                                                <option value="python">Course: Advanced Python</option>
                                                                <option value="react">Course: React Masterclass</option>
                                                            </select>
                                                            <textarea value={announceMsg} onChange={(e) => setAnnounceMsg(e.target.value)} placeholder="Type your announcement here..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-black min-h-[100px] resize-none"></textarea>
                                                            <button onClick={handleSendAnnouncement} className="w-full py-3 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all">
                                                                <Send size={14} /> Send Now
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        {/* PROFILE MENU */}
                        <div ref={profileRef} className="relative">
                            <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }} className="flex items-center gap-3 group p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=SkillForge&backgroundColor=e2e8f0`} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs font-black text-black leading-none mb-0.5">Instructor</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Admin Panel</p>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 group-hover:text-black transition-colors" />
                            </button>

                            <AnimatePresence>
                                {showProfile && (
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-14 right-0 w-64 bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-3 z-50"
                                    >
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                                            <p className="font-black text-sm text-black">admin@skillforge.com</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Super Admin</p>
                                        </div>
                                        <button onClick={() => { navigate("/dashboard/settings"); setShowProfile(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-black hover:bg-slate-50 rounded-xl transition-colors">
                                            <Settings size={16} /> Platform Settings
                                        </button>
                                        <div className="h-px w-full bg-slate-100 my-1"></div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                            <LogOut size={16} /> Secure Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </div>
            </nav>

            {/* 📄 MAIN CONTENT AREA */}
            <main className="w-full pt-4">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;