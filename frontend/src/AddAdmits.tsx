import { useState, useEffect } from "react";
import axios from "axios";
import { 
  UserPlus, Upload, FileSpreadsheet, CheckCircle, 
  Download, AlertCircle, X, Shield 
} from "lucide-react";

// Types
interface Course {
  id: number;
  title: string;
}

const AddAdmits = () => {
  // --- STATE ---
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Single Admit State
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [singleLoading, setSingleLoading] = useState(false);

  // Bulk Admit State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkCourseId, setBulkCourseId] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Create Instructor Modal State
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [instName, setInstName] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instPassword, setInstPassword] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const brand = { blue: "#005EB8", green: "#87C232", bg: "#f8fafc", border: "#e2e8f0" };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data);
      } catch (err) { console.error("Error fetching courses", err); }
    };
    fetchCourses();
  }, []);

  // Handle Create Instructor
  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await axios.post("http://127.0.0.1:8000/api/v1/users", {
            email: instEmail,
            password: instPassword,
            name: instName,
            role: "instructor" 
        });
        triggerToast("👨‍🏫 New Instructor Created Successfully!", "success");
        setShowInstructorModal(false);
        setInstName(""); setInstEmail(""); setInstPassword("");
    } catch (err: any) {
        triggerToast("Failed to create instructor. Email might exist.", "error");
    }
  };

  const handleSingleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourseIds.length === 0) return triggerToast("Please select at least one course.", "error");
    setSingleLoading(true);
    
    // ✅ Generate Random Password Frontend-side
    const generatedPassword = Math.random().toString(36).slice(-8) + "1!";

    try {
      const token = localStorage.getItem("token");
      // ✅ Included password in payload so backend can email it
      const payload = { 
          full_name: singleName, 
          email: singleEmail, 
          course_ids: selectedCourseIds,
          password: generatedPassword 
      };
      
      const res = await axios.post("http://127.0.0.1:8000/api/v1/admin/admit-student", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerToast(`✅ Account Created & Email Sent to ${singleEmail}`, "success");
      setSingleName(""); setSingleEmail(""); setSelectedCourseIds([]);
    } catch (err: any) { triggerToast(`Error: ${err.response?.data?.detail || "Failed"}`, "error"); } 
    finally { setSingleLoading(false); }
  };

  const handleBulkAdmit = async () => {
    if (!bulkFile || !bulkCourseId) return triggerToast("Missing file or course selection.", "error");
    setBulkLoading(true);
    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("course_id", bulkCourseId.toString());
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://127.0.0.1:8000/api/v1/admin/bulk-admit", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      triggerToast(`🎉 Bulk Process Complete! Emails Sent.`, "success");
      setBulkFile(null);
    } catch (err: any) { triggerToast("Upload failed", "error"); } 
    finally { setBulkLoading(false); }
  };

  const toggleCourseSelection = (id: number) => {
    if (selectedCourseIds.includes(id)) { setSelectedCourseIds(selectedCourseIds.filter(cid => cid !== id)); } 
    else { setSelectedCourseIds([...selectedCourseIds, id]); }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email\nJohn Doe,john@college.edu";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_template.csv"); 
    document.body.appendChild(link); link.click();
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* HEADER WITH NEW INSTRUCTOR BUTTON */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Add Admits</h1>
        
        <button onClick={() => setShowInstructorModal(true)} style={{ background: "#1e293b", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={18} /> Create Instructor
        </button>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        {/* LEFT: SINGLE ADMIT */}
        <div style={cardStyle}>
          <div style={{ borderBottom: `1px solid ${brand.border}`, paddingBottom: "20px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
              <UserPlus size={24} color={brand.blue} /> Single Student Admit
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "5px" }}>Create account & assign free courses manually.</p>
          </div>
          <form onSubmit={handleSingleAdmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div><label style={labelStyle}>Full Name</label><input required value={singleName} onChange={e => setSingleName(e.target.value)} placeholder="Student Name" style={inputStyle} /></div>
            <div><label style={labelStyle}>Email Address</label><input required type="email" value={singleEmail} onChange={e => setSingleEmail(e.target.value)} placeholder="student@college.edu" style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Assign Free Courses</label>
              <div style={{ border: `1px solid ${brand.border}`, borderRadius: "10px", maxHeight: "150px", overflowY: "auto", padding: "10px", background: "#f8fafc" }}>
                {courses.map(course => (
                  <div key={course.id} onClick={() => toggleCourseSelection(course.id)} style={{ padding: "8px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", background: selectedCourseIds.includes(course.id) ? "#e0f2fe" : "transparent" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: "1px solid #cbd5e1", background: selectedCourseIds.includes(course.id) ? brand.blue : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedCourseIds.includes(course.id) && <CheckCircle size={12} color="white" />}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{course.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <button disabled={singleLoading} type="submit" style={{ ...btnStyle, background: brand.blue }}>{singleLoading ? "Processing..." : "Create Account & Send Email"}</button>
          </form>
        </div>

        {/* RIGHT: BULK ADMIT */}
        <div style={cardStyle}>
          <div style={{ borderBottom: `1px solid ${brand.border}`, paddingBottom: "20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}><FileSpreadsheet size={24} color={brand.green} /> Bulk Upload</h2>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "5px" }}>Upload Excel to onboard a whole batch.</p>
            </div>
            <button onClick={downloadTemplate} style={{ fontSize: "13px", color: brand.blue, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600" }}><Download size={16} /> Template</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
            <div>
              <label style={labelStyle}>Select Batch Course</label>
              <select value={bulkCourseId || ""} onChange={(e) => setBulkCourseId(Number(e.target.value))} style={inputStyle}>
                <option value="">-- Choose Course for Batch --</option>
                {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
              </select>
            </div>
            <div style={{ flex: 1, border: "2px dashed #cbd5e1", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", background: "#f8fafc", position: "relative" }}>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)} style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
              {bulkFile ? <div style={{ textAlign: "center" }}><FileSpreadsheet size={40} color={brand.green} /><div style={{ fontWeight: "700" }}>{bulkFile.name}</div></div> : <div style={{ textAlign: "center", color: "#94a3b8" }}><Upload size={40} /><div style={{ fontWeight: "600" }}>Drop Excel File Here</div></div>}
            </div>
            <button disabled={bulkLoading} onClick={handleBulkAdmit} style={{ ...btnStyle, background: brand.green }}>{bulkLoading ? "Processing..." : "Process Batch Upload"}</button>
          </div>
        </div>
      </div>

      {/* CREATE INSTRUCTOR MODAL */}
      {showInstructorModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}>
            <div style={{ background: "white", width: "400px", padding: "30px", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Create New Instructor</h2>
                    <X onClick={() => setShowInstructorModal(false)} style={{ cursor: "pointer", color: "#64748b" }} />
                </div>
                <form onSubmit={handleCreateInstructor} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div><label style={labelStyle}>Name</label><input required value={instName} onChange={e => setInstName(e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Email</label><input required type="email" value={instEmail} onChange={e => setInstEmail(e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Password</label><input required type="password" value={instPassword} onChange={e => setInstPassword(e.target.value)} style={inputStyle} /></div>
                    <button type="submit" style={{ ...btnStyle, background: "#1e293b", marginTop: "10px" }}>Generate Credentials</button>
                </form>
            </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: "white", padding: "16px 24px", borderRadius: "12px", boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)", borderLeft: `6px solid ${toast.type === "success" ? brand.green : "#ef4444"}`, display: "flex", alignItems: "center", gap: "12px", animation: "slideIn 0.3s ease-out" }}>
           {toast.type === "success" ? <CheckCircle size={24} color={brand.green} /> : <AlertCircle size={24} color="#ef4444" />}
           <div><h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>{toast.type === "success" ? "Success" : "Error"}</h4><p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{toast.message}</p></div>
           <button onClick={() => setToast({ ...toast, show: false })} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "10px" }}><X size={16} color="#94a3b8" /></button>
           <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        </div>
      )}
    </div>
  );
};

const cardStyle = { background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase" as const };
const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
const btnStyle = { width: "100%", padding: "14px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "filter 0.2s" };

export default AddAdmits;