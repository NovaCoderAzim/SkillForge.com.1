import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Download, Search, Filter, User } from "lucide-react";

const AssignmentManager = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎨 iQmath Professional Brand Palette
  const brand = { 
    blue: "#005EB8", 
    green: "#87C232", 
    red: "#ef4444", 
    border: "#e2e8f0", 
    textMain: "#1e293b",
    bgLight: "#f8fafc" 
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://127.0.0.1:8000/api/v1/assignments/submissions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(res.data);
    } catch (err) {
      console.error("Error fetching submissions", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ MERGED LOGIC: Real API Patching for Certification Unlocking
  const updateStatus = async (submissionId: number, status: "Accepted" | "Rejected") => {
    const token = localStorage.getItem("token");
    try {
      await axios.patch(`http://127.0.0.1:8000/api/v1/assignments/${submissionId}/status`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // ✅ Visual confirmation that this triggers the certification logic
      alert(`Student assignment ${status}! If mandatory, their certificate is now moving toward unlocked status.`);
      fetchSubmissions(); 
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Error updating assignment status. Please try again.");
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: brand.blue }}>Loading submissions...</div>;

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: brand.textMain }}>Assignment Submissions</h2>
        <p style={{ color: "#64748b" }}>Review, download from Drive, and grade mandatory project milestones.</p>
      </div>

      {/* 🔍 TABLE FILTERS */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
          <input 
            placeholder="Search student or course..." 
            style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "8px", border: `1px solid ${brand.border}`, outline: "none" }}
          />
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: `1px solid ${brand.border}`, background: "white", cursor: "pointer" }}>
          <Filter size={18} /> Filter
        </button>
      </div>

      {/* 📊 DATA TABLE */}
      <div style={{ background: "white", borderRadius: "12px", border: `1px solid ${brand.border}`, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: brand.bgLight, borderBottom: `1px solid ${brand.border}` }}>
            <tr>
              <th style={thStyle}>Student Name</th>
              <th style={thStyle}>Course & Assignment</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No submissions found yet.</td></tr>
            ) : (
              submissions.map((sub: any) => (
                <tr key={sub.id} style={{ borderBottom: `1px solid ${brand.border}`, transition: 'background 0.2s' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '50%' }}><User size={16} color={brand.blue} /></div>
                      <span style={{ fontWeight: "600" }}>{sub.student_name}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{sub.assignment_title}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{sub.course_name}</div>
                  </td>
                  <td style={tdStyle}>{sub.submitted_at}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                      background: sub.status === "Pending" ? "#fef3c7" : sub.status === "Accepted" ? "#dcfce7" : "#fee2e2",
                      color: sub.status === "Pending" ? "#d97706" : sub.status === "Accepted" ? "#166534" : "#991b1b"
                    }}>
                      {sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {/* ✅ Status Trigger Buttons */}
                      <button onClick={() => updateStatus(sub.id, "Accepted")} style={actionBtnStyle} title="Accept Submission"><CheckCircle size={20} color={brand.green} /></button>
                      <button onClick={() => updateStatus(sub.id, "Rejected")} style={actionBtnStyle} title="Reject Submission"><XCircle size={20} color={brand.red} /></button>
                      
                      {/* ✅ External Drive Link (Cost-Free Storage) */}
                      <a href={sub.file_url} target="_blank" rel="noopener noreferrer" style={actionBtnStyle} title="Review File on Drive">
                        <Download size={20} color={brand.blue} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Standard Table Styles ---
const thStyle = { padding: "16px 20px", color: "#64748b", fontWeight: "600", fontSize: "13px", textTransform: "uppercase" as const };
const tdStyle = { padding: "16px 20px", fontSize: "14px" };
const actionBtnStyle = { background: "none", border: "none", cursor: "pointer", padding: "4px", display: 'flex', alignItems: 'center' };

export default AssignmentManager;