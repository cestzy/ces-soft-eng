"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, User, Bell, Shield, LogOut } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState({ name: "User", role: "student", email: "" });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => window.location.href = "/dashboard"} style={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>Settings</h2>
      </header>

      <main style={styles.main}>
        {/* Profile Section */}
        <section style={styles.section}>
          <div style={styles.profileInfo}>
            <div style={styles.avatar}><User size={32} /></div>
            <div>
              <h3 style={styles.name}>{user.name || "Guest User"}</h3>
              <p style={styles.role}>{user.role?.toUpperCase()}</p>
            </div>
          </div>
        </section>

        {/* Settings Links */}
        <div style={styles.list}>
          <div style={styles.item}><Bell size={18} /> Notifications</div>
          <div style={styles.item}><Shield size={18} /> Privacy & Security</div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} /> Logout Account
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", minHeight: "100vh" },
  header: { display: "flex", alignItems: "center", padding: "20px", borderBottom: "1px solid #eee", gap: "15px" },
  backBtn: { background: "none", border: "none", cursor: "pointer" },
  title: { margin: 0, fontSize: "20px" },
  main: { padding: "20px" },
  section: { marginBottom: "30px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "10px" },
  profileInfo: { display: "flex", alignItems: "center", gap: "15px" },
  avatar: { width: "60px", height: "60px", backgroundColor: "#ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  name: { margin: 0, fontSize: "18px" },
  role: { margin: 0, fontSize: "12px", color: "#666", fontWeight: "bold" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  item: { padding: "15px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "10px", color: "#444" },
  logoutBtn: { padding: "15px", display: "flex", alignItems: "center", gap: "10px", color: "#d9534f", border: "none", background: "none", cursor: "pointer", width: "100%", fontWeight: "bold" }
};