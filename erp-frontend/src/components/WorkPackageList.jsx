import { useState, useEffect } from "react";

export default function WorkPackageList({
  workPackages = [],
  parts = [],
  machines = [],
  onRefresh,
  user, // APP.JSX'TEN GELECEK
}) {
  const safePackages = Array.isArray(workPackages) ? workPackages : [];
  const safeParts = Array.isArray(parts) ? parts : [];
  const safeMachines = Array.isArray(machines) ? machines : [];

  const [packageNo, setPackageNo] = useState("");
  const [qualityNotes, setQualityNotes] = useState("");
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [availableCustomers, setAvailableCustomers] = useState([]);

  const [partNo, setPartNo] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rawMaterial, setRawMaterial] = useState("");
  const [hasCoating, setHasCoating] = useState(false);
  const [qualityRequirements, setQualityRequirements] = useState("");
  const [showQualityModal, setShowQualityModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingPart, setIsUploadingPart] = useState(false);

  const [productionModalPart, setProductionModalPart] = useState(null);
  const [selectedMachineForProduction, setSelectedMachineForProduction] =
    useState("");
  const [selectedOperatorForProduction, setSelectedOperatorForProduction] =
    useState("");
  const [availableOperators, setAvailableOperators] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const opRes = await fetch("http://localhost:8080/api/users/staff");
        if (opRes.ok) {
          const opData = await opRes.json();
          setAvailableOperators(opData.filter((u) => u.role === "OPERATOR"));
        }
        const custRes = await fetch("http://localhost:8080/api/customers");
        if (custRes.ok) {
          const custData = await custRes.json();
          setAvailableCustomers(custData);
        }
      } catch (error) {
        console.error("Listeler çekilemedi:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const handleAddPackage = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Lütfen bir müşteri seçiniz!");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/work-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageNo,
          qualityNotes,
          deliveryDate,
          orderDate,
          createdAt: new Date().toISOString(),
          customer: { id: Number(selectedCustomerId) },
        }),
      });

      // EĞER BACKEND HATA VERİRSE (Örn: Aynı numara varsa) YAKALA
      if (!res.ok) {
        alert(
          "⚠️ Hata: Bu İş Paketi Numarası (Package No) zaten kullanımda! Lütfen farklı bir numara giriniz.",
        );
        return;
      }

      setPackageNo("");
      setQualityNotes("");
      setDeliveryDate("");
      setOrderDate("");
      setSelectedCustomerId("");
      setShowPackageForm(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Paket eklenirken hata:", error);
    }
  };

  const handleCancelPackage = async (id) => {
    if (
      window.confirm(
        "Bu iş paketini İPTAL ETMEK istediğinize emin misiniz? (Geçmişte görünmeye devam eder)",
      )
    ) {
      const res = await fetch(`http://localhost:8080/api/work-packages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert(
          "⚠️ UYARI: Bu iş paketine kayıtlı parçalar var! Paketi iptal edebilmek için önce içindeki parçaları silmelisiniz.",
        );
        return;
      }
      if (selectedPackage && selectedPackage.id === id)
        setSelectedPackage(null);
      if (onRefresh) onRefresh();
    }
  };

  const renderDeadlineBadge = (dateStr) => {
    if (!dateStr) return null;
    const diffTime = new Date(dateStr) - new Date();
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

  const handlePrintWorkOrder = (pkg) => {
    const pkgParts = safeParts.filter((p) => p.workPackage?.id === pkg.id);

    // 1. Tarayıcının ana başlığını geçici olarak dosya adı yapıyoruz
    const originalTitle = document.title;
    document.title = `Is_Emri_${pkg.packageNo}`;

    // 2. Gizli iframe oluşturma
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write("<html><head><title>İş Emri - " + pkg.packageNo + "</title>");
    doc.write(`
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e293b; padding-bottom: 10px; margin-bottom: 20px; }
        h1 { margin: 0; color: #1e293b; font-size: 24px; }
        .info-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-box p { margin: 5px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
        th { background-color: #f1f5f9; color: #1e293b; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .sign-box { text-align: center; }
      </style>
    `);
    doc.write("</head><body>");

    // Başlık
    doc.write(`
      <div class="header">
        <h1>NEXOM ERP - ÜRETİM İŞ EMRİ</h1>
        <h2>Paket No: ${pkg.packageNo}</h2>
      </div>
    `);

    // Bilgiler
    doc.write(`
      <div class="info-box">
        <p><strong>Firma / Müşteri:</strong> ${pkg.customer?.companyName || "Bilinmiyor"}</p>
        <p><strong>Sipariş Tarihi:</strong> ${pkg.orderDate} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Hedef Teslimat:</strong> ${pkg.deliveryDate}</p>
        <p><strong>Planlamacı Notları:</strong> ${pkg.qualityNotes || "Yok"}</p>
      </div>
    `);

    // Tablo
    doc.write(`
      <table>
        <thead>
          <tr>
            <th>Parça No</th>
            <th>Ürün Adı</th>
            <th>Üretim Adedi</th>
            <th>Hammadde</th>
            <th>Boya/Kaplama</th>
          </tr>
        </thead>
        <tbody>
    `);

    if (pkgParts.length === 0) {
      doc.write(
        '<tr><td colspan="5" style="text-align:center;">Bu iş emrine henüz parça eklenmemiş.</td></tr>',
      );
    } else {
      pkgParts.forEach((p) => {
        doc.write(`
          <tr>
            <td><strong>${p.partNo}</strong></td>
            <td>${p.productName}</td>
            <td>${p.quantity} Adet</td>
            <td>${p.rawMaterial}</td>
            <td>${p.hasCoating ? "Yapılacak" : "Yok"}</td>
          </tr>
        `);
      });
    }

    doc.write("</tbody></table>");

    // İmza
    doc.write(`
      <div class="footer">
        <div class="sign-box"><p><strong>Planlama Onayı</strong></p><p>___________________</p></div>
        <div class="sign-box"><p><strong>Üretim Sorumlusu</strong></p><p>___________________</p></div>
      </div>
    `);

    doc.write("</body></html>");
    doc.close();

    // Yazdırma penceresi
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Temizlik ve başlığı eski haline getirme
      document.body.removeChild(iframe);
      document.title = originalTitle;
    }, 300);
  };

  const handleAddPartInsidePackage = async (e) => {
    e.preventDefault();
    if (quantity < 1) {
      alert("Hata: Üretim adedi 1'den küçük olamaz!");
      return;
    }
    setIsUploadingPart(true);
    let uploadedFileName = null;
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch(
          "http://localhost:8080/api/files/upload",
          { method: "POST", body: formData },
        );
        if (!uploadRes.ok) throw new Error("Dosya yükleme başarısız!");
        const uploadData = await uploadRes.json();
        uploadedFileName = uploadData.fileName;
      }
      await fetch("http://localhost:8080/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partNo,
          productName,
          quantity: Number(quantity),
          producedQuantity: 0,
          rawMaterial,
          hasCoating,
          qualityRequirements,
          drawingPath: uploadedFileName,
          status: "HAMMADDE_BEKLIYOR",
          postProcess: "TESVIYE",
          machine: null,
          workPackage: { id: selectedPackage.id },
        }),
      });
      setPartNo("");
      setProductName("");
      setQuantity("");
      setRawMaterial("");
      setQualityRequirements("");
      setHasCoating(false);
      setSelectedFile(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Parça eklenirken hata:", error);
      alert("Kayıt sırasında bir hata oluştu!");
    } finally {
      setIsUploadingPart(false);
    }
  };

  const handleDeletePart = async (id) => {
    if (window.confirm("Bu parçayı silmek istediğinize emin misiniz?")) {
      await fetch(`http://localhost:8080/api/parts/${id}`, {
        method: "DELETE",
      });
      if (onRefresh) onRefresh();
    }
  };

  const handleHammaddeGeldi = async (part) => {
    const updatedPart = { ...part, status: "BEKLIYOR" };
    await fetch(`http://localhost:8080/api/parts/${part.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPart),
    });
    if (onRefresh) onRefresh();
  };

  const handleConfirmProduction = async () => {
    if (!selectedMachineForProduction) {
      alert("Lütfen üretime başlamak için bir tezgah seçin!");
      return;
    }
    if (!selectedOperatorForProduction) {
      alert("Lütfen bu işlemi yapacak operatörü seçin!");
      return;
    }
    const isMachineBusy = safeParts.some(
      (p) =>
        p.machine?.id === Number(selectedMachineForProduction) &&
        p.status === "URETIMDE",
    );
    if (isMachineBusy) {
      alert(
        "⚠️ HATA: Seçilen makine şu anda dolu! Lütfen boş bir makine seçin.",
      );
      return;
    }

    const updatedPart = {
      ...productionModalPart,
      status: "URETIMDE",
      machine: { id: Number(selectedMachineForProduction) },
      operator: { id: Number(selectedOperatorForProduction) },
    };
    await fetch(`http://localhost:8080/api/parts/${productionModalPart.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPart),
    });
    setProductionModalPart(null);
    setSelectedMachineForProduction("");
    setSelectedOperatorForProduction("");
    if (onRefresh) onRefresh();
  };

  const getProcessBadge = (part) => {
    if (part.status === "HAMMADDE_BEKLIYOR")
      return (
        <span
          style={{
            backgroundColor: "#94a3b8",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          🧱 Hammadde Bekliyor
        </span>
      );
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
        case "KAPLAMA":
          return (
            <span
              style={{
                backgroundColor: "#d946ef",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              🎨 Kaplama/Boyada
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
    boxSizing: "border-box",
  };

  return (
    <div style={{ paddingBottom: "20px" }}>
      {selectedPackage ? (
        <div
          style={{
            backgroundColor: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
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
            <button
              onClick={() => handlePrintWorkOrder(selectedPackage)}
              style={{
                backgroundColor: "#f59e0b",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                marginLeft: "15px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              📄 İş Emrini PDF Olarak Al
            </button>
            <h2 style={{ margin: 0, color: "#38bdf8" }}>
              Paket Yönetimi: {selectedPackage.packageNo}
            </h2>
            {selectedPackage.customer && (
              <span
                style={{
                  backgroundColor: "#0f172a",
                  color: "#10b981",
                  padding: "6px 12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  border: "1px solid #10b981",
                  marginLeft: "auto",
                }}
              >
                👤 Firma: {selectedPackage.customer.companyName}
              </span>
            )}
          </div>
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
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Parça No"
                value={partNo}
                onChange={(e) => setPartNo(e.target.value)}
                required
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              />
              <input
                type="text"
                placeholder="Ürün Adı"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              />
              <input
                type="number"
                min="1"
                placeholder="Adet"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={{ ...inputStyle, width: "90px" }}
              />
              <input
                type="text"
                placeholder="Hammadde (Örn: C45)"
                value={rawMaterial}
                onChange={(e) => setRawMaterial(e.target.value)}
                required
                style={{ ...inputStyle, flex: 1, minWidth: "150px" }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#1e293b",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #475569",
                }}
              >
                <input
                  type="checkbox"
                  id="coatingCheck"
                  checked={hasCoating}
                  onChange={(e) => setHasCoating(e.target.checked)}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
                <label
                  htmlFor="coatingCheck"
                  style={{
                    color: "#cbd5e1",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Boya/Kaplama
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowQualityModal(true)}
                style={{
                  backgroundColor: qualityRequirements ? "#0284c7" : "#475569",
                  color: "white",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  flex: 2,
                  minWidth: "180px",
                  fontWeight: "bold",
                }}
              >
                {qualityRequirements
                  ? "📝 İsterler Girildi"
                  : "📝 Kalite İsteri Ekle"}
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#1e293b",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px dashed #475569",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                  Teknik Resim:
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ color: "#cbd5e1", fontSize: "12px", width: "190px" }}
                />
              </div>
              <button
                type="submit"
                disabled={isUploadingPart}
                style={{
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: isUploadingPart ? "wait" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {isUploadingPart ? "Ekleniyor..." : "+ Ekle"}
              </button>
            </form>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{ borderBottom: "2px solid #475569", color: "#94a3b8" }}
              >
                <th style={{ padding: "10px" }}>Parça No</th>
                <th style={{ padding: "10px" }}>Ürün Adı</th>
                <th style={{ padding: "10px" }}>Üretim</th>
                <th style={{ padding: "10px" }}>Güncel Aşama</th>
                <th style={{ padding: "10px", textAlign: "right" }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {safeParts.filter((p) => p.workPackage?.id === selectedPackage.id)
                .length > 0 ? (
                safeParts
                  .filter((p) => p.workPackage?.id === selectedPackage.id)
                  .map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid #334155" }}
                    >
                      <td
                        style={{
                          padding: "10px",
                          color: "#f8fafc",
                          fontWeight: "bold",
                        }}
                      >
                        {p.partNo}
                        {p.hasCoating && (
                          <span style={{ fontSize: "10px", color: "#d946ef" }}>
                            {" "}
                            (🎨)
                          </span>
                        )}
                        {p.drawingPath && (
                          <a
                            href={`http://localhost:8080/api/files/${p.drawingPath}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              marginLeft: "8px",
                              fontSize: "16px",
                              textDecoration: "none",
                            }}
                            title="Teknik Resmi Aç"
                          >
                            📄
                          </a>
                        )}
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
                        {p.status === "HAMMADDE_BEKLIYOR" && (
                          <button
                            onClick={() => handleHammaddeGeldi(p)}
                            style={{
                              backgroundColor: "#8b5cf6",
                              color: "#fff",
                              border: "none",
                              padding: "6px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Hammadde Geldi 📦
                          </button>
                        )}
                        {p.status === "BEKLIYOR" && (
                          <button
                            onClick={() => setProductionModalPart(p)}
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

                        {/* SADECE ADMİN PARÇA SİLEBİLİR */}
                        {user?.role === "ADMIN" && (
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
                        )}
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
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >
            <h2 style={{ margin: 0, color: "#f8fafc" }}>
              Kayıtlı İş Paketleri
            </h2>
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
                flexWrap: "wrap",
                gap: "15px",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1, minWidth: "150px" }}>
                <input
                  type="text"
                  placeholder="İş Paketi No"
                  value={packageNo}
                  onChange={(e) => setPackageNo(e.target.value)}
                  required
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
                >
                  <option value="" disabled>
                    Firma/Müşteri Seçin
                  </option>
                  {availableCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 2, minWidth: "200px" }}>
                <input
                  type="text"
                  placeholder="Notlar"
                  value={qualityNotes}
                  onChange={(e) => setQualityNotes(e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginLeft: "2px",
                  }}
                >
                  Sipariş Tarihi
                </span>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginLeft: "2px",
                  }}
                >
                  Teslim Tarihi
                </span>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: "#0284c7",
                  color: "#fff",
                  padding: "10px 20px",
                  height: "40px",
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
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {safePackages
                .filter((wp) => {
                  // 1. İptal edildiyse gizle
                  if (wp.isCancelled || wp.cancelled) return false;

                  // 2. Parçaların hepsi teslim edildiyse (Tamamlandıysa) otomatik gizle
                  const wpParts = safeParts.filter(
                    (p) => p.workPackage?.id === wp.id,
                  );
                  const isFullyDelivered =
                    wpParts.length > 0 &&
                    wpParts.every(
                      (p) =>
                        p.status === "TAMAMLANDI" &&
                        p.postProcess === "TESLIM_EDILDI",
                    );

                  return !isFullyDelivered; // Sadece tamamlanMAMIŞ olanları ekranda bırak
                })
                .map((wp) => {
                  const packagePartsCount = safeParts.filter(
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
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#94a3b8",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          İçerik: {packagePartsCount} Parça
                        </span>
                        {wp.customer && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#10b981",
                              display: "block",
                              marginBottom: "5px",
                              fontWeight: "bold",
                            }}
                          >
                            👤 {wp.customer.companyName}
                          </span>
                        )}
                        {wp.qualityNotes && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#cbd5e1",
                              fontStyle: "italic",
                              display: "block",
                              marginBottom: "8px",
                              borderLeft: "2px solid #3b82f6",
                              paddingLeft: "5px",
                            }}
                          >
                            📝 {wp.qualityNotes}
                          </span>
                        )}
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

                        {/* SADECE ADMİN İPTAL EDEBİLİR */}
                        {user?.role === "ADMIN" && (
                          <button
                            onClick={() => handleCancelPackage(wp.id)}
                            style={{
                              padding: "10px",
                              backgroundColor: "transparent",
                              color: "#f59e0b",
                              border: "1px solid #f59e0b",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            İptal Et 🚫
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* YENİLENEN ÜRETİME BAŞLAMA MODALI */}
      {productionModalPart && (
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
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "25px",
              borderRadius: "12px",
              width: "400px",
              border: "1px solid #475569",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                color: "#ca8a04",
                borderBottom: "1px solid #334155",
                paddingBottom: "10px",
              }}
            >
              ⚙️ Üretime Başla
            </h3>
            <div
              style={{
                color: "#cbd5e1",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              <p style={{ margin: "5px 0" }}>
                <strong>Parça No:</strong> {productionModalPart.partNo}{" "}
                {productionModalPart.hasCoating && (
                  <span style={{ color: "#d946ef" }}>
                    (Boya/Kaplama Var 🎨)
                  </span>
                )}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Ürün:</strong> {productionModalPart.productName}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Hammadde:</strong>{" "}
                <span style={{ color: "#10b981" }}>
                  {productionModalPart.rawMaterial}
                </span>
              </p>
            </div>

            <label
              style={{
                display: "block",
                color: "#94a3b8",
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              Bu parça için tezgah ataması yapın:
            </label>
            <select
              value={selectedMachineForProduction}
              onChange={(e) => setSelectedMachineForProduction(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#fff",
                marginBottom: "15px",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>
                Tezgah Seçin
              </option>
              {safeMachines.map((m) => {
                const isBusy = safeParts.some(
                  (p) => p.machine?.id === m.id && p.status === "URETIMDE",
                );
                return (
                  <option key={m.id} value={m.id} disabled={isBusy}>
                    {m.name} {isBusy ? " 🔴 (Şu an Dolu)" : " 🟢 (Boş)"}
                  </option>
                );
              })}
            </select>

            <label
              style={{
                display: "block",
                color: "#94a3b8",
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              Bu iş paketinden sorumlu operatörü seçin:
            </label>
            <select
              value={selectedOperatorForProduction}
              onChange={(e) => setSelectedOperatorForProduction(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#fff",
                marginBottom: "20px",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>
                Operatör Seçin
              </option>
              {availableOperators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.username}
                </option>
              ))}
            </select>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setProductionModalPart(null);
                  setSelectedMachineForProduction("");
                  setSelectedOperatorForProduction("");
                }}
                style={{
                  padding: "10px 15px",
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                İptal
              </button>
              <button
                onClick={handleConfirmProduction}
                style={{
                  padding: "10px 15px",
                  backgroundColor: "#ca8a04",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Tezgaha Gönder ve Başlat ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BÜYÜK KALİTE İSTERİ MODALI */}
      {showQualityModal && (
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
            zIndex: 1200,
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "25px",
              borderRadius: "12px",
              width: "500px",
              border: "1px solid #475569",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#f8fafc" }}>
              📝 Kalite İsterleri (Üretim Sonu Ölçüm)
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginBottom: "15px",
              }}
            >
              Operatör üretimi bitirdikten sonra kalite kontrol mühendisinin
              kumpas, mikrometre vb. ile yapacağı ölçümler ve dikkat etmesi
              gereken toleransları buraya detaylıca yazın.
            </p>
            <textarea
              rows="6"
              placeholder="Örn:&#10;- Dış çap toleransı ±0.05 mm&#10;- Yüzey pürüzlülüğü Ra 1.6 olacak&#10;- Delik içi çapaklar kontrol edilecek"
              value={qualityRequirements}
              onChange={(e) => setQualityRequirements(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#fff",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowQualityModal(false)}
                style={{
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  border: "1px solid #475569",
                  padding: "8px 15px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => setShowQualityModal(false)}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  padding: "8px 15px",
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
