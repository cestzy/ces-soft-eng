"use client";
import { useState } from "react";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion"; // Make sure to: npm install framer-motion

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        // We save the FULL result from the DB, including the user's name
        localStorage.setItem("user", JSON.stringify(result.user));

        // Direct routing based on the role stored in Neon
        if (result.user.role === 'staff') {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        setError(result.error || "Invalid school credentials.");
      }
    } catch (err) {
      setError("Connection to Neon DB failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.card}
      >
        <div style={styles.header}>
          <div style={styles.logoIcon}><ShieldCheck size={32} color="#0070f3" /></div>
          <h1 style={styles.title}>BorrowBox</h1>
          <p style={styles.subtitle}>Equipment Management Portal</p>
        </div>

        {error && <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={styles.error}>{error}</motion.div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>School Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.icon} />
              <input 
                type="email" 
                style={styles.input} 
                placeholder="name@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.icon} />
              <input 
                type="password" 
                style={styles.input} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" },
  card: { width: "90%", maxWidth: "400px", padding: "40px", background: "#fff", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)" },
  header: { textAlign: "center", marginBottom: "32px" },
  logoIcon: { marginBottom: "12px", display: "flex", justifyContent: "center" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1a1a1a", margin: 0 },
  subtitle: { color: "#6c757d", fontSize: "14px", marginTop: "4px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#495057" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  icon: { position: "absolute", left: "16px", color: "#adb5bd" },
  input: { width: "100%", padding: "14px 16px 14px 48px", borderRadius: "12px", border: "1px solid #dee2e6", outline: "none", fontSize: "15px", transition: "all 0.2s" },
  button: { padding: "14px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", display: "flex", justifyContent: "center" },
  error: { padding: "12px", background: "#fff5f5", color: "#e03131", borderRadius: "10px", fontSize: "13px", textAlign: "center", border: "1px solid #ffa8a8" }
};