import { useState } from "react";

export default function WorkPackageList({
  workPackages,
  parts = [],
  machines = [],
  onRefresh,
}) {
  // --- İŞ PAKETİ (ANA EKRAN) STATE'LERİ ---
  const [packageNo, setPackageNo] = useState("");
  const [qualityNotes, setQualityNotes] = useState("");
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null); // Hangi paketin içine girildi?
  const [deliveryDate, setDeliveryDate] = useState("");

  // --- PARÇA EKLEME (DETAY EKRANI) STATE'LERİ ---
  const [partNo, setPartNo] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [machineId, setMachineId] = useState("");

  // 1. Yeni İş Paketi Ekleme
  const handleAddPackage = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:8080/api/work-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageNo,
        qualityNotes,
        deliveryDate,
        createdAt: new Date().toISOString(),
      }),
    });
    setPackageNo("");
    setQualityNotes("");
    setDeliveryDate("");
    setShowPackageForm(false);
    onRefresh();
  };

  // 2. İş Paketi Silme
  const handleDeletePackage = async (id) => {
    if (window.confirm("Bu iş paketini silmek istediğinize emin misiniz?")) {
      const res = await fetch(`http://localhost:8080/api/work-packages/${id}`, {
        method: "DELETE",
      });

      // YENİ: Arka uç silmeyi reddederse (içinde parça varsa) uyarı ver
      if (!res.ok) {
        alert(
          "⚠️ UYARI: Bu iş paketine kayıtlı parçalar var! Paketi silebilmek için önce içindeki parçaları silmelisiniz.",
        );
        return;
      }

      if (selectedPackage && selectedPackage.id === id)
        setSelectedPackage(null);
      onRefresh();
    }
  };

  // YENİ: Kalan gün hesaplayıcı ve akıllı rozet (Badge) üretici
  const renderDeadlineBadge = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    const delivery = new Date(dateStr);
    const diffTime = delivery - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days < 0)
      return (
        <span
          style={{
            backgroundColor: "#ef4444",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Gecikti ({Math.abs(days)} Gün)
        </span>
      );
    if (days <= 3)
      return (
        <span
          style={{
            backgroundColor: "#f59e0b",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Son {days} Gün! ⚠️
        </span>
      );
    return (
      <span
        style={{
          backgroundColor: "#10b981",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {days} Gün Kaldı 🗓️
      </span>
    );
  };

  // 3. Paketin İçine Parça Ekleme (Yeni Özellik)
  const handleAddPartInsidePackage = async (e) => {
    e.preventDefault();
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
        workPackage: { id: selectedPackage.id }, // Otomatik olarak içine girdiğimiz pakete atanır
      }),
    });
    setPartNo("");
    setProductName("");
    setQuantity("");
    setMachineId("");
    onRefresh();
  };

  // 4. Parça Silme (Detay Ekranından)
  const handleDeletePart = async (id) => {
    if (window.confirm("Bu parçayı silmek istediğinize emin misiniz?")) {
      await fetch(`http://localhost:8080/api/parts/${id}`, {
        method: "DELETE",
      });
      onRefresh();
    }
  };
  // 6. Üretime Alma ve Dolu Makine Kontrolü
  const handleStartProduction = async (part) => {
    // YENİ MANTIK: Bu parçanın atanacağı makinede şu an 'URETIMDE' olan başka parça var mı?
    const isMachineBusy = parts.some(
      (p) => p.machine?.id === part.machine?.id && p.status === "URETIMDE",
    );

    if (isMachineBusy) {
      alert(
        `⚠️ HATA: Seçilen makine şu anda başka bir parça üretiyor! Lütfen önce o üretimi bitirin.`,
      );
      return;
    }

    // Makine boşsa parçayı üretime al
    const updatedPart = { ...part, status: "URETIMDE" };

    await fetch(`http://localhost:8080/api/parts/${part.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPart),
    });

    onRefresh();
  };

  // 5. Akıllı Süreç Belirteci (Badge) Oluşturucu
  const getProcessBadge = (part) => {
    if (part.status === "BEKLIYOR")
      return (
        <span
          style={{
            backgroundColor: "#854d0e",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Sırada Bekliyor
        </span>
      );
    if (part.status === "URETIMDE")
      return (
        <span
          style={{
            backgroundColor: "#1d4ed8",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Makinede Üretiliyor
        </span>
      );

    // Eğer üretimi bittiyse Kanban aşamasına bak:
    if (part.status === "TAMAMLANDI") {
      switch (part.postProcess) {
        case "TESVIYE":
          return (
            <span
              style={{
                backgroundColor: "#f59e0b",
                color: "#000",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              🪚 Tesviyede
            </span>
          );
        case "KALITE_KONTROL":
          return (
            <span
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              🔎 Kalite Onayında
            </span>
          );
        case "TESLIMAT_BEKLIYOR":
          return (
            <span
              style={{
                backgroundColor: "#8b5cf6",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              📦 Teslimat Bekliyor
            </span>
          );
        case "TESLIM_EDILDI":
          return (
            <span
              style={{
                backgroundColor: "#10b981",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              ✅ Teslim Edildi
            </span>
          );
        default:
          return (
            <span
              style={{
                backgroundColor: "#64748b",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              Aşama Belirsiz
            </span>
          );
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

  // ==========================================
  // GÖRÜNÜM 2: DETAY EKRANI (İş Paketinin İçi)
  // ==========================================
  if (selectedPackage) {
    const packageParts = parts.filter(
      (p) => p.workPackage?.id === selectedPackage.id,
    );

    return (
      <div
        style={{
          backgroundColor: "#1e293b",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #334155",
        }}
      >
        {/* Üst Bilgi ve Geri Dön Butonu */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            borderBottom: "1px solid #334155",
            paddingBottom: "15px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setSelectedPackage(null)}
            style={{
              backgroundColor: "#334155",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ⬅ Geri Dön
          </button>
          <h2 style={{ margin: 0, color: "#38bdf8" }}>
            Paket Yönetimi: {selectedPackage.packageNo}
          </h2>
        </div>

        {/* Paketin İçine Parça Ekleme Formu */}
        <div
          style={{
            backgroundColor: "#0f172a",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #475569",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#94a3b8", fontSize: "16px" }}>
            Bu Pakete Yeni Parça Ekle
          </h3>
          <form
            onSubmit={handleAddPartInsidePackage}
            style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
          >
            <input
              type="text"
              placeholder="Parça No"
              value={partNo}
              onChange={(e) => setPartNo(e.target.value)}
              required
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="Ürün Adı"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="number"
              placeholder="Adet"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              style={{ ...inputStyle, width: "100px" }}
            />
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              required
              style={{ ...inputStyle, flex: 1 }}
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
            <button
              type="submit"
              style={{
                backgroundColor: "#16a34a",
                color: "#fff",
                padding: "10px 15px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Ekle
            </button>
          </form>
        </div>

        {/* Bu Pakete Ait Parçaların Listesi ve Belirteçler */}
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
              <th style={{ padding: "10px" }}>Parça No</th>
              <th style={{ padding: "10px" }}>Ürün Adı</th>
              <th style={{ padding: "10px" }}>Üretim (Hedef)</th>
              <th style={{ padding: "10px" }}>Güncel Aşama</th>
              <th style={{ padding: "10px", textAlign: "right" }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {packageParts.length > 0 ? (
              packageParts.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td
                    style={{
                      padding: "10px",
                      color: "#f8fafc",
                      fontWeight: "bold",
                    }}
                  >
                    {p.partNo}
                  </td>
                  <td style={{ padding: "10px", color: "#cbd5e1" }}>
                    {p.productName}
                  </td>
                  <td style={{ padding: "10px", color: "#cbd5e1" }}>
                    {p.producedQuantity} / {p.quantity}
                  </td>
                  <td style={{ padding: "10px" }}>{getProcessBadge(p)}</td>
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      display: "flex",
                      gap: "5px",
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* Sadece BEKLIYOR statüsündekiler üretime alınabilir */}
                    {p.status === "BEKLIYOR" && (
                      <button
                        onClick={() => handleStartProduction(p)}
                        style={{
                          backgroundColor: "#ca8a04",
                          color: "#fff",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Üretime Al ⚙️
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePart(p.id)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Bu pakette henüz hiç parça yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // ==========================================
  // GÖRÜNÜM 1: ANA EKRAN (Patronun İstediği Sade Liste)
  // ==========================================
  return (
    <div style={{ paddingBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h2 style={{ margin: 0, color: "#f8fafc" }}>Kayıtlı İş Paketleri</h2>
        <button
          onClick={() => setShowPackageForm(!showPackageForm)}
          style={{
            backgroundColor: "#10b981",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {showPackageForm ? "İptal" : "+ Yeni Paket Oluştur"}
        </button>
      </div>

      {showPackageForm && (
        <form
          onSubmit={handleAddPackage}
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
            placeholder="İş Paketi Numarası"
            value={packageNo}
            onChange={(e) => setPackageNo(e.target.value)}
            required
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            type="text"
            placeholder="Notlar"
            value={qualityNotes}
            onChange={(e) => setQualityNotes(e.target.value)}
            style={{ ...inputStyle, flex: 2 }}
          />
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            style={{ ...inputStyle, width: "150px" }}
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

      {/* Patronun istediği SADE iş paketi görünümü */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {workPackages.map((wp) => {
          const packagePartsCount = parts.filter(
            (p) => p.workPackage?.id === wp.id,
          ).length;

          return (
            <div
              key={wp.id}
              style={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 5px 0",
                    color: "#38bdf8",
                    fontSize: "18px",
                  }}
                >
                  📦 {wp.packageNo}
                </h3>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  İçerik: {packagePartsCount} Parça
                </span>
                {renderDeadlineBadge(wp.deliveryDate)}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setSelectedPackage(wp)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  İçine Gir / Yönet ➔
                </button>
                <button
                  onClick={() => handleDeletePackage(wp.id)}
                  style={{
                    padding: "10px",
                    backgroundColor: "transparent",
                    color: "#ef4444",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ✖
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
