import { useState, useEffect } from "react";
import MachineList from "./components/MachineList.jsx";
import WorkPackageList from "./components/WorkPackageList.jsx";
import KanbanBoard from "./components/KanbanBoard.jsx";
import EmployeeManager from "./components/EmployeeManager.jsx";
import CustomerList from "./components/CustomerList.jsx";
import "./App.css";

function App() {
  // --- GİRİŞ (LOGIN) STATE'LERİ ---
  const [user, setUser] = useState(null); // Giriş yapan kullanıcı bilgisi { username, role }
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("production");
  const [machines, setMachines] = useState([]);
  const [parts, setParts] = useState([]);
  const [workPackages, setWorkPackages] = useState([]);

  // Backend'den Veri Çekme
  const fetchData = async () => {
    try {
      const machRes = await fetch("http://localhost:8080/api/machines");
      setMachines(await machRes.json());
      const partRes = await fetch("http://localhost:8080/api/parts");
      setParts(await partRes.json());
      const wpRes = await fetch("http://localhost:8080/api/work-packages");
      setWorkPackages(await wpRes.json());
    } catch (error) {
      console.error("Backend bağlantı hatası:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Giriş Yapma Fonksiyonu
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Giriş başarısız!");
      }

      // Başarılı giriş! Kullanıcıyı kaydet
      setUser({ username: data.username, role: data.role });

      // ROLÜNE GÖRE İLK AÇILACAK SEKMEYİ BELİRLE
      if (data.role === "QUALITY") {
        setActiveTab("kanban"); // Kaliteci sadece kanban'ı göreceği için oradan başlar
      } else if (data.role === "PRODUCTION") {
        setActiveTab("workPackages"); // Üretimci makineleri göremediği için iş paketlerinden başlar
      } else {
        setActiveTab("production"); // Admin her şeyi gördüğü için en baştan başlar
      }
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // Çıkış Yapma Fonksiyonu
  const handleLogout = () => {
    setUser(null);
    setUsernameInput("");
    setPasswordInput("");
  };

  const tabStyle = (tabName) => ({
    padding: "12px 24px",
    backgroundColor: activeTab === tabName ? "#3b82f6" : "#1e293b",
    color: activeTab === tabName ? "#fff" : "#94a3b8",
    border: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "10px",
    transition: "0.3s",
  });

  // ==========================================
  // EĞER KULLANICI GİRİŞ YAPMADIYSA: LOGIN EKRANI
  // ==========================================
  if (!user) {
    return (
      <div
        style={{
          fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#1e293b",
            padding: "40px",
            borderRadius: "12px",
            border: "1px solid #334155",
            width: "380px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              color: "#38bdf8",
              marginBottom: "10px",
            }}
          >
            ⚙️ Nexom ERP
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "14px",
              marginBottom: "30px",
            }}
          >
            Lütfen sisteme giriş yapın
          </p>

          {loginError && (
            <div
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                padding: "10px",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "15px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {loginError}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "#94a3b8",
                  marginBottom: "5px",
                }}
              >
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #475569",
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "#94a3b8",
                  marginBottom: "5px",
                }}
              >
                Şifre
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #475569",
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                padding: "12px",
                borderRadius: "6px",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "10px",
                fontSize: "15px",
              }}
            >
              Giriş Yap ➔
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // GİRİŞ YAPILDIYSA: ANA ERP PANELİ (Rol Yetkilendirmeli)
  // ==========================================
  return (
    <div
      style={{
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        minHeight: "100vh",
        padding: "30px",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid #334155",
          paddingBottom: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ margin: 0, color: "#38bdf8", fontSize: "24px" }}>
            ⚙️ Nexom ERP
          </h1>

          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <span
              style={{
                backgroundColor: "#1e293b",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #475569",
                fontSize: "14px",
              }}
            >
              👤 {user.username} (
              <span style={{ color: "#38bdf8" }}>{user.role}</span>)
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              Çıkış Yap 🚪
            </button>
          </div>
        </div>

        <nav style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Üretim Makinelerini SADECE ADMIN görebilir */}
          {user.role === "ADMIN" && (
            <button
              style={tabStyle("production")}
              onClick={() => setActiveTab("production")}
            >
              🏭 Üretim & Makineler
            </button>
          )}

          {user.role === "ADMIN" && (
            <button
              style={tabStyle("employees")}
              onClick={() => setActiveTab("employees")}
            >
              👥 Çalışan Yönetimi
            </button>
          )}

          {/* İş Paketlerini ADMIN ve ÜRETİM görebilir (Kalite göremez) */}
          {(user.role === "ADMIN" || user.role === "PRODUCTION") && (
            <button
              style={tabStyle("workPackages")}
              onClick={() => setActiveTab("workPackages")}
            >
              📦 İş Paketleri
            </button>
          )}

          <button
            onClick={() => setActiveTab("CUSTOMERS")}
            style={{
              backgroundColor:
                activeTab === "CUSTOMERS" ? "#3b82f6" : "#1e293b",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "0.3s",
            }}
          >
            👥 Müşteriler
          </button>

          {/* Kalite & Teslimat bölümünü HERKES (Admin, Üretim, Kalite) görebilir */}
          <button
            style={tabStyle("kanban")}
            onClick={() => setActiveTab("kanban")}
          >
            🚚 Kalite & Teslimat
          </button>
        </nav>
      </header>

      <main>
        {/* Sadece Admin yetkisi varsa ve sekme seçiliyse Makine Listesini çiz */}
        {user.role === "ADMIN" && activeTab === "production" && (
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <MachineList
              machines={machines}
              parts={parts}
              onRefresh={fetchData}
            />
          </div>
        )}

        {/* Yeni Çalışan Yönetimi Sekmesi */}
        {user.role === "ADMIN" && activeTab === "employees" && (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <EmployeeManager />
          </div>
        )}

        {/* Admin veya Üretim yetkisi varsa İş Paketlerini çiz */}
        {(user.role === "ADMIN" || user.role === "PRODUCTION") &&
          activeTab === "workPackages" && (
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
              <WorkPackageList
                workPackages={workPackages}
                parts={parts}
                machines={machines}
                onRefresh={fetchData}
                user={user}
              />
            </div>
          )}

        {/* Kanban Board'ı herkes görebilir */}
        {activeTab === "kanban" && (
          <div>
            <h2 style={{ color: "#f8fafc", marginBottom: "20px" }}>
              Üretim Sonrası Akış Panosu
            </h2>
            <KanbanBoard parts={parts} onRefresh={fetchData} />
          </div>
        )}

        {/* Müşteriler Sekmesi */}
        {activeTab === "CUSTOMERS" && (
          <CustomerList
            workPackages={workPackages}
            parts={parts}
            onRefresh={fetchData}
            user={user}
          />
        )}
      </main>
    </div>
  );
}

export default App;
