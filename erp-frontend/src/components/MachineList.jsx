import { useState, useEffect } from "react";

export default function MachineList({ machines, parts = [], onRefresh }) {
  const [machineName, setMachineName] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [activePartInModal, setActivePartInModal] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);

  const [availableOperators, setAvailableOperators] = useState([]);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/staff");
        if (res.ok) {
          const data = await res.json();
          // Tüm çalışanları alıyoruz ki ID'den isim bulabilelim
          setAvailableOperators(data);
        }
      } catch (error) {
        console.error("Operatör listesi çekilemedi:", error);
      }
    };
    fetchOperators();
  }, []);

  const handleAddMachine = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:8080/api/machines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: machineName, maintenanceDate }),
    });
    setMachineName("");
    setMaintenanceDate("");
    setShowForm(false);
    onRefresh();
  };

  const handleDeleteMachine = async (id) => {
    if (window.confirm("Bu makineyi silmek istediğinize emin misiniz?")) {
      const res = await fetch(`http://localhost:8080/api/machines/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert(
          "⚠️ UYARI: Bu makinede işlem gören veya makineye atanmış parçalar var! Önce o parçaları başka makineye aktarın veya silin.",
        );
        return;
      }
      onRefresh();
    }
  };

  const openMachineModal = (machine, activePart) => {
    setSelectedMachine(machine);
    setActivePartInModal(activePart);
  };

  const handleCompleteProduction = async () => {
    if (!activePartInModal) return;
    if (
      !window.confirm(
        "Bu parçanın üretimini tamamlamak istediğinize emin misiniz?",
      )
    )
      return;

    setIsUploading(true);
    try {
      const updatedPart = {
        ...activePartInModal,
        producedQuantity: activePartInModal.quantity,
        status: "TAMAMLANDI",
        machine: activePartInModal.machine
          ? { id: activePartInModal.machine.id }
          : null,
        workPackage: activePartInModal.workPackage
          ? { id: activePartInModal.workPackage.id }
          : null,
        operator: activePartInModal.operator
          ? { id: activePartInModal.operator.id }
          : null,
      };

      const updateRes = await fetch(
        `http://localhost:8080/api/parts/${activePartInModal.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPart),
        },
      );

      if (!updateRes.ok) throw new Error("Kayıt Hatası");

      setSelectedMachine(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("Üretim tamamlanırken hata oluştu!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Tüm Makineler — Anlık Durum</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: "#10b981",
            color: "white",
            padding: "10px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {showForm ? "İptal" : "+ Makine Ekle"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddMachine}
          style={{
            backgroundColor: "#1e293b",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Makine Adı"
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            required
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #475569",
              backgroundColor: "#0f172a",
              color: "#fff",
              flex: 1,
            }}
          />
          <input
            type="date"
            value={maintenanceDate}
            onChange={(e) => setMaintenanceDate(e.target.value)}
            required
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #475569",
              backgroundColor: "#0f172a",
              color: "#fff",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#0284c7",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Kaydet
          </button>
        </form>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {machines.map((m) => {
          const activePart = parts.find(
            (p) => p.machine?.id === m.id && p.status === "URETIMDE",
          );
          const isProducing = !!activePart;
          const targetQty = activePart?.quantity || 1;
          const producedQty = activePart?.producedQuantity || 0;
          const progressPercent = isProducing
            ? Math.min(Math.round((producedQty / targetQty) * 100), 100)
            : 0;

          // KURŞUN GEÇİRMEZ OPERATÖR EŞLEŞTİRMESİ
          const opId = activePart?.operator?.id || activePart?.operator;

          const assignedOp = availableOperators.find((o) => o.id == opId);

          const operatorNameToShow =
            activePart?.operator?.username ||
            (assignedOp ? assignedOp.username : null) ||
            "Boşta";

          const isOpAssigned = operatorNameToShow !== "Boşta";

          return (
            <div
              key={m.id}
              style={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #334155",
                  paddingBottom: "10px",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "18px" }}>
                  {m.name}
                </h3>
                <button
                  onClick={() => handleDeleteMachine(m.id)}
                  style={{
                    background: "transparent",
                    color: "#ef4444",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Sil ✖
                </button>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  backgroundColor: "#0f172a",
                  borderRadius: "6px",
                  border: "1px dashed #475569",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
                  👨‍🔧 Operatör:{" "}
                  <strong
                    style={{ color: isOpAssigned ? "#10b981" : "#ef4444" }}
                  >
                    {operatorNameToShow}
                  </strong>
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "15px",
                  marginTop: "15px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: isProducing ? "#10b981" : "#64748b",
                    boxShadow: isProducing ? "0 0 8px #10b981" : "none",
                  }}
                ></div>
                <span
                  style={{
                    color: isProducing ? "#10b981" : "#94a3b8",
                    fontWeight: "bold",
                  }}
                >
                  {isProducing ? "Üretimde" : "Boşta"}
                </span>
              </div>

              <div
                style={{
                  minHeight: "80px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {isProducing ? (
                  <>
                    <div>
                      <strong>Makine:</strong> {m.name}
                    </div>
                    <div>
                      <strong>İş Paketi:</strong>{" "}
                      {activePart.workPackage?.packageNo}
                    </div>
                    <div>
                      <strong>Parça No:</strong> {activePart.partNo}
                    </div>
                    <div>
                      <strong>Ürün:</strong> {activePart.productName}
                    </div>
                    <div>
                      <strong>Parça Sayısı:</strong> {activePart.quantity}
                    </div>
                    <div>
                      <strong>Adet:</strong> {producedQty} / {targetQty}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      color: "#64748b",
                      fontStyle: "italic",
                      marginTop: "10px",
                    }}
                  >
                    Aktif iş yok.
                  </div>
                )}
              </div>

              <div style={{ marginTop: "20px" }}>
                <div
                  style={{
                    height: "8px",
                    width: "100%",
                    backgroundColor: "#0f172a",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: "#3b82f6",
                      height: "100%",
                      transition: "width 0.5s ease-in-out",
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginTop: "5px",
                    textAlign: "right",
                  }}
                >
                  {isProducing ? `%${progressPercent} tamamlandı` : "%0"}
                </div>
              </div>

              <button
                onClick={() => openMachineModal(m, activePart)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "20px",
                  backgroundColor: "#334155",
                  color: "#fff",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Makineyi Aç ➔
              </button>
            </div>
          );
        })}
      </div>

      {selectedMachine && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "30px",
              borderRadius: "12px",
              width: "500px",
              maxWidth: "90%",
              border: "1px solid #475569",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #334155",
                paddingBottom: "15px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, color: "#38bdf8" }}>
                {selectedMachine.name} Operatör Paneli
              </h2>
              <button
                onClick={() => setSelectedMachine(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✖
              </button>
            </div>

            {activePartInModal ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#0f172a",
                    padding: "15px",
                    borderRadius: "8px",
                    color: "#cbd5e1",
                  }}
                >
                  <p style={{ margin: "0 0 5px 0" }}>
                    <strong>İş Paketi:</strong>{" "}
                    {activePartInModal.workPackage?.packageNo}
                  </p>
                  <p style={{ margin: "0 0 5px 0" }}>
                    <strong>Parça No:</strong> {activePartInModal.partNo}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Ürün:</strong> {activePartInModal.productName}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                    marginTop: "15px",
                  }}
                >
                  {/* KALİTE İSTERİ GÖSTER BUTONU (Eğer ister yazılmışsa görünür) */}
                  {activePartInModal.qualityRequirements && (
                    <button
                      onClick={() => setShowQualityModal(true)}
                      style={{
                        width: "100%",
                        backgroundColor: "#f59e0b", // Dikkat çekici kehribar rengi
                        color: "white",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "none",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                      }}
                    >
                      📝 Kalite İsterini Görüntüle
                    </button>
                  )}
                  {/* EĞER TEKNİK RESİM YÜKLENMİŞSE GÖSTER */}
                  {activePartInModal.drawingPath && (
                    <a
                      href={`http://localhost:8080/api/files/${activePartInModal.drawingPath}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        width: "100%",
                        backgroundColor: "#475569",
                        color: "white",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #64748b",
                        fontWeight: "bold",
                        textAlign: "center",
                        textDecoration: "none",
                        display: "block",
                        boxSizing: "border-box",
                      }}
                    >
                      📄 Teknik Resmi Görüntüle
                    </a>
                  )}

                  {/* ÜRETİMİ TAMAMLA BUTONU */}
                  <button
                    onClick={handleCompleteProduction}
                    disabled={isUploading}
                    style={{
                      width: "100%",
                      backgroundColor: "#10b981",
                      color: "white",
                      padding: "15px",
                      borderRadius: "6px",
                      border: "none",
                      fontWeight: "bold",
                      cursor: isUploading ? "wait" : "pointer",
                      fontSize: "16px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    {isUploading
                      ? "İşlem Kapatılıyor..."
                      : "Üretimi Tamamla ✅"}
                  </button>
                </div>
              </div>
            ) : (
              <p
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  margin: "30px 0",
                }}
              >
                Bu makinede şu an aktif bir üretim bulunmuyor.
              </p>
            )}
          </div>
        </div>
      )}
      {/* YENİ: OPERATÖR İÇİN KALİTE İSTERİ GÖSTERİM MODALI */}
      {showQualityModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1300,
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "25px",
              borderRadius: "12px",
              width: "450px",
              border: "1px solid #475569",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#f8fafc" }}>
              📝 Kalite İsterleri ve Notlar
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginBottom: "15px",
              }}
            >
              Üretime devam ederken aşağıdaki kalite standartlarına ve ölçülere
              dikkat ediniz:
            </p>
            <div
              style={{
                backgroundColor: "#0f172a",
                padding: "15px",
                borderRadius: "8px",
                color: "#cbd5e1",
                minHeight: "100px",
                border: "1px solid #475569",
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
                fontSize: "14px",
              }}
            >
              {activePartInModal?.qualityRequirements}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setShowQualityModal(false)}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
