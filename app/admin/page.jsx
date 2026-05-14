"use client";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Package, Bell, LogOut, Plus, 
  Trash2, CheckCircle2, Clock, Loader2, QrCode, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("stock");
  const [user, setUser] = useState({ name: "Admin", role: "staff" });
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState({ open: false, id: null, name: null });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    // Secure routing: verify role from database-synced local storage
    if (!savedUser || JSON.parse(savedUser).role !== 'staff') {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(savedUser));
    fetchInventory();
    fetchActivity();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/equipment');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) { console.error("Stock fetch failed"); }
    finally { setLoading(false); }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setNotifications(data.activity || []);
    } catch (err) { console.error("Activity fetch failed"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR - Desktop Only */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <h2 style={styles.logoText}>BorrowBox</h2>
          <span style={styles.adminBadge}>Inventory Management</span>
        </div>
        
        <nav style={styles.sideNav}>
          <button 
            onClick={() => setActiveTab('stock')} 
            style={activeTab === 'stock' ? styles.navBtnActive : styles.navBtn}
          >
            <Package size={20}/> Current Stock
          </button>
          <button 
            onClick={() => setActiveTab('notifs')} 
            style={activeTab === 'notifs' ? styles.navBtnActive : styles.navBtn}
          >
            <Bell size={20}/> Activity Log
          </button>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* MAIN PANEL */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h1>{activeTab === 'stock' ? 'Equipment Stock' : 'Recent Notifications'}</h1>
          <div style={styles.userProfile}>
            <div style={styles.userInfo}>
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
            <div style={styles.avatar}>{user.name[0]}</div>
          </div>
        </header>

        <div style={styles.scrollArea}>
          <AnimatePresence mode="wait">
            {activeTab === 'stock' ? (
              <StockView key="stock" items={items} onRefresh={fetchInventory} onOpenQR={setQrModal} />
            ) : (
              <ActivityView key="notifs" logs={notifications} />
            )}
          </AnimatePresence>
        </div>

        {/* QR Modal */}
        <QRModal qrModal={qrModal} onClose={() => setQrModal({ open: false, id: null, name: null })} />
      </main>

      {/* MOBILE NAVIGATION */}
      <footer style={styles.mobileNav}>
        <button onClick={() => setActiveTab('stock')} style={activeTab === 'stock' ? styles.mobActive : styles.mobTab}>
          <Package size={24} />
        </button>
        <button onClick={() => setActiveTab('notifs')} style={activeTab === 'notifs' ? styles.mobActive : styles.mobTab}>
          <Bell size={24} />
        </button>
        <button onClick={handleLogout} style={styles.mobTab}>
          <LogOut size={24} />
        </button>
      </footer>
    </div>
  );
}

