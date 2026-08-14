import { useState, useEffect } from "react";
import MachineList from "./components/MachineList.jsx";
import PartList from "./components/PartList.jsx";
import WorkPackageList from "./components/WorkPackageList.jsx";
import KanbanBoard from "./components/KanbanBoard.jsx";
import "./App.css";

function App() {
  // 1. DÜZELTME: Çift activeTab tanımlaması teke düşürüldü.
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
    fetchData();
  }, []);

  // 2. DÜZELTME: Çift tabStyle tanımlaması tek fonksiyonda birleştirildi.
  const tabStyle = (tabName) => ({
    padding: "12px 24px",
    backgroundColor: activeTab === tabName ? "#3b82f6" : "#1e293b",
    color: activeTab === tabName ? "#fff" : "#94a3b8",
    border: "none",
    borderRadius: "8px 8px 0 0", // Sekme görünümü için alt köşeler düz
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "10px",
    transition: "0.3s",
  });

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
          <span
            style={{
              backgroundColor: "#1e293b",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #475569",
              fontSize: "14px",
            }}
          >
            Backend: <span style={{ color: "#4ade80" }}>● Bağlı</span>
          </span>
        </div>

        <nav style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            style={tabStyle("production")}
            onClick={() => setActiveTab("production")}
          >
            🏭 Üretim & Makineler
          </button>

          <button
            style={tabStyle("workPackages")}
            onClick={() => setActiveTab("workPackages")}
          >
            📦 İş Paketleri
          </button>

          <button
            style={tabStyle("kanban")}
            onClick={() => setActiveTab("kanban")}
          >
            🚚 Kalite & Teslimat
          </button>
        </nav>
      </header>

      <main>
        {activeTab === "production" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
            }}
          >
            {/* 3. DÜZELTME: MachineList'e parts prop'u eklendi */}
            <MachineList
              machines={machines}
              parts={parts}
              onRefresh={fetchData}
            />
            <PartList
              parts={parts}
              machines={machines}
              workPackages={workPackages}
              onRefresh={fetchData}
            />
          </div>
        )}

        {activeTab === "workPackages" && (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <WorkPackageList
              workPackages={workPackages}
              parts={parts}
              machines={machines}
              onRefresh={fetchData}
            />
          </div>
        )}
      </main>
      {activeTab === "kanban" && (
        <div>
          <h2 style={{ color: "#f8fafc", marginBottom: "20px" }}>
            Üretim Sonrası Akış Panosu
          </h2>
          <KanbanBoard parts={parts} onRefresh={fetchData} />
        </div>
      )}
    </div>
  );
}

export default App;
