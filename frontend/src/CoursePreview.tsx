import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Trash2, Edit2, Video, FileText, 
  Code, HelpCircle, FileQuestion, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, X
} from "lucide-react";

const CoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  // Editing State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // 🎨 PROFESSIONAL THEME
  const brand = { 
    blue: "#005EB8", 
    green: "#87C232", 
    textMain: "#1e293b", 
    textLight: "#64748b",
    cardBg: "#F8FAFC",
    border: "#cbd5e1"
  };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  useEffect(() => { fetchCourseData(); }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/courses/${courseId}/player`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(res.data);
      setExpandedModules(res.data.modules.map((m: any) => m.id));
    } catch (err) { console.error("Error loading preview", err); } finally { setLoading(false); }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:8000/api/v1/content/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCourseData(); 
      triggerToast("Item deleted successfully", "success");
    } catch (err) { triggerToast("Failed to delete item.", "error"); }
  };

  const handleEditStart = (item: any) => { setEditingItem(item); setEditTitle(item.title); setEditUrl(item.url); };
  const handleEditSave = async () => {
    if (!editingItem) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/content/${editingItem.id}`, { title: editTitle, url: editUrl }, { headers: { Authorization: `Bearer ${token}` } });
      setEditingItem(null); fetchCourseData(); triggerToast("Item updated successfully", "success");
    } catch (err) { triggerToast("Failed to update item.", "error"); }
  };

  const toggleModule = (id: number) => { setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]); };

  const getIcon = (type: string) => {
    switch (type) {
      case "video": return <Video size={18} color="#005EB8" />;
      case "note": return <FileText size={18} color="#E67E22" />;
      case "quiz": return <HelpCircle size={18} color="#87C232" />;
      case "code": return <Code size={18} color="#9B59B6" />;
      default: return <FileQuestion size={18} color="#64748b" />;
    }
  };

  if (loading) return <div style={{ padding: "40px", color: brand.textLight }}>Loading content...</div>;
  if (!course) return <div style={{ padding: "40px", color: brand.textLight }}>Course not found.</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button onClick={() => navigate(`/dashboard/course/${courseId}/builder`)} style={{ background: "white", border: `1px solid ${brand.border}`, borderRadius: "50%", padding: "8px", cursor: "pointer", color: brand.textMain }}>
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 style={{ fontSize: "24px", margin: 0, color: brand.textMain, fontWeight: "800" }}>{course.title}</h1>
             <p style={{ color: brand.textLight, margin: "5px 0 0 0", fontSize: "14px" }}>Content Manager & Preview</p>
          </div>
        </div>
        <div style={{ background: "#e0f2fe", color: "#005EB8", padding: "8px 16px", borderRadius: "20px", fontWeight: "700", fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Instructor View
        </div>
      </div>

      {/* MODULES LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {course.modules.map((module: any) => (
          <div key={module.id} style={{ border: `1px solid ${brand.border}`, borderRadius: "12px", background: brand.cardBg, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            
            {/* Module Header */}
            <div 
              onClick={() => toggleModule(module.id)}
              style={{ padding: "16px 20px", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: expandedModules.includes(module.id) ? `1px solid ${brand.border}` : "none" }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: brand.textMain }}>{module.title}</h3>
              {expandedModules.includes(module.id) ? <ChevronDown size={20} color={brand.textLight} /> : <ChevronRight size={20} color={brand.textLight} />}
            </div>

            {/* Lessons List */}
            {expandedModules.includes(module.id) && (
              <div style={{ padding: "10px" }}>
                {module.lessons.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: brand.textLight, fontSize: "14px", fontStyle: "italic" }}>No content in this module yet.</div>
                ) : (
                  module.lessons.map((lesson: any) => (
                    <div key={lesson.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #f1f5f9", background: "white", borderRadius: "8px", marginBottom: "8px" }}>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", background: "#F8FAFC", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${brand.border}` }}>
                          {getIcon(lesson.type)}
                        </div>
                        <div>
                           <div style={{ fontWeight: "600", fontSize: "14px", color: brand.textMain }}>{lesson.title}</div>
                           <div style={{ fontSize: "12px", color: brand.textLight, maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                             {lesson.type.toUpperCase()} • {lesson.url || "No Link"}
                           </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                         <button onClick={() => handleEditStart(lesson)} style={{ padding: "8px", border: `1px solid ${brand.border}`, borderRadius: "8px", background: "white", cursor: "pointer", color: brand.textLight, transition: "all 0.2s" }} title="Edit Details">
                           <Edit2 size={16} />
                         </button>
                         <button onClick={() => handleDelete(lesson.id)} style={{ padding: "8px", border: "1px solid #fee2e2", borderRadius: "8px", background: "#fff1f2", cursor: "pointer", color: "#ef4444", transition: "all 0.2s" }} title="Delete Item">
                           <Trash2 size={16} />
                         </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: brand.cardBg, padding: "30px", borderRadius: "16px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, color: brand.textMain, fontWeight: "800", fontSize: "18px" }}>Edit Content</h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "5px", color: brand.textLight, textTransform: "uppercase" }}>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${brand.border}`, outline: "none", color: brand.textMain }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "5px", color: brand.textLight, textTransform: "uppercase" }}>URL / Content Link</label>
              <input value={editUrl} onChange={e => setEditUrl(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${brand.border}`, outline: "none", color: brand.textMain }} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
               <button onClick={handleEditSave} style={{ flex: 1, padding: "10px", background: brand.blue, color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Save Changes</button>
               <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: "10px", background: "white", color: brand.textLight, border: `1px solid ${brand.border}`, borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "white", padding: "16px 24px", borderRadius: "12px",
          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)", borderLeft: `6px solid ${toast.type === "success" ? brand.green : "#ef4444"}`,
          display: "flex", alignItems: "center", gap: "12px", animation: "slideIn 0.3s ease-out"
        }}>
           {toast.type === "success" ? <CheckCircle size={24} color={brand.green} /> : <AlertCircle size={24} color="#ef4444" />}
           <div>
             <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: brand.textMain }}>{toast.type === "success" ? "Success" : "Error"}</h4>
             <p style={{ margin: 0, fontSize: "13px", color: brand.textLight }}>{toast.message}</p>
           </div>
           <button onClick={() => setToast({ ...toast, show: false })} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "10px" }}>
             <X size={16} color="#94a3b8" />
           </button>
           <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        </div>
      )}
    </div>
  );
};

export default CoursePreview;