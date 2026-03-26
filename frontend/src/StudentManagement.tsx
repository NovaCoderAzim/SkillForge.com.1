import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search, ChevronDown, ChevronUp, CheckCircle, Calendar, Shield, Edit, Eye, EyeOff, Save, X, Plus, BookOpen, AlertCircle, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassToast } from "./components/GlassToast";

interface CourseEnrollment {
  title: string;
  tier: "Paid" | "Free";
  days_left: number | null;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  joined_at: string;
  status: "Active" | "Suspended";
  temp_password?: string;
  enrolled_courses: CourseEnrollment[];
}

const StudentManagement = () => {
  const [activeTab, setActiveTab] = useState("Directory");
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<{ id: number, title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Editing State
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // Password State
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({});
  const [resettingPassId, setResettingPassId] = useState<number | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");

  // Provisioning Form
  const [newStudent, setNewStudent] = useState({ name: "", email: "", tempPass: "", assignCourse: "none" });

  // Bulk Upload State
  const [csvContent, setCsvContent] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type }), 2500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [resStudents, resCourses] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/v1/admin/students", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://127.0.0.1:8000/api/v1/courses", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStudents(resStudents.data);
      setCourses(resCourses.data);
    } catch (err) {
      console.error("Failed to load CRM data", err);
      triggerToast("Lost connection to database", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://127.0.0.1:8000/api/v1/admin/admit-student", {
        full_name: newStudent.name,
        email: newStudent.email,
        password: newStudent.tempPass || null,
        course_ids: newStudent.assignCourse === "none" ? [] : [parseInt(newStudent.assignCourse)]
      }, { headers: { Authorization: `Bearer ${token}` } });

      triggerToast(`Account securely provisioned for ${newStudent.name}.`, "success");
      setNewStudent({ name: "", email: "", tempPass: "", assignCourse: "none" });
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      triggerToast("Failed to create student profile.", "error");
    }
  };

  const handleBulkUpload = async () => {
    if (!csvContent.trim()) return triggerToast("Please paste CSV content first", "error");
    setBulkProcessing(true);

    const lines = csvContent.split("\n").filter(l => l.trim() !== "");
    // Assumption: Format is Name, Email, Password (optional)
    let successCount = 0;
    const token = localStorage.getItem("token");

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",").map(s => s.trim());
      if (parts.length < 2) continue; // Skip invalid lines

      const [name, email, pass] = parts;
      try {
        await axios.post("http://127.0.0.1:8000/api/v1/admin/admit-student", {
          full_name: name,
          email: email,
          password: pass || null,
          course_ids: [] // Bulk defaults to 0 courses logically, Instructor assigns later or handles differently
        }, { headers: { Authorization: `Bearer ${token}` } });
        successCount++;
      } catch (e) { console.error(`Failed to admit ${email}`); }
    }

    setBulkProcessing(false);
    setCsvContent("");
    triggerToast(`Successfully onboarded ${successCount} out of ${lines.length} students.`, "success");
    fetchData();
  };

  const toggleSuspend = async (s: Student) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = s.status === "Active" ? "Suspended" : "Active";
      await axios.patch(`http://127.0.0.1:8000/api/v1/admin/students/${s.id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(students.map(st => st.id === s.id ? { ...st, status: newStatus } : st));
      triggerToast(`${s.full_name} is now ${newStatus}.`, "success");
    } catch (err) {
      triggerToast("Status update failed.", "error");
    }
  };

  const saveUpdatedName = async (s: Student) => {
    if (!editNameValue.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/admin/students/${s.id}/name`, { name: editNameValue }, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(students.map(st => st.id === s.id ? { ...st, full_name: editNameValue } : st));
      setEditingNameId(null);
      triggerToast("Name updated.", "success");
    } catch (err) {
      triggerToast("Failed to rename student.", "error");
    }
  };

  const saveNewPassword = async (s: Student) => {
    if (!newPasswordValue.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/admin/students/${s.id}/reset-password`, { new_password: newPasswordValue }, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(students.map(st => st.id === s.id ? { ...st, temp_password: newPasswordValue } : st));
      setResettingPassId(null);
      setShowPasswordMap({ ...showPasswordMap, [s.id]: true });
      triggerToast("Password reset successfully.", "success");
    } catch (err) {
      triggerToast("Password reset failed.", "error");
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-10 font-sans mt-4 max-w-[1400px] w-full mx-auto pb-20">
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full md:w-64 shrink-0">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-black tracking-tight">CRM</h1>
          <p className="text-gray-700 font-bold mt-1 text-sm">Manage absolute student access.</p>
        </div>

        <nav className="flex flex-col gap-3">
          {["Directory", "Single Onboarding", "Bulk Import"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-extrabold transition-all text-sm tracking-wide border-2 ${activeTab === tab ? "bg-black text-white border-black shadow-xl" : "bg-white text-gray-800 border-gray-200 hover:border-black hover:shadow-md"}`}
            >
              {tab === "Directory" ? <BookOpen size={20} /> : tab === "Single Onboarding" ? <Plus size={20} /> : <UploadCloud size={20} />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-black"></div>
          </div>
        ) : (
          <>
            {/* DIRECTORY TAB */}
            {activeTab === "Directory" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[75vh]">
                  {/* Search Header */}
                  <div className="p-6 border-b-2 border-gray-100 bg-white sticky top-0 z-10">
                    <div className="relative max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black font-extrabold" size={20} />
                      <input
                        type="text"
                        placeholder="Search absolute directory by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm font-bold text-black placeholder-gray-500 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* List Container */}
                  <div className="flex-1 overflow-y-auto w-full">
                    {filteredStudents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <BookOpen size={40} className="mb-4 text-gray-300" />
                        <p className="font-extrabold text-lg text-black">No students matched.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col w-full">
                        {filteredStudents.map((s, idx) => (
                          <div key={s.id} className={`group flex flex-col w-full ${idx !== filteredStudents.length - 1 ? 'border-b-2 border-gray-100' : ''}`}>

                            {/* ROw Header */}
                            <div
                              onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                              className={`grid grid-cols-12 gap-4 px-6 py-5 items-center cursor-pointer transition-colors ${expandedRow === s.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                              <div className="col-span-8 flex items-center gap-5">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-black text-black border-2 border-gray-300 shrink-0 shadow-sm text-lg">
                                  {s.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  {editingNameId === s.id ? (
                                    <div className="flex items-center gap-3 mb-1">
                                      <input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="border-2 border-gray-300 rounded-md px-3 py-1 text-sm font-bold text-black outline-none focus:border-black shadow-sm" autoFocus />
                                      <button onClick={() => saveUpdatedName(s)} className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded-md shadow-sm transition-colors"><Save size={16} /></button>
                                      <button onClick={() => setEditingNameId(null)} className="text-white bg-red-500 hover:bg-red-600 p-1.5 rounded-md shadow-sm transition-colors"><X size={16} /></button>
                                    </div>
                                  ) : (
                                    <div className="font-extrabold text-black flex items-center gap-3 text-lg tracking-tight">
                                      {s.full_name}
                                      <button onClick={(e) => { e.stopPropagation(); setEditNameValue(s.full_name); setEditingNameId(s.id); }} className="text-gray-400 hover:text-black transition-colors opacity-0 group-hover:opacity-100"><Edit size={16} /></button>
                                    </div>
                                  )}
                                  <div className="text-gray-700 text-sm font-bold mt-0.5">{s.email}</div>
                                </div>
                              </div>
                              <div className="col-span-4 flex items-center justify-end gap-5">
                                {s.status === "Suspended" ? (
                                  <span className="bg-white text-red-600 px-3.5 py-1.5 rounded-md text-[11px] uppercase font-black border-2 border-red-200 tracking-widest shadow-sm">Suspended</span>
                                ) : (
                                  <span className="bg-white text-green-700 px-3.5 py-1.5 rounded-md text-[11px] uppercase font-black border-2 border-green-200 tracking-widest shadow-sm">Active</span>
                                )}
                                <div className="text-black bg-white border-2 border-gray-200 p-1.5 rounded-full shadow-sm group-hover:bg-black group-hover:border-black group-hover:text-white transition-all">
                                  {expandedRow === s.id ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
                                </div>
                              </div>
                            </div>

                            {/* ACCORDION CONTENT */}
                            <AnimatePresence>
                              {expandedRow === s.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden bg-gray-50 border-t-2 border-gray-200 shadow-inner"
                                >
                                  <div className="px-16 py-10 flex flex-col md:flex-row gap-12">
                                    {/* Enrollments Column */}
                                    <div className="flex-1 min-w-[200px]">
                                      <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4">Enrolled Courses</h4>
                                      <div className="flex flex-col gap-4">
                                        {s.enrolled_courses.length === 0 ? (
                                          <span className="text-gray-500 font-bold bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 text-center block">— No active enrollments</span>
                                        ) : s.enrolled_courses.map((course, idx) => (
                                          <div key={idx} className="flex items-center justify-between bg-white border-2 border-gray-200 p-4 rounded-xl shadow-md">
                                            <span className="font-extrabold text-black text-[15px]">{course.title}</span>
                                            {course.tier === "Paid" ? (
                                              <span className="flex items-center gap-2 bg-green-50 text-green-800 px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest border border-green-200"><CheckCircle size={14} /> Paid</span>
                                            ) : (
                                              <span className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest border border-gray-300"><Calendar size={14} /> {course.days_left !== undefined && course.days_left !== null ? course.days_left : "Unlimited"} Days Left</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Metrics & Action Column */}
                                    <div className="flex-[1.5] flex flex-col gap-8">
                                      <div className="grid grid-cols-2 gap-6">
                                        <div>
                                          <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-3">Join Date Mapping</h4>
                                          <p className="text-black font-bold text-sm border-2 bg-white border-gray-300 rounded-xl p-3.5 inline-block shadow-sm w-full">{s.joined_at}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-3">Password Override</h4>
                                          <div className="border-2 bg-white border-gray-300 rounded-xl p-2.5 shadow-sm w-full flex items-center justify-between gap-3 h-[52px]">
                                            {resettingPassId === s.id ? (
                                              <div className="flex items-center gap-2 w-full h-full">
                                                <input value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} placeholder="New Pass..." type="text" className="w-full h-full min-w-0 text-sm font-bold font-mono px-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black" />
                                                <button onClick={() => saveNewPassword(s)} className="p-2 shrink-0 text-white bg-black hover:bg-gray-800 rounded-lg transition-colors shadow-sm"><Save size={16} /></button>
                                                <button onClick={() => setResettingPassId(null)} className="p-2 shrink-0 text-gray-600 bg-gray-100 border border-gray-300 hover:bg-gray-200 rounded-lg transition-colors"><X size={16} /></button>
                                              </div>
                                            ) : (
                                              <>
                                                <span className="text-black font-mono font-extrabold text-[15px] pl-3 tracking-widest flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                                  {showPasswordMap[s.id] ? s.temp_password || "None Provided" : "••••••••"}
                                                </span>
                                                <button onClick={() => setShowPasswordMap({ ...showPasswordMap, [s.id]: !showPasswordMap[s.id] })} className="p-2 shrink-0 text-gray-600 bg-gray-50 border border-gray-200 hover:text-black hover:border-black rounded-lg transition-colors shadow-sm">
                                                  {showPasswordMap[s.id] ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                                                </button>
                                                <button onClick={() => { setResettingPassId(s.id); setNewPasswordValue(""); }} className="p-2 shrink-0 mr-1 text-black bg-white border-2 border-black hover:bg-black hover:text-white rounded-lg transition-colors shadow-sm" title="Override Password">
                                                  <Edit size={18} strokeWidth={2.5} />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="pt-2">
                                        <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4">Core Administrative Action</h4>
                                        <div className="flex gap-4">
                                          <button onClick={() => toggleSuspend(s)} className={`flex items-center gap-3 px-6 py-3.5 border-2 text-[13px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md ${s.status === 'Active' ? 'border-red-600 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white' : 'border-green-600 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'}`}>
                                            <Shield size={18} /> {s.status === "Active" ? "Suspend Framework Access" : "Reactivate Framework"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SINGLE ONBOARDING TAB */}
            {activeTab === "Single Onboarding" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl bg-white rounded-2xl border-2 border-gray-200 shadow-md p-10">
                <h3 className="text-3xl font-black text-black mb-3 tracking-tight">Manual Provisioning</h3>
                <p className="text-gray-600 mb-10 text-sm font-bold">Bypass normal registration to forcefully push a student profile into the system.</p>

                <form onSubmit={handleAddStudent} className="space-y-8">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3">Full Legal Authority Name</label>
                    <input required value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full bg-white border-2 border-gray-300 rounded-xl p-4 font-bold text-black outline-none focus:border-black transition-colors shadow-sm" placeholder="e.g. Aditi Sharma" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3">University / Official Email</label>
                    <input required type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full bg-white border-2 border-gray-300 rounded-xl p-4 font-bold text-black outline-none focus:border-black transition-colors shadow-sm" placeholder="contact@university.edu" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3">Provisioned Password</label>
                      <input type="text" value={newStudent.tempPass} onChange={e => setNewStudent({ ...newStudent, tempPass: e.target.value })} className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl p-4 font-mono font-black text-black outline-none focus:border-black transition-colors shadow-sm" placeholder="Auto-generate if blank" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-3">Automatic Enrollment Course</label>
                      <select value={newStudent.assignCourse} onChange={e => setNewStudent({ ...newStudent, assignCourse: e.target.value })} className="w-full bg-white border-2 border-gray-300 rounded-xl p-4 font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none shadow-sm">
                        <option value="none">-- Select Initial Mapping --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-gray-100">
                    <button type="submit" className="py-4 px-8 bg-black hover:bg-gray-800 disabled:opacity-50 border-[3px] border-black text-white font-black uppercase tracking-widest rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm w-full md:w-auto">
                      Provision Account Protocol
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* BULK IMPORT TAB */}
            {activeTab === "Bulk Import" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl bg-white rounded-2xl border-2 border-gray-200 shadow-md p-10">
                <h3 className="text-3xl font-black text-black mb-3 tracking-tight">Bulk Import Generator</h3>
                <p className="text-gray-600 mb-8 text-sm font-bold">Paste CSV formatted data. Structure MUST follow: <span className="text-black font-mono font-black bg-gray-100 px-2 py-1 rounded">Name, Email, Password(optional)</span></p>

                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 shadow-inner mb-6">
                  <textarea
                    rows={12}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="w-full bg-transparent font-mono text-[13px] text-black font-bold outline-none leading-relaxed resize-y"
                    placeholder={`Steve Jobs, steve@apple.com, macintosh1984\nSarah Conner, sarah@cyberdyne.net,\nDr. Emmett Brown, emmett@bttf.com, delorean88`}
                  ></textarea>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t-2 border-gray-100">
                  <button
                    onClick={handleBulkUpload}
                    disabled={bulkProcessing}
                    className="py-4 px-8 bg-black border-[3px] border-black hover:bg-gray-800 text-white font-black uppercase tracking-widest rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm"
                  >
                    {bulkProcessing ? "Injecting Data..." : <><UploadCloud size={20} /> Execute Array Injection</>}
                  </button>
                  <p className="text-gray-500 font-bold text-xs">Each row executes a secure DB mapping cycle.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* GLASSMORPHIC TOAST */}
      <GlassToast toast={{ show: toast.show, msg: toast.msg, type: toast.type as "success" | "error", id: 0 }} />
    </div>
  );
};

export default StudentManagement;