function StockView({ items, onRefresh, onOpenQR }) {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Electronics");

  const handleReturn = async (itemId) => {
    // Calls the [id] PATCH route to mark as available
    const res = await fetch(`/api/equipment/${itemId}`, { method: 'PATCH' });
    if (res.ok) onRefresh();
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Remove this item?")) return;
    const res = await fetch(`/api/equipment/${itemId}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
    else {
      const err = await res.json();
      alert(err.error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* ADD ITEM FORM */}
      <div style={styles.card}>
        <form style={styles.inlineForm} onSubmit={async (e) => {
          e.preventDefault();
          const id = "EQ-" + Math.random().toString(36).substr(2, 5).toUpperCase();
          await fetch('/api/equipment', {
            method: 'POST',
            body: JSON.stringify({ id, name: itemName, category })
          });
          setItemName("");
          onRefresh();
        }}>
          <input 
            style={styles.input} 
            placeholder="Equipment Name" 
            value={itemName} 
            onChange={e => setItemName(e.target.value)} 
            required 
          />
          <button type="submit" style={styles.addBtn}>Add Item</button>
        </form>
      </div>

      {/* ITEM GRID */}
      <div style={styles.grid}>
        {items.map((item) => (
          <motion.div layout key={item.id} style={styles.itemCard}>
            <div style={styles.itemInfo}>
              <span style={styles.itemCat}>{item.category}</span>
              <h4 style={styles.itemName}>{item.name}</h4>
              <code style={styles.itemId}>{item.id}</code>
                
                <div style={styles.adminActions}>
                  {/* QR Button - Opens Modal */}
                  <button 
                    onClick={() => onOpenQR({ open: true, id: item.id, name: item.name })} 
                    style={styles.qrBtn}
                    title="View and download QR code"
                  >
                    <QrCode size={14} /> QR
                  </button>

                  {item.status === 'borrowed' && (
                    <button onClick={() => handleReturn(item.id)} style={styles.returnBtn}>
                      Return
                    </button>
                  )}
                  <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Hidden canvas used for generating the download */}
                <div style={{ display: 'none' }}>
                  <QRCodeCanvas
                    id={`qr-${item.id}`}
                    value={item.id}
                    size={256}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
              </div>
              <div style={item.status === 'available' ? styles.statusAvail : styles.statusBusy}>
                {item.status}
              </div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
}

// --- ACTIVITY VIEW (Notifications) ---
function ActivityView({ logs }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      style={styles.viewContainer}
    >
      <div style={styles.card}>
        <h3 style={styles.cardTitle}><Bell size={18} /> System Activity</h3>
        <div style={styles.logList}>
          {logs.length === 0 ? (
            <div style={styles.emptyState}>
              <Clock size={40} color="#eee" />
              <p>No recent activity logs found.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} style={styles.logEntry}>
                <div style={log.status === 'active' ? styles.indicatorActive : styles.indicatorReturn}>
                  {log.status === 'active' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                </div>
                <div style={styles.logText}>
                  <p>
                    <span style={styles.bold}>{log.user_name}</span> 
                    {log.status === 'active' ? ' borrowed ' : ' returned '} 
                    <span style={styles.bold}>{log.equipment_name}</span>
                  </p>
                  <span style={styles.logDate}>
                    {new Date(log.borrow_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                    {new Date(log.borrow_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- QR CODE MODAL ---
function QRModal({ qrModal, onClose }) {
  const handleDownload = () => {
    const canvas = document.getElementById(`qr-modal-${qrModal.id}`);
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${qrModal.name}_${qrModal.id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (!qrModal.open) return null;

  return (
    <motion.div 
      style={styles.modalOverlay}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>QR Code</h2>
          <button onClick={onClose} style={styles.modalCloseBtn}>
            <X size={20} />
          </button>
        </div>
        
        <div style={styles.modalQRContainer}>
          <QRCodeCanvas
            id={`qr-modal-${qrModal.id}`}
            value={qrModal.id}
            size={256}
            level="H"
            includeMargin={true}
            className="qr-code-canvas"
          />
        </div>
        
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
          {qrModal.name} ({qrModal.id})
        </p>
        
        <button onClick={handleDownload} style={styles.modalDownloadBtn}>
          Download as PNG
        </button>
      </motion.div>
    </motion.div>
  );
}

// Minimalist Light Theme Styles - Google-inspired Design
const styles = {
  container: { display: "flex", height: "100vh", background: "#fafafa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" },
  sidebar: { width: "280px", background: "#fff", borderRight: "1px solid #e8e8e8", padding: "24px 20px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  logoSection: { marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0" },
  logoText: { color: "#1a73e8", fontWeight: "700", fontSize: "24px", margin: 0, letterSpacing: "-0.5px" },
  adminBadge: { fontSize: "11px", color: "#5f6368", letterSpacing: "0.5px", textTransform: "uppercase", marginTop: "6px", display: "block" },
  sideNav: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  navBtn: { display: "flex", gap: "12px", alignItems: "center", padding: "10px 12px", border: "none", background: "none", cursor: "pointer", color: "#5f6368", borderRadius: "8px", fontSize: "14px", transition: "all 0.2s", fontWeight: "500" },
  navBtnActive: { display: "flex", gap: "12px", alignItems: "center", padding: "10px 12px", border: "none", background: "#e8f0fe", color: "#1a73e8", fontWeight: "600", borderRadius: "8px", fontSize: "14px" },
  logoutBtn: { padding: "10px 12px", background: "#f8f9fa", color: "#d33b27", border: "1px solid #e8e8e8", borderRadius: "8px", fontWeight: "500", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center", fontSize: "14px", transition: "all 0.2s" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "16px 32px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e8e8e8", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  userProfile: { display: "flex", alignItems: "center", gap: "12px" },
  userInfo: { textAlign: "right", fontSize: "13px" },
  avatar: { width: "36px", height: "36px", background: "#1a73e8", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "14px" },
  scrollArea: { padding: "32px 40px", overflowY: "auto", flex: 1 },
  card: { background: "#fff", padding: "24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e8e8e8", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  inlineForm: { display: "flex", gap: "10px" },
  input: { flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid #dadce0", fontSize: "14px", fontFamily: "inherit", transition: "border-color 0.2s" },
  addBtn: { padding: "10px 20px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  itemCard: { background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.2s" },
  itemInfo: { flex: 1 },
  itemCat: { fontSize: "11px", fontWeight: "600", color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", display: "block" },
  itemName: { fontSize: "16px", fontWeight: "600", color: "#202124", margin: "0 0 8px 0", lineHeight: "1.4" },
  itemId: { fontSize: "12px", background: "#f8f9fa", padding: "4px 8px", borderRadius: "4px", color: "#5f6368", display: "inline-block", fontFamily: "monospace", letterSpacing: "0.5px" },
  adminActions: { display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" },
  qrBtn: { background: "#f8f9fa", color: "#1a73e8", border: "1px solid #dadce0", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.2s" },
  returnBtn: { background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  deleteBtn: { background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", fontWeight: "600", transition: "all 0.2s" },
  statusAvail: { color: "#188038", fontSize: "12px", fontWeight: "600", marginTop: "8px" },
  statusBusy: { color: "#e37400", fontSize: "12px", fontWeight: "600", marginTop: "8px" },
  mobileNav: { display: "none", position: "fixed", bottom: 0, width: "100%", background: "#fff", padding: "15px", borderTop: "1px solid #e8e8e8", justifyContent: "space-around" },
  // Modal styles
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#fff", borderRadius: "16px", padding: "32px", textAlign: "center", maxWidth: "420px", width: "90%", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#202124", margin: 0 },
  modalCloseBtn: { background: "none", border: "none", cursor: "pointer", color: "#80868b", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" },
  modalQRContainer: { padding: "24px", background: "#f8f9fa", borderRadius: "12px", marginBottom: "24px", display: "flex", justifyContent: "center", border: "1px solid #e8e8e8" },
  modalDownloadBtn: { background: "#1a73e8", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px", width: "100%", transition: "all 0.2s" },
  // Activity view styles
  viewContainer: { maxWidth: "900px", margin: "0 auto" },
  cardTitle: { fontSize: "18px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#202124" },
  logList: { display: "flex", flexDirection: "column", gap: "12px" },
  logEntry: { 
    display: "flex", 
    gap: "15px", 
    padding: "16px", 
    background: "#fafafa", 
    borderRadius: "12px", 
    border: "1px solid #e8e8e8",
    transition: "all 0.2s"
  },
  indicatorActive: { width: "36px", height: "36px", borderRadius: "50%", background: "#fef7e0", color: "#ea8600", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  indicatorReturn: { width: "36px", height: "36px", borderRadius: "50%", background: "#d4edda", color: "#188038", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logText: { fontSize: "14px", color: "#202124", flex: 1 },
  bold: { fontWeight: "700", color: "#202124" },
  logDate: { fontSize: "12px", color: "#80868b", display: "block", marginTop: "4px" },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#bdbdbd" }
};