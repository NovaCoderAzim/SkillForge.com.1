import { useState } from "react";
import axios from "axios";
import { Lock, Save } from "lucide-react";

const InstructorSettings = () => {
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // 🎨 PROFESSIONAL THEME
  const brand = { 
    blue: "#005EB8", 
    cardBg: "#F8FAFC", 
    border: "#cbd5e1",
    textMain: "#1e293b",
    textLight: "#64748b"
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("Password too short");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://127.0.0.1:8000/api/v1/user/change-password", { new_password: newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Password updated successfully!");
      setNewPassword("");
    } catch (err) { alert("Failed to update password."); } 
    finally { setSaving(false); }
  };

  const [zoomAccountId, setZoomAccountId] = useState("");
  const [zoomClientId, setZoomClientId] = useState("");
  const [zoomClientSecret, setZoomClientSecret] = useState("");
  const [savingZoom, setSavingZoom] = useState(false);

  const handleZoomUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingZoom(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://127.0.0.1:8000/api/v1/user/zoom-credentials", 
        { account_id: zoomAccountId, client_id: zoomClientId, client_secret: zoomClientSecret }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Zoom API Credentials updated successfully!");
    } catch (err) { alert("Failed to save credentials."); } 
    finally { setSavingZoom(false); }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", animation: "fadeIn 0.3s ease" }}>
        <div style={{ background: brand.cardBg, borderRadius: "16px", padding: "40px", border: `1px solid ${brand.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px", paddingBottom: "20px", borderBottom: `1px solid ${brand.border}` }}>
                <div style={{ padding: "12px", background: "#e0f2fe", borderRadius: "12px", color: brand.blue }}>
                    <Lock size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: brand.textMain }}>Security Settings</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: brand.textLight }}>Update your instructor account password</p>
                </div>
            </div>

            <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: brand.textMain, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>New Password</label>
                    <input 
                        type="password" required minLength={6} 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="Enter new strong password" 
                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${brand.border}`, outline: "none", fontSize: "14px", boxSizing: "border-box", background: "white", color: brand.textMain }} 
                    />
                </div>
                <button type="submit" disabled={saving} style={{ width: "100%", padding: "14px", background: brand.blue, color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 12px rgba(0, 94, 184, 0.2)" }}>
                    <Save size={18} /> {saving ? "Updating..." : "Update Password"}
                </button>
            </form>

        </div>

        <div style={{ background: brand.cardBg, borderRadius: "16px", padding: "40px", border: `1px solid ${brand.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", marginTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px", paddingBottom: "20px", borderBottom: `1px solid ${brand.border}` }}>
                <div style={{ padding: "12px", background: "#e0e7ff", borderRadius: "12px", color: brand.blue }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: brand.textMain }}>Zoom Integration</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: brand.textLight }}>Manage your automated meeting link settings.</p>
                </div>
            </div>

            <form onSubmit={handleZoomUpdate}>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: brand.textMain, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Account ID</label>
                    <input 
                        required 
                        value={zoomAccountId} 
                        onChange={(e) => setZoomAccountId(e.target.value)} 
                        placeholder="e.g. abc123def456" 
                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${brand.border}`, outline: "none", fontSize: "14px", boxSizing: "border-box", background: "white", color: brand.textMain }} 
                    />
                </div>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: brand.textMain, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client ID</label>
                    <input 
                        required 
                        value={zoomClientId} 
                        onChange={(e) => setZoomClientId(e.target.value)} 
                        placeholder="e.g. r8t5v_xy1aA" 
                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${brand.border}`, outline: "none", fontSize: "14px", boxSizing: "border-box", background: "white", color: brand.textMain }} 
                    />
                </div>
                <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: brand.textMain, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client Secret</label>
                    <input 
                        type="password" required 
                        value={zoomClientSecret} 
                        onChange={(e) => setZoomClientSecret(e.target.value)} 
                        placeholder="•••••••••••••••••••••" 
                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${brand.border}`, outline: "none", fontSize: "14px", boxSizing: "border-box", background: "white", color: brand.textMain }} 
                    />
                </div>
                <button type="submit" disabled={savingZoom} style={{ width: "100%", padding: "14px", background: brand.textMain, color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: savingZoom ? 0.7 : 1 }}>
                    <Save size={18} /> {savingZoom ? "Saving Keys..." : "Save Zoom Credentials"}
                </button>
            </form>
        </div>

    </div>
  );
};

export default InstructorSettings;