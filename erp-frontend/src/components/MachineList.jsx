import { useState } from "react";

export default function MachineList({ machines, parts = [], onRefresh }) {
  const [machineName, setMachineName] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [activePartInModal, setActivePartInModal] = useState(null);
  const [producedQuantity, setProducedQuantity] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [operatorModalMachine, setOperatorModalMachine] = useState(null);
  const [tempOperatorName, setTempOperatorName] = useState("");

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

  const handleSaveOperator = async () => {
    if (!operatorModalMachine) return;

    try {
      const updatedMachine = {
        ...operatorModalMachine,
        operatorName: tempOperatorName,
      };
      const res = await fetch(
        `http://localhost:8080/api/machines/${operatorModalMachine.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedMachine),
        },
      );

      if (!res.ok) throw new Error("Sunucu güncellemeyi reddetti!");

      setOperatorModalMachine(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("⚠️ Hata: Operatör atanamadı! Sunucu bağlantısını kontrol edin.");
    }
  };

  const openMachineModal = (machine, activePart) => {
    setSelectedMachine(machine);
    setActivePartInModal(activePart);
    setProducedQuantity(
      activePart && activePart.producedQuantity != null
        ? activePart.producedQuantity
        : 0,
    );
    setSelectedFile(null);
  };

  const handleSaveMachineData = async () => {
    if (!activePartInModal) return;
    setIsUploading(true);

    let drawingPath = activePartInModal.drawingPath;

    try {
      // 1. Dosya seçilmişse önce onu yükle
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch(
          "http://localhost:8080/api/files/upload",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!uploadRes.ok) throw new Error("Dosya yükleme başarısız!");

        const uploadData = await uploadRes.json();
        drawingPath = uploadData.fileName;
      }

      const newProducedQuantity = parseInt(producedQuantity, 10) || 0;
      const isCompleted = newProducedQuantity >= activePartInModal.quantity;

      if (newProducedQuantity > activePartInModal.quantity) {
        alert(
          `⚠️ Hata: Hedeflenen adetten (${activePartInModal.quantity}) fazla parça giremezsiniz!`,
        );
        setIsUploading(false);
        return;
      }

      // 2. Güncellenecek veriyi hazırla
      const updatedPart = {
        id: activePartInModal.id,
        partNo: activePartInModal.partNo,
        productName: activePartInModal.productName,
        quantity: activePartInModal.quantity,
        producedQuantity: newProducedQuantity,
        status: isCompleted ? "TAMAMLANDI" : activePartInModal.status,
        postProcess: activePartInModal.postProcess,
        drawingPath: drawingPath,
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

      console.log("Gönderilen Güncelleme Verisi:", updatedPart);

      const updateRes = await fetch(
        `http://localhost:8080/api/parts/${activePartInModal.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPart),
        },
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`Sunucu Hatası: ${errText}`);
      }

      setSelectedMachine(null);
      onRefresh();
    } catch (error) {
      console.error("Kayıt sırasında detaylı hata:", error);
      alert("Kayıt başarısız oldu! Konsolu (F12) kontrol edin.");
    } finally {
      setIsUploading(false); // Buton kilitlenmesini kesin olarak engeller
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

          // Güvenli yüzde hesaplama (NaN hatası engellendi)
          const targetQty = activePart?.quantity || 1;
          const producedQty = activePart?.producedQuantity || 0;
          const progressPercent = isProducing
            ? Math.min(Math.round((producedQty / targetQty) * 100), 100)
            : 0;

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
                    style={{ color: m.operatorName ? "#10b981" : "#ef4444" }}
                  >
                    {m.operatorName || "Atanmadı"}
                  </strong>
                </span>
                <button
                  onClick={() => {
                    setOperatorModalMachine(m);
                    setTempOperatorName(m.operatorName || "");
                  }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#38bdf8",
                    border: "1px solid #38bdf8",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {m.operatorName ? "Değiştir" : "Ata"}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "15px",
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
                    {/* Eklenecek 1: Makine İsmi */}
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

                    {/* Eklenecek 2: Parça Sayısı */}
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
                    <strong>Parça No:</strong>{" "}
                    {activePostProcessName(activePartInModal.partNo)}{" "}
                    {activePartInModal.partNo}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Ürün:</strong> {activePartInModal.productName}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#94a3b8",
                    }}
                  >
                    Gerçekte Üretilen Adet (Hedef: {activePartInModal.quantity}
                    ):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={activePartInModal.quantity}
                    value={producedQuantity}
                    onChange={(e) => setProducedQuantity(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #475569",
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#94a3b8",
                    }}
                  >
                    Teknik Resim Ekle (PDF/JPG):
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px dashed #475569",
                      backgroundColor: "#0f172a",
                      color: "#cbd5e1",
                    }}
                  />
                  {activePartInModal.drawingPath && !selectedFile && (
                    <p
                      style={{
                        margin: "5px 0 0 0",
                        fontSize: "12px",
                        color: "#10b981",
                      }}
                    >
                      Mevcut dosya yüklü: {activePartInModal.drawingPath}
                    </p>
                  )}
                </div>

                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button
                    onClick={handleSaveMachineData}
                    disabled={isUploading}
                    style={{
                      flex: 1,
                      backgroundColor: "#3b82f6",
                      color: "white",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "none",
                      fontWeight: "bold",
                      cursor: isUploading ? "wait" : "pointer",
                    }}
                  >
                    {isUploading ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  {activePartInModal.drawingPath && (
                    <a
                      href={`http://localhost:8080/api/files/${activePartInModal.drawingPath}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        backgroundColor: "#475569",
                        color: "white",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "none",
                        fontWeight: "bold",
                        textAlign: "center",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Teknik Resmi Aç
                    </a>
                  )}
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
      {/* YENİ: Şık Operatör Atama Kutucuğu (Modal) */}
      {operatorModalMachine && (
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
            zIndex: 1100, // Diğer modalın üstünde çıksın diye yüksek verdik
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "25px",
              borderRadius: "12px",
              width: "350px",
              border: "1px solid #475569",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#f8fafc" }}>
              👨‍🔧 {operatorModalMachine.name} - Operatör Seçimi
            </h3>

            <input
              type="text"
              placeholder="Operatörün Adı Soyadı"
              value={tempOperatorName}
              onChange={(e) => setTempOperatorName(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#fff",
                marginBottom: "20px",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setOperatorModalMachine(null)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                İptal
              </button>
              <button
                onClick={handleSaveOperator}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Küçük bir yardımcı fonksiyon (Parça no yazım hatasını önlemek için)
function activePostProcessName(val) {
  return "";
}
