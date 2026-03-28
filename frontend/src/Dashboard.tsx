import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, IndianRupee, BookOpen, ArrowUpRight, PlusCircle, CheckCircle, 
  Clock, MoreHorizontal, ShieldAlert, Star, Activity, BarChart3, 
  Target, ChevronRight, Download, Video, Link, Copy, ChevronDown, 
  MessageSquare, User
} from "lucide-react"; 
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // --- UI STATE ---
  const [timeFilter, setTimeFilter] = useState("30D");
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

  // --- MEETING SCHEDULER STATE ---
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingType, setMeetingType] = useState("all");
  const [meetingCourse, setMeetingCourse] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- ROBUST MOCK DATA ENGINE ---
  const stats = { revenue: 284500, revGrowth: 15.2, students: 3450, stuGrowth: 12.4, courses: 24, completionRate: 82, pendingAlerts: 3 };
  
  const revenueData = [ 
    { name: 'Mon', revenue: 24200 }, { name: 'Tue', revenue: 25800 }, { name: 'Wed', revenue: 24900 }, 
    { name: 'Thu', revenue: 28500 }, { name: 'Fri', revenue: 27200 }, { name: 'Sat', revenue: 30400 }, { name: 'Sun', revenue: 29800 } 
  ];

  const engagementData = [
    { name: 'W1', active: 800, dropoff: 40 }, { name: 'W2', active: 1150, dropoff: 55 },
    { name: 'W3', active: 1450, dropoff: 60 }, { name: 'W4', active: 2200, dropoff: 80 }
  ];

  const instructorCourses = [
    { 
        id: 1, title: 'Advanced Python Architecture', totalStudents: 428, rating: 4.9, revenue: 124000,
        students: [
            { id: 101, name: 'Rahul Sharma', progress: 100, lastActive: '2 hours ago' },
            { id: 102, name: 'Priya Patel', progress: 65, lastActive: '1 day ago' },
            { id: 103, name: 'Amit Kumar', progress: 30, lastActive: '3 days ago' }
        ]
    },
    { 
        id: 2, title: 'React JS Enterprise Apps', totalStudents: 385, rating: 4.8, revenue: 98000,
        students: [
            { id: 201, name: 'Neha Gupta', progress: 85, lastActive: 'Just now' },
            { id: 202, name: 'Vikram Singh', progress: 10, lastActive: '1 week ago' }
        ]
    },
    { 
        id: 3, title: 'Java SpringBoot Microservices', totalStudents: 240, rating: 4.7, revenue: 62500,
        students: [
            { id: 301, name: 'Sanjay Das', progress: 100, lastActive: '5 hours ago' }
        ]
    }
  ];

  const feedbacks = [
    { id: 1, student: 'Rahul S.', course: 'Advanced Python', rating: 5, text: "Incredible course. The section on metaclasses finally made sense to me.", time: '2h ago' },
    { id: 2, student: 'Priya P.', course: 'React JS Apps', rating: 4, text: "Great content, but the pace in module 4 was a bit fast.", time: '5h ago' },
    { id: 3, student: 'Amit K.', course: 'Java SpringBoot', rating: 5, text: "Best instructor on the platform. Clear, concise, and enterprise-focused.", time: '1d ago' },
  ];

  // --- ACTIONS ---
  const handleGenerateMeeting = (e: React.FormEvent) => {
      e.preventDefault();
      setIsGenerating(true);
      setTimeout(() => {
          setGeneratedLink(`https://meet.google.com/sf-${Math.random().toString(36).substr(2, 6)}`);
          setIsGenerating(false);
      }, 1500);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generatedLink);
      alert("Meeting link copied to clipboard!");
  };

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 font-sans text-slate-900">
        
        {/* HEADER & QUICK ACTIONS */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight mb-2">Platform Overview</h1>
                <p className="text-slate-500 font-bold text-sm">Analyze performance, manage cohorts, and schedule live sessions.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <button className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 hover:text-black transition-all text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <Download size={16} /> Export Data
                </button>
                <button onClick={() => setIsMeetingModalOpen(true)} className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition-all text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <Video size={16} /> Schedule Live
                </button>
                <button onClick={() => navigate("/dashboard/create-course")} className="bg-black border border-black text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95 text-xs uppercase tracking-widest">
                    <PlusCircle size={16} /> New Course
                </button>
            </div>
        </div>

        {/* --- MEETING SCHEDULER MODAL --- */}
        <AnimatePresence>
            {isMeetingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Video size={20} className="text-blue-500"/> Live Session Setup</h2>
                            <button onClick={() => { setIsMeetingModalOpen(false); setGeneratedLink(""); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"><MoreHorizontal size={16}/></button>
                        </div>
                        <div className="p-8">
                            {!generatedLink ? (
                                <form onSubmit={handleGenerateMeeting} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Audience</label>
                                        <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black">
                                            <option value="all">Common (All Enrolled Students)</option>
                                            <option value="specific">Specific Course Only</option>
                                        </select>
                                    </div>

                                    {meetingType === "specific" && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 mt-2">Select Course</label>
                                            <select required value={meetingCourse} onChange={(e) => setMeetingCourse(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black">
                                                <option value="" disabled>Choose a course...</option>
                                                {instructorCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                            </select>
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Date</label>
                                            <input type="date" required value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Time</label>
                                            <input type="time" required value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isGenerating} className="w-full py-4 mt-4 bg-black hover:bg-slate-800 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70">
                                        {isGenerating ? <MoreHorizontal className="animate-pulse"/> : "Generate Secure Link"}
                                    </button>
                                </form>
                            ) : (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                                        <CheckCircle size={32} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Meeting Scheduled!</h3>
                                    <p className="text-sm font-bold text-slate-500 mb-8">Invitations have been pushed to student dashboards.</p>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-6">
                                        <div className="p-3 bg-white rounded-lg border border-slate-100 text-blue-500"><Link size={20}/></div>
                                        <input type="text" readOnly value={generatedLink} className="flex-1 bg-transparent text-sm font-mono font-bold text-slate-700 outline-none px-2" />
                                        <button onClick={copyToClipboard} className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-bold text-xs flex items-center gap-2 uppercase tracking-widest"><Copy size={14}/> Copy</button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <div className="relative z-10 space-y-6">
            
            {/* 📊 ROW 1: KPI METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"><IndianRupee size={24} /></div>
                        <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-sm"><ArrowUpRight size={14} strokeWidth={3} /> {stats.revGrowth}%</span>
                    </div>
                    <h3 className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mb-1 relative z-10">Total Revenue</h3>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight relative z-10">₹{stats.revenue.toLocaleString()}</h2>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"><Users size={24} /></div>
                        <span className="flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shadow-sm"><ArrowUpRight size={14} strokeWidth={3} /> {stats.stuGrowth}%</span>
                    </div>
                    <h3 className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mb-1 relative z-10">Active Students</h3>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight relative z-10">{stats.students.toLocaleString()}</h2>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"><Target size={24} /></div>
                        <span className="flex items-center gap-1 text-[11px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">Global Avg</span>
                    </div>
                    <h3 className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mb-1 relative z-10">Completion Rate</h3>
                    <div className="flex items-end gap-4 relative z-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{stats.completionRate}%</h2>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full mb-2.5 overflow-hidden"><div className="h-full bg-slate-800 rounded-full transition-all duration-1000" style={{ width: `${stats.completionRate}%` }} /></div>
                    </div>
                </div>

                <div className="bg-[#1e293b] p-6 md:p-8 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col justify-between border border-slate-800">
                    <div className="absolute top-[-50%] right-[-20%] w-60 h-60 bg-red-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-sm"><ShieldAlert size={24} className="text-red-400"/></div>
                        <span className="flex items-center gap-1 text-[10px] font-black text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">Action Required</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Proctoring Alerts</h3>
                        <div className="flex items-center justify-between">
                            <h2 className="text-4xl font-black text-white tracking-tight">{stats.pendingAlerts}</h2>
                            <button onClick={() => navigate("/dashboard/code-arena")} className="text-[10px] font-black text-white hover:text-red-300 transition-colors uppercase tracking-widest flex items-center gap-1">Review <ChevronRight size={14}/></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📈 ROW 2: DATA VISUALIZATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Revenue Analytics Chart */}
                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><Activity size={20} className="text-slate-400"/> Revenue Flow</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1">Financial performance timeline</p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/50">
                            {["7D", "30D", "1Y"].map(filter => (
                                <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${timeFilter === filter ? 'bg-white text-black shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.10}/>
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 800 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 800 }} dx={-10} tickFormatter={(v) => `${v/1000}k`} />
                                <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', background: '#fff', fontWeight: 800 }} />
                                <Area type="monotone" dataKey="revenue" stroke="#1e293b" strokeWidth={3} fill="url(#colorRev)" activeDot={{ r: 6, fill: '#0f172a', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Engagement Bar Chart */}
                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-[480px]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><BarChart3 size={20} className="text-slate-400"/> Student Engagement</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1">Active vs Drop-offs comparison</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={engagementData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 800 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 800 }} dx={-10} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', background: '#fff', fontWeight: 800 }} />
                                <Bar dataKey="active" fill="#1e293b" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="dropoff" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 📋 ROW 3: DETAILED COURSE ROSTERS & FEEDBACK */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Expandable Course Directory (Takes 2/3) */}
                <div className="bg-white/70 backdrop-blur-xl xl:col-span-2 p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><BookOpen size={20} className="text-slate-400"/> Course Directories & Rosters</h2>
                    </div>
                    
                    <div className="space-y-4">
                        {instructorCourses.map((course) => (
                            <div key={course.id} className="bg-white border border-slate-200/60 rounded-[1.5rem] shadow-sm overflow-hidden transition-all hover:border-slate-300">
                                {/* Course Row Header */}
                                <div onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)} className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shrink-0"><BookOpen size={20}/></div>
                                        <div>
                                            <h4 className="font-black text-lg text-slate-900 leading-tight">{course.title}</h4>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Users size={14}/> {course.totalStudents} Enrolled</span>
                                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Star size={14} className="text-yellow-500 fill-yellow-500"/> {course.rating} Avg</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 justify-between md:justify-end border-t border-slate-100 md:border-none pt-4 md:pt-0">
                                        <div className="text-left md:text-right">
                                            <h4 className="font-black text-lg text-slate-900">₹{course.revenue.toLocaleString()}</h4>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gross Revenue</span>
                                        </div>
                                        <div className={`p-2.5 rounded-full border border-slate-200 transition-transform ${expandedCourseId === course.id ? 'rotate-180 bg-slate-100' : 'bg-white shadow-sm'}`}>
                                            <ChevronDown size={18} className="text-slate-600"/>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Student Roster View */}
                                <AnimatePresence>
                                    {expandedCourseId === course.id && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50/80">
                                            <div className="p-6">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Student Roster (Recent Activity)</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {course.students.map(student => (
                                                        <div key={student.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0"><User size={16} className="text-slate-500"/></div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900">{student.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Clock size={10}/> Last active: {student.lastActive}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-[11px] font-black text-slate-700">{student.progress}%</span>
                                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full transition-all duration-1000 ${student.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${student.progress}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => navigate("/dashboard/students")} className="w-full mt-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm">
                                                    View Entire Roster Directory
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feedback Panel (Takes 1/3) */}
                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-[600px] xl:h-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><MessageSquare size={20} className="text-slate-400"/> Student Feedback</h2>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {feedbacks.map(fb => (
                            <div key={fb.id} className="p-6 rounded-[1.5rem] bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-colors relative">
                                <div className="absolute top-6 right-6 flex text-yellow-500 gap-0.5">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < fb.rating ? "fill-yellow-500" : "text-slate-200"}/>)}
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-sm shrink-0">{fb.student.charAt(0)}</div>
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 leading-none mb-1">{fb.student}</h4>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{fb.course}</span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">"{fb.text}"</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1"><Clock size={10}/> {fb.time}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default Dashboard;
