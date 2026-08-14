import { useState, useRef } from "react";

export default function KanbanBoard({ parts, onRefresh }) {
  const fileInputRef = useRef(null);
  const [uploadingPartId, setUploadingPartId] = useState(null);

  const kanbanParts = parts.filter((p) => p.status === "TAMAMLANDI");

  const columns = [
    { id: "TESVIYE", title: "🪚 Tesviye", color: "#f59e0b" },
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

  // YENİ: Kalite Belgesi Yükleme Fonksiyonu
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

      // 2. Yüklenen dosyanın adını ilgili parçaya kaydet (PUT isteği)
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
      e.target.value = null; // Input'u temizle ki aynı dosya tekrar seçilebilsin
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
                  Parça: {part.partNo}
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

                      {/* Eğer daha önceden yüklenmiş bir belge Varsa Görüntüle Butonu Çıksın */}
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
                          Görüntüle 👁️
                        </a>
                      )}

                      {/* Belge Yükleme/Değiştirme Butonu */}
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
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
