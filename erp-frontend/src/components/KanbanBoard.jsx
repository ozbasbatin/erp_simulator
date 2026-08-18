import { useState, useRef } from "react";

export default function KanbanBoard({ parts, onRefresh }) {
  const fileInputRef = useRef(null);
  const [uploadingPartId, setUploadingPartId] = useState(null);

  const [qualityModalPart, setQualityModalPart] = useState(null);

  const kanbanParts = parts.filter((p) => p.status === "TAMAMLANDI");

  const columns = [
    { id: "TESVIYE", title: "🪚 Tesviye", color: "#f59e0b" },
    { id: "KAPLAMA", title: "🎨 Kaplama / Boya", color: "#d946ef" },
    { id: "KALITE_KONTROL", title: "🔎 Kalite Onayı", color: "#3b82f6" },
    {
      id: "TESLIMAT_BEKLIYOR",
      title: "📦 Teslimat Bekliyor",
      color: "#8b5cf6",
    },
    { id: "TESLIM_EDILDI", title: "✅ Teslim Edildi", color: "#10b981" },
  ];

  const handleDragStart = (e, partId) => {
    e.dataTransfer.setData("partId", partId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetProcess) => {
    e.preventDefault();
    const partId = e.dataTransfer.getData("partId");
    const part = kanbanParts.find((p) => p.id.toString() === partId);

    if (!part || part.postProcess === targetProcess) return;

    // 🛑 1. GÜVENLİK KİLİDİ: Kaplaması olmayan parçayı kaplamaya sokma
    if (targetProcess === "KAPLAMA" && !part.hasCoating) {
      alert(
        "⚠️ Bu parçanın siparişinde Kaplama/Boya işlemi bulunmuyor! Doğrudan Kalite Onayına sürükleyebilirsiniz.",
      );
      return;
    }

    // 🛑 2. GÜVENLİK KİLİDİ (YENİ): Kaliteden sürükleyerek çıkarmayı engelle!
    if (
      part.postProcess === "KALITE_KONTROL" &&
      targetProcess === "TESLIMAT_BEKLIYOR"
    ) {
      alert(
        "⚠️ DİKKAT: Kalite onayı sürükleyerek yapılamaz! Lütfen '📝 Kaliteyi İncele' butonuna tıklayarak ölçüm sonuçlarını onaylayın.",
      );
      return;
    }

    const updatedPart = {
      ...part,
      postProcess: targetProcess,
      machine: part.machine ? { id: part.machine.id } : null,
      workPackage: part.workPackage ? { id: part.workPackage.id } : null,
      operator: part.operator ? { id: part.operator.id } : null,
    };

    try {
      await fetch(`http://localhost:8080/api/parts/${part.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPart),
      });
      onRefresh();
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
    }
  };

  const handleFileUpload = async (e, part) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPartId(part.id);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("http://localhost:8080/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Yükleme başarısız!");

      const uploadData = await uploadRes.json();

      const updatedPart = {
        ...part,
        qualityDocPath: uploadData.fileName,
        machine: part.machine ? { id: part.machine.id } : null,
        workPackage: part.workPackage ? { id: part.workPackage.id } : null,
        operator: part.operator ? { id: part.operator.id } : null,
      };

      await fetch(`http://localhost:8080/api/parts/${part.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPart),
      });

      alert(
        `${part.partNo} numaralı parça için Kalite Belgesi başarıyla sisteme yüklendi!\nDosya Adı: ${uploadData.fileName} ✅`,
      );
      onRefresh();
    } catch (error) {
      console.error("Dosya yükleme hatası:", error);
      alert("Belge yüklenirken bir hata oluştu.");
    } finally {
      setUploadingPartId(null);
      e.target.value = null;
    }
  };

  // YENİ: Kalite Panelinden Ölçümü Onaylama ve Teslimata Gönderme
  const handleQualityApprove = async () => {
    if (!qualityModalPart) return;

    const updatedPart = {
      ...qualityModalPart,
      postProcess: "TESLIMAT_BEKLIYOR", // Onaylanınca otomatik buraya uçar
      machine: qualityModalPart.machine
        ? { id: qualityModalPart.machine.id }
        : null,
      workPackage: qualityModalPart.workPackage
        ? { id: qualityModalPart.workPackage.id }
        : null,
      operator: qualityModalPart.operator
        ? { id: qualityModalPart.operator.id }
        : null,
    };

    try {
      await fetch(`http://localhost:8080/api/parts/${qualityModalPart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPart),
      });
      setQualityModalPart(null); // Modalı kapat
      onRefresh(); // Panoyu yenile
    } catch (error) {
      console.error("Kalite onayı sırasında hata:", error);
      alert("Onaylama sırasında bir hata oluştu!");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        overflowX: "auto",
        paddingBottom: "20px",
      }}
    >
      {columns.map((col) => (
        <div
          key={col.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          style={{
            flex: 1,
            minWidth: "300px",
            backgroundColor: "#1e293b",
            borderRadius: "12px",
            borderTop: `4px solid ${col.color}`,
            padding: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
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
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>
              {col.title}
            </h3>
            <span
              style={{
                backgroundColor: "#0f172a",
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                color: col.color,
                fontWeight: "bold",
              }}
            >
              {kanbanParts.filter((p) => p.postProcess === col.id).length}
            </span>
          </div>

          {kanbanParts
            .filter((p) => p.postProcess === col.id)
            .map((part) => (
              <div
                key={part.id}
                draggable
                onDragStart={(e) => handleDragStart(e, part.id)}
                style={{
                  backgroundColor: "#0f172a",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  cursor: "grab",
                  transition: "transform 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-3px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "5px",
                  }}
                >
                  Paket: {part.workPackage?.packageNo}
                </div>
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#38bdf8",
                    marginBottom: "5px",
                  }}
                >
                  Parça: {part.partNo}{" "}
                  {part.hasCoating && (
                    <span style={{ fontSize: "12px", color: "#d946ef" }}>
                      (🎨)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#cbd5e1" }}>
                  Ürün: {part.productName}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "15px",
                    paddingTop: "10px",
                    borderTop: "1px solid #1e293b",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Adet:{" "}
                    <strong style={{ color: "#fff" }}>
                      {part.producedQuantity}/{part.quantity}
                    </strong>
                  </span>

                  {col.id === "KALITE_KONTROL" && (
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        gap: "5px",
                      }}
                    >
                      <input
                        type="file"
                        id={`file-${part.id}`}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, part)}
                      />

                      {part.qualityDocPath && (
                        <a
                          href={`http://localhost:8080/api/files/${part.qualityDocPath}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            backgroundColor: "#10b981",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          Belge 👁️
                        </a>
                      )}

                      <button
                        onClick={() =>
                          document.getElementById(`file-${part.id}`).click()
                        }
                        disabled={uploadingPartId === part.id}
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          cursor:
                            uploadingPartId === part.id ? "wait" : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {uploadingPartId === part.id
                          ? "Yükleniyor..."
                          : part.qualityDocPath
                            ? "Değiştir 📎"
                            : "Belge Yükle 📎"}
                      </button>
                    </div>
                  )}
                </div>

                {/* YENİ: Kaliteyi İncele Butonu SADECE Kalite kolonundayken çıksın */}
                {col.id === "KALITE_KONTROL" && (
                  <button
                    onClick={() => setQualityModalPart(part)}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      backgroundColor: "#f59e0b", // Dikkat çekici turuncu/kehribar
                      color: "#fff",
                      border: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "13px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    📝 Kaliteyi İncele ve Onayla
                  </button>
                )}
              </div>
            ))}
        </div>
      ))}

      {/* YENİ: KALİTE ONAY PENCERESİ (MODAL) */}
      {qualityModalPart && (
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
            zIndex: 1500,
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
              🔎 Kalite Kontrol ve Ölçüm Onayı
            </h3>

            <div
              style={{
                backgroundColor: "#0f172a",
                padding: "15px",
                borderRadius: "8px",
                color: "#cbd5e1",
                marginBottom: "15px",
                border: "1px solid #475569",
              }}
            >
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Parça No:</strong> {qualityModalPart.partNo}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Ürün:</strong> {qualityModalPart.productName}
              </p>
            </div>

            {qualityModalPart.qualityRequirements ? (
              <div
                style={{
                  backgroundColor: "#334155",
                  padding: "15px",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  marginBottom: "15px",
                  whiteSpace: "pre-wrap",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                <strong style={{ color: "#f59e0b" }}>
                  📝 Planlamacı Notları / İsterler:
                </strong>
                <br />
                <br />
                {qualityModalPart.qualityRequirements}
              </div>
            ) : (
              <div
                style={{
                  color: "#94a3b8",
                  fontStyle: "italic",
                  marginBottom: "15px",
                }}
              >
                Bu parça için özel bir kalite isteri girilmemiş.
              </div>
            )}

            <div
              style={{ display: "flex", gap: "10px", flexDirection: "column" }}
            >
              {/* Teknik Resmi Aç Butonu */}
              {qualityModalPart.drawingPath && (
                <a
                  href={`http://localhost:8080/api/files/${qualityModalPart.drawingPath}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: "#475569",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "6px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: "bold",
                    border: "1px solid #64748b",
                  }}
                >
                  📄 Teknik Resmi Aç ve Ölçüleri Gör
                </a>
              )}

              {/* Onay Butonu */}
              <button
                onClick={handleQualityApprove}
                style={{
                  backgroundColor: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "15px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "16px",
                  marginTop: "10px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                }}
              >
                ✅ Ölçüm Tamamlandı (Teslimata Gönder)
              </button>
            </div>

            <button
              onClick={() => setQualityModalPart(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                width: "100%",
                marginTop: "15px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              İptal Et ve Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
