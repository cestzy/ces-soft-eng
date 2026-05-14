"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  QrCode, Package, History, LogOut, 
  Camera, Upload, Loader2, CheckCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("scan");
  const [scanMode, setScanMode] = useState("camera");
  const [user, setUser] = useState({ name: "Student", email: "", role: "student" });
  const [myItems, setMyItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scannerRef = useRef(null);

  // Handle Mounting
  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem("user");
    if (!savedUser) { 
      window.location.href = "/"; 
      return; 
    }
    setUser(JSON.parse(savedUser));
  }, []);

  // Fetch Items Logic
  const fetchMyItems = useCallback(async () => {
    if (!user.email) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/my-items?email=${user.email}`);
      const data = await res.json();
      setMyItems(data.items || []);
    } catch (err) {
      console.error("Failed to refresh items");
    } finally {
      setIsRefreshing(false);
    }
  }, [user.email]);

  useEffect(() => {
    if (activeTab === "items") {
      fetchMyItems();
    }
  }, [activeTab, fetchMyItems]);

  // FIXED SCANNER LOGIC
  useEffect(() => {
    if (!isMounted || activeTab !== "scan" || scanMode !== "camera") return;

    // Small delay to ensure the DOM element #reader is rendered
    const timeoutId = setTimeout(() => {
      const element = document.getElementById("reader");
      if (!element) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner("reader", {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true
        });

        scannerRef.current.render(async (decodedText) => {
          try {
            const res = await fetch('/api/borrow', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                equipmentId: decodedText,
                userEmail: user.email,
                userName: user.name
              }),
            });
            const result = await res.json();
            if (res.ok) {
              alert("Success: Item Borrowed!");
              setActiveTab("items");
            } else {
              alert(result.error);
            }
          } catch (err) { 
            alert("Scanner Error"); 
          } finally {
            if (scannerRef.current) {
              scannerRef.current.clear();
              scannerRef.current = null;
            }
          }
        }, (err) => {});
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
        scannerRef.current = null;
      }
    };
  }, [isMounted, activeTab, scanMode, user]);

  if (!isMounted) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.logo}>BorrowBox</h2>
        <div style={styles.profileBox}>
          <div style={styles.profileText}>
            <span style={styles.pName}>{user.name}</span>
            <span style={styles.pRole}>{user.role}</span>
          </div>
          <div style={styles.avatar}>{user.name[0]}</div>
        </div>
      </header>

      <main style={styles.content}>
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.section 
              key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={styles.section}
            >
              <h3 style={styles.sectionTitle}>Scan Equipment</h3>
              <div style={styles.toggleContainer}>
                <div style={{...styles.toggleBackground, transform: scanMode === "camera" ? "translateX(0%)" : "translateX(100%)"}} />
                <button onClick={() => setScanMode("camera")} style={{...styles.toggleBtn, color: scanMode === "camera" ? "#fff" : "#666"}}>
                  <Camera size={18} /> Camera
                </button>
                <button onClick={() => setScanMode("upload")} style={{...styles.toggleBtn, color: scanMode === "upload" ? "#fff" : "#666"}}>
                  <Upload size={18} /> Upload
                </button>
              </div>
              
              {/* THE TARGET ELEMENT */}
              <div id="reader" style={styles.readerBox}>
                {scanMode === "upload" && <div style={styles.uploadInfo}>Click 'Scan an Image File' below</div>}
              </div>
            </motion.section>
          )}

          {activeTab === "items" && (
            <motion.section key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.section}>
              <h3 style={styles.sectionTitle}>My Current Items</h3>
              {isRefreshing ? (
                <div style={styles.loader}><Loader2 className="animate-spin" /> Fetching latest...</div>
              ) : myItems.length === 0 ? (
                <div style={styles.emptyItems}><Package size={48} /><p>Nothing borrowed yet.</p></div>
              ) : (
                <div style={styles.grid}>{myItems.map(item => (
                  <div key={item.id} style={styles.itemCard}>
                    <strong>{item.name}</strong>
                    <span>ID: {item.id}</span>
                  </div>
                ))}</div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <nav style={styles.bottomNav}>
        <button onClick={() => setActiveTab("scan")} style={activeTab === "scan" ? styles.navTabActive : styles.navTab}><QrCode /><span>Scan</span></button>
        <button onClick={() => setActiveTab("items")} style={activeTab === "items" ? styles.navTabActive : styles.navTab}><Package /><span>Items</span></button>
        <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} style={styles.navTab}><LogOut /><span>Logout</span></button>
      </nav>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column", background: "#fbfcfd", fontFamily: "sans-serif" },
  header: { padding: "20px", background: "#fff", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0" },
  logo: { fontSize: "20px", fontWeight: "800", color: "#0070f3", margin: 0 },
  profileBox: { display: "flex", alignItems: "center", gap: "10px" },
  profileText: { textAlign: "right", display: "flex", flexDirection: "column" },
  pName: { fontSize: "14px", fontWeight: "700" },
  pRole: { fontSize: "11px", color: "#888", textTransform: "uppercase" },
  avatar: { width: "35px", height: "35px", background: "#f0f7ff", color: "#0070f3", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  content: { flex: 1, padding: "20px", overflowY: "auto", maxWidth: "500px", margin: "0 auto", width: "100%" },
  toggleContainer: { position: "relative", display: "flex", background: "#eee", borderRadius: "12px", padding: "4px", marginBottom: "20px" },
  toggleBackground: { position: "absolute", width: "calc(50% - 4px)", height: "calc(100% - 8px)", background: "#0070f3", borderRadius: "8px", transition: "transform 0.3s" },
  toggleBtn: { flex: 1, zIndex: 1, padding: "10px", border: "none", background: "none", cursor: "pointer", display: "flex", justifyContent: "center", gap: "8px", fontWeight: "600" },
  readerBox: { width: "100%", borderRadius: "20px", overflow: "hidden", border: "1px solid #eee", background: "#fff" },
  bottomNav: { display: "flex", background: "#fff", borderTop: "1px solid #f0f0f0", padding: "10px 0 25px" },
  navTab: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "none", color: "#aaa", fontSize: "11px" },
  navTabActive: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "none", color: "#0070f3", fontWeight: "bold", fontSize: "11px" },
  itemCard: { padding: "15px", background: "#fff", borderRadius: "12px", border: "1px solid #eee", marginBottom: "10px", display: "flex", flexDirection: "column" },
  loader: { textAlign: "center", padding: "40px", color: "#0070f3" },
  uploadInfo: { padding: "40px", textAlign: "center", color: "#888" },
  emptyItems: { textAlign: "center", padding: "60px", color: "#ccc", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }
};