import { useState } from "react";
import Swal from "sweetalert2";

export default function PartList({ parts, machines, workPackages, onRefresh }) {
  const [partNo, setPartNo] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [machineId, setMachineId] = useState("");
  const [selectedWpId, setSelectedWpId] = useState("");

  const handleAddPart = async (e) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:8080/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partNo,
          productName,
          quantity: Number(quantity),
          producedQuantity: 0,
          status: "BEKLIYOR",
          postProcess: "TESVIYE",
          machine: { id: Number(machineId) },
          workPackage: { id: Number(selectedWpId) },
        }),
      });
      setPartNo("");
      setProductName("");
      setQuantity("");
      setMachineId("");
      setSelectedWpId("");
      onRefresh();

      // YENİ: Başarı Bildirimi (Toast)
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Parça başarıyla eklendi!",
        showConfirmButton: false,
        timer: 2000,
        background: "#1e293b",
        color: "#fff",
      });
    } catch (error) {
      console.error("Parça eklenirken hata:", error);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Parça eklenirken bir sorun oluştu.",
        background: "#1e293b",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const handleUpdateStatus = async (part, newStatus) => {
    const updatedPart = {
      ...part,
      status: newStatus,
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

      // YENİ: Ufak onay bildirimi
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: "Durum güncellendi!",
        showConfirmButton: false,
        timer: 1500,
        background: "#1e293b",
        color: "#fff",
      });
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      Swal.fire({
        icon: "error",
        title: "Hata!",
        text: "Durum güncellenirken bir sorun oluştu.",
        background: "#1e293b",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const handleDeletePart = async (id) => {
    // YENİ: Şık Parça Silme Onayı
    const result = await Swal.fire({
      title: "Parçayı Sil?",
      text: "Bu parçayı silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      background: "#1e293b",
      color: "#fff",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#475569",
      confirmButtonText: "Evet, Sil!",
      cancelButtonText: "Vazgeç",
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:8080/api/parts/${id}`, {
          method: "DELETE",
        });
        onRefresh();
        Swal.fire({
          icon: "success",
          title: "Silindi!",
          text: "Parça başarıyla silindi.",
          background: "#1e293b",
          color: "#fff",
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (error) {
        console.error("Silme hatası:", error);
      }
    }
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #475569",
    backgroundColor: "#0f172a",
    color: "#fff",
  };

  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #334155",
      }}
    >
      <h2>Parça Üretim ve Kalite Takibi</h2>
      <form
        onSubmit={handleAddPart}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Parça No"
          value={partNo}
          onChange={(e) => setPartNo(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Ürün Adı"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Adet"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          style={inputStyle}
        />

        <select
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="" disabled>
            Makine Seçin
          </option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={selectedWpId}
          onChange={(e) => setSelectedWpId(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="" disabled>
            İş Paketi Seçin
          </option>
          {workPackages.map((wp) => (
            <option key={wp.id} value={wp.id}>
              {/* YENİ: Akıllı Gösterim */}
              {wp.orderNo === wp.packageNo
                ? `Paket: ${wp.packageNo}`
                : `Sipariş: ${wp.orderNo} (Paket: ${wp.packageNo})`}
            </option>
          ))}
        </select>

        <button
          type="submit"
          style={{
            backgroundColor: "#16a34a",
            color: "#fff",
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Parça Ekle
        </button>
      </form>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #475569", color: "#94a3b8" }}>
            <th style={{ padding: "8px" }}>P.No</th>
            <th style={{ padding: "8px" }}>Ürün</th>
            <th style={{ padding: "8px" }}>Makine</th>
            <th style={{ padding: "8px" }}>Adet</th>
            <th style={{ padding: "8px" }}>Durum</th>
            <th style={{ padding: "8px" }}>Kalite Kontrol & İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
              <td style={{ padding: "8px" }}>{p.partNo}</td>
              <td style={{ padding: "8px" }}>{p.productName}</td>
              <td style={{ padding: "8px", color: "#38bdf8" }}>
                {p.machine?.name || "-"}
              </td>
              <td style={{ padding: "8px" }}>{p.quantity}</td>
              <td style={{ padding: "8px" }}>
                <span
                  style={{
                    backgroundColor:
                      p.status === "BEKLIYOR"
                        ? "#854d0e"
                        : p.status === "URETIMDE"
                          ? "#1d4ed8"
                          : "#166534",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {p.status}
                </span>
              </td>
              <td style={{ padding: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {/* KALİTE İSTERLERİ GÖSTERİMİ */}
                  {p.qualityRequirements && (
                    <div style={{ fontSize: "12px", color: "#f59e0b" }}>
                      <strong>İster:</strong> {p.qualityRequirements}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {/* TEKNİK RESMİ AÇ BUTONU */}
                    {p.drawingPath && (
                      <a
                        href={`http://localhost:8080/api/files/${p.drawingPath}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          textDecoration: "none",
                          fontWeight: "bold",
                        }}
                      >
                        📄 Teknik Resim
                      </a>
                    )}

                    {/* ÜRETİME AL BUTONU */}
                    {p.status === "BEKLIYOR" && (
                      <button
                        onClick={() => handleUpdateStatus(p, "URETIMDE")}
                        style={{
                          backgroundColor: "#ca8a04",
                          color: "#000",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        Üretime Al
                      </button>
                    )}

                    {/* ÖLÇÜM TAMAMLANDI / KALİTE ONAY BUTONU */}
                    {p.status === "TAMAMLANDI" && (
                      <button
                        onClick={() => handleUpdateStatus(p, "TESLIM_EDILDI")}
                        style={{
                          backgroundColor: "#10b981",
                          color: "#fff",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        ✅ Onayla / Teslimata Gönder
                      </button>
                    )}

                    <button
                      onClick={() => handleDeletePart(p.id)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
