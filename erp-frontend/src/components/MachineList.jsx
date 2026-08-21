import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

export default function MachineList({ machines, parts = [], onRefresh }) {
  const [machineName, setMachineName] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [activePartInModal, setActivePartInModal] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);

  const [availableOperators, setAvailableOperators] = useState([]);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

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

    Swal.fire({
      icon: "success",
      title: "Makine Eklendi!",
      text: "Yeni makine sisteme başarıyla kaydedildi.",
      background: "#1e293b",
      color: "#fff",
      showConfirmButton: false,
      timer: 1500,
    });

    onRefresh();
  };

  const handleDeleteMachine = async (id) => {
    const result = await Swal.fire({
      title: "Makineyi Sil?",
      text: "Bu makineyi kalıcı olarak silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      background: "#1e293b",
      color: "#fff",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#475569",
      confirmButtonText: "Evet, Sil!",
      cancelButtonText: "İptal",
    });

    if (result.isConfirmed) {
      const res = await fetch(`http://localhost:8080/api/machines/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Silinemedi!",
          text: "Bu makinede işlem gören veya makineye atanmış parçalar var! Önce o parçaları başka makineye aktarın veya silin.",
          background: "#1e293b",
          color: "#fff",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Silindi!",
        text: "Makine başarıyla silindi.",
        background: "#1e293b",
        color: "#fff",
        showConfirmButton: false,
        timer: 1500,
      });

      onRefresh();
    }
  };

  const openMachineModal = (machine, activePart) => {
    setSelectedMachine(machine);
    setActivePartInModal(activePart);
  };

  const handleCompleteProduction = async () => {
    if (!activePartInModal) return;

    const result = await Swal.fire({
      title: "Üretimi Tamamla?",
      text: "Bu parçanın üretimini tamamlamak istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      background: "#1e293b",
      color: "#fff",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#475569",
      confirmButtonText: "Evet, Tamamla!",
      cancelButtonText: "İptal",
    });

    if (!result.isConfirmed) return;

    setIsUploading(true);
    try {
      // 1. MEVCUT İŞİ TAMAMLA VE TESVİYEYE YOLLA
      const updatedPart = {
        ...activePartInModal,
        producedQuantity: activePartInModal.quantity,
        status: "TAMAMLANDI",
        postProcess: "TESVIYE",
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

      // 2. KUYRUKTAKİ SIRADAKİ İŞİ OTOMATİK BAŞLAT
      // Seçili makinenin kuyruğundaki (SIRADA) parçaları bul ve sıraya göre diz
      const nextPartInQueue = parts
        .filter(
          (p) => p.machine?.id === selectedMachine.id && p.status === "SIRADA",
        )
        .sort((a, b) => a.queueOrder - b.queueOrder)[0];

      // Eğer sırada bekleyen bir iş varsa onu hemen URETIMDE yap!
      if (nextPartInQueue) {
        const nextPartUpdated = {
          ...nextPartInQueue,
          status: "URETIMDE",
          queueOrder: null,
        };

        await fetch(`http://localhost:8080/api/parts/${nextPartInQueue.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextPartUpdated),
        });
      }

      setSelectedMachine(null);

      Swal.fire({
        icon: "success",
        title: "Tebrikler!",
        text: nextPartInQueue
          ? "Üretim tamamlandı! Kuyruktaki sıradaki iş otomatik olarak tezgaha alındı."
          : "Üretim başarıyla tamamlandı. Makine şu an boş.",
        background: "#1e293b",
        color: "#fff",
        showConfirmButton: false,
        timer: 2500,
      });

      onRefresh();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Üretim tamamlanırken sistemde bir hata oluştu!",
        background: "#1e293b",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMaintenanceUpdate = async (machine) => {
    const { value: formValues } = await Swal.fire({
      title: `${machine.name} Bakım Ayarları`,
      html: `
        <div style="text-align: left; color: #fff; overflow-x: hidden;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #94a3b8;">Bakım Tarihi</label>
          <input id="swal-m-date" type="date" style="width: 100%; box-sizing: border-box; margin: 0 0 15px 0; padding: 12px; border-radius: 6px; border: 1px solid #475569; background-color: #0f172a; color: #fff; font-size: 14px; outline: none;" value="${machine.maintenanceDate || ""}">
          
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #94a3b8;">Bakım Notu</label>
          <textarea id="swal-m-note" style="width: 100%; box-sizing: border-box; margin: 0; padding: 12px; border-radius: 6px; border: 1px solid #475569; background-color: #0f172a; color: #fff; font-size: 14px; min-height: 90px; resize: none; outline: none;" placeholder="Ustanın notu...">${machine.maintenanceNote || ""}</textarea>
        </div>
      `,
      background: "#1e293b",
      color: "#fff",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#475569",
      confirmButtonText: "Kaydet",
      cancelButtonText: "İptal",
      focusConfirm: false,
      preConfirm: () => {
        return {
          maintenanceDate: document.getElementById("swal-m-date").value,
          maintenanceNote: document.getElementById("swal-m-note").value,
        };
      },
    });

    if (formValues) {
      try {
        // Backend'e hazır olan PUT isteğimizi yolluyoruz
        const res = await fetch(
          `http://localhost:8080/api/machines/${machine.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...machine,
              maintenanceDate: formValues.maintenanceDate,
              maintenanceNote: formValues.maintenanceNote,
            }),
          },
        );

        if (!res.ok) throw new Error("Kayıt Hatası");

        Swal.fire({
          icon: "success",
          title: "Kaydedildi!",
          text: "Makine bakım bilgileri güncellendi.",
          background: "#1e293b",
          color: "#fff",
          showConfirmButton: false,
          timer: 1500,
        });

        onRefresh();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Hata!",
          text: "Bakım kaydedilemedi.",
          background: "#1e293b",
          color: "#fff",
        });
      }
    }
  };
  const handleQueueDragStart = (e, index) => {
    dragItem.current = index;
  };

  const handleQueueDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleQueueDrop = async (e, queuedParts) => {
    e.preventDefault();
    const draggedIndex = dragItem.current;
    const targetIndex = dragOverItem.current;

    if (
      draggedIndex === null ||
      targetIndex === null ||
      draggedIndex === targetIndex
    )
      return;

    // 1. Yeni sırayı kurgula
    const newQueue = [...queuedParts];
    const draggedItem = newQueue[draggedIndex];
    newQueue.splice(draggedIndex, 1);
    newQueue.splice(targetIndex, 0, draggedItem);

    // 2. Yeni sıra numaralarını (queueOrder) ver
    newQueue.forEach((part, index) => {
      part.queueOrder = index + 1;
    });

    // 3. Değişen sırayı Backend'e fırlat (Hepsi aynı anda)
    try {
      await Promise.all(
        newQueue.map((part) =>
          fetch(`http://localhost:8080/api/parts/${part.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(part),
          }),
        ),
      );
      onRefresh(); // ERP'yi güncelle
    } catch (error) {
      console.error("Kuyruk güncellenirken hata:", error);
    }

    dragItem.current = null;
    dragOverItem.current = null;
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
                  alignItems: "center",
                  borderBottom: "1px solid #334155",
                  paddingBottom: "10px",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "18px" }}>
                  {m.name}
                </h3>

                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <button
                    onClick={() => handleMaintenanceUpdate(m)}
                    title={
                      m.maintenanceNote || "Bakım notu eklemek için tıklayın"
                    }
                    style={{
                      background: m.maintenanceDate ? "#f59e0b" : "#475569",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    🔧{" "}
                    {m.maintenanceDate
                      ? `Bakım: ${m.maintenanceDate}`
                      : "Bakım Ekle"}
                  </button>

                  <button
                    onClick={() => handleDeleteMachine(m.id)}
                    style={{
                      background: "transparent",
                      color: "#ef4444",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    Sil ✖
                  </button>
                </div>
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
                  minHeight: "100px",
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
                    {/* YENİ: FİRMA / MÜŞTERİ BİLGİSİ */}
                    {activePart.workPackage?.customer && (
                      <div style={{ color: "#34d399", fontWeight: "bold" }}>
                        🏢 Firma: {activePart.workPackage.customer.companyName}
                      </div>
                    )}
                    <div>
                      <strong>İşlem No:</strong>{" "}
                      {activePart.workPackage?.orderNo ===
                      activePart.workPackage?.packageNo
                        ? activePart.workPackage?.packageNo
                        : `${activePart.workPackage?.orderNo} (Paket: ${activePart.workPackage?.packageNo})`}
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
                  {/* YENİ: OPERATÖR PANELİNDE FİRMA BİLGİSİ */}
                  {activePartInModal.workPackage?.customer && (
                    <p
                      style={{
                        margin: "0 0 10px 0",
                        color: "#34d399",
                        fontWeight: "bold",
                        borderBottom: "1px solid #334155",
                        paddingBottom: "8px",
                      }}
                    >
                      🏢 Firma:{" "}
                      {activePartInModal.workPackage.customer.companyName}
                    </p>
                  )}
                  <p style={{ margin: "0 0 5px 0" }}>
                    <strong>İşlem No:</strong>{" "}
                    {activePartInModal.workPackage?.orderNo ===
                    activePartInModal.workPackage?.packageNo
                      ? activePartInModal.workPackage?.packageNo
                      : `${activePartInModal.workPackage?.orderNo} (Paket: ${activePartInModal.workPackage?.packageNo})`}
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
                  {activePartInModal.qualityRequirements && (
                    <button
                      onClick={() => setShowQualityModal(true)}
                      style={{
                        width: "100%",
                        backgroundColor: "#f59e0b",
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
            {/* --- SIRADAKİ İŞLER (KUYRUK) --- */}
            <div
              style={{
                marginTop: "30px",
                borderTop: "1px solid #334155",
                paddingTop: "20px",
              }}
            >
              <h4 style={{ color: "#38bdf8", marginBottom: "15px", margin: 0 }}>
                Sıradaki İşler (Sürükle & Bırak)
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {parts
                  .filter(
                    (p) =>
                      p.machine?.id === selectedMachine.id &&
                      p.status === "SIRADA",
                  )
                  .sort((a, b) => a.queueOrder - b.queueOrder)
                  .map((queuedPart, index, arr) => (
                    <div
                      key={queuedPart.id}
                      draggable
                      onDragStart={(e) => handleQueueDragStart(e, index)}
                      onDragEnter={(e) => handleQueueDragEnter(e, index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleQueueDrop(e, arr)}
                      style={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #475569",
                        padding: "12px",
                        borderRadius: "8px",
                        cursor: "grab",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "translateX(5px)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "translateX(0)")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#334155",
                            color: "#cbd5e1",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {index + 1}. Sıra
                        </span>
                        <div style={{ color: "#cbd5e1", fontSize: "14px" }}>
                          <strong style={{ color: "#fff" }}>
                            {queuedPart.partNo}
                          </strong>{" "}
                          - {queuedPart.productName}
                        </div>
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                        Adet: {queuedPart.quantity}
                      </div>
                    </div>
                  ))}

                {parts.filter(
                  (p) =>
                    p.machine?.id === selectedMachine.id &&
                    p.status === "SIRADA",
                ).length === 0 && (
                  <p
                    style={{
                      color: "#94a3b8",
                      fontStyle: "italic",
                      fontSize: "13px",
                    }}
                  >
                    Bu makinenin sırasında bekleyen iş yok.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
