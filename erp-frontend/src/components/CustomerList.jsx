import { useState, useEffect } from "react";

export default function CustomerList({
  workPackages = [],
  parts = [],
  onRefresh,
  user,
}) {
  const [customers, setCustomers] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Müşteriler çekilirken hata:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const newCustomer = { companyName, contactPerson, phone, email, address };

    try {
      await fetch("http://localhost:8080/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      setCompanyName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      fetchCustomers();
    } catch (error) {
      console.error("Müşteri eklenirken hata:", error);
    }
  };

  const handleDeleteCustomer = async (id) => {
    const hasOrders = workPackages.some(
      (wp) => wp.customer && wp.customer.id === id,
    );
    if (hasOrders) {
      alert(
        "⚠️ DİKKAT: Bu müşteriye ait aktif veya geçmiş siparişler (İş Paketleri) var! Önce onları silmeli veya devretmelisiniz.",
      );
      return;
    }

    if (
      window.confirm("Bu müşteriyi sistemden silmek istediğinize emin misiniz?")
    ) {
      await fetch(`http://localhost:8080/api/customers/${id}`, {
        method: "DELETE",
      });
      fetchCustomers();
    }
  };

  const handleHardDeleteOrder = async (orderId) => {
    if (
      window.confirm(
        "🔥 DİKKAT: Bu siparişi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz, Kanban panosundaki parçalar da uçar!",
      )
    ) {
      try {
        await fetch(`http://localhost:8080/api/work-packages/${orderId}/hard`, {
          method: "DELETE",
        });
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Kalıcı silme hatası:", error);
      }
    }
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #475569",
    backgroundColor: "#0f172a",
    color: "#fff",
    flex: "1 1 200px",
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
      <h2 style={{ color: "#f8fafc", marginBottom: "20px" }}>
        👥 Müşteri (CRM) Yönetimi
      </h2>

      <form
        onSubmit={handleAddCustomer}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "30px",
          backgroundColor: "#0f172a",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <input
          type="text"
          placeholder="Firma Adı (Örn: Nexom A.Ş.)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Yetkili Kişi"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Telefon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="E-Posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder="Firma Adresi"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ ...inputStyle, flex: "1 1 100%" }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#3b82f6",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            width: "100%",
          }}
        >
          + Yeni Müşteri Ekle
        </button>
      </form>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          fontSize: "14px",
          color: "#f1f5f9",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #475569", color: "#94a3b8" }}>
            <th style={{ padding: "12px 8px" }}>Firma Adı</th>
            <th style={{ padding: "12px 8px" }}>Yetkili & İletişim</th>
            <th style={{ padding: "12px 8px" }}>Sipariş Analizi</th>
            <th style={{ padding: "12px 8px" }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const customerOrders = workPackages.filter(
              (wp) => wp.customer && wp.customer.id === c.id,
            );
            return (
              <tr key={c.id} style={{ borderBottom: "1px solid #334155" }}>
                <td
                  style={{
                    padding: "12px 8px",
                    fontWeight: "bold",
                    color: "#38bdf8",
                  }}
                >
                  {c.companyName}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <div>👤 {c.contactPerson || "-"}</div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginTop: "2px",
                    }}
                  >
                    📞 {c.phone || "-"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginTop: "2px",
                    }}
                  >
                    ✉️ {c.email || "-"}
                  </div>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    style={{
                      backgroundColor: "#8b5cf6",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    📦 {customerOrders.length} Sipariş Geçmişi
                  </button>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  {user?.role === "ADMIN" && (
                    <button
                      onClick={() => handleDeleteCustomer(c.id)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
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
            );
          })}
        </tbody>
      </table>

      {/* SİPARİŞ GEÇMİŞİ MODALI */}
      {selectedCustomer && (
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
              width: "650px",
              border: "1px solid #475569",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                color: "#f8fafc",
                borderBottom: "1px solid #334155",
                paddingBottom: "10px",
              }}
            >
              🏢 {selectedCustomer.companyName} - Sipariş Geçmişi
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {workPackages.filter(
                (wp) => wp.customer && wp.customer.id === selectedCustomer.id,
              ).length === 0 ? (
                <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
                  Bu müşteriye ait henüz bir sipariş bulunmuyor.
                </div>
              ) : (
                workPackages
                  .filter(
                    (wp) =>
                      wp.customer && wp.customer.id === selectedCustomer.id,
                  )
                  .map((wp) => {
                    const isCancelled =
                      wp.isCancelled === true || wp.cancelled === true;
                    const wpParts = parts.filter(
                      (p) => p.workPackage?.id === wp.id,
                    );
                    const isCompleted =
                      !isCancelled &&
                      wpParts.length > 0 &&
                      wpParts.every(
                        (p) =>
                          p.status === "TAMAMLANDI" &&
                          p.postProcess === "TESLIM_EDILDI",
                      );

                    let bgColor = "#0f172a";
                    let borderColor = "#475569";
                    if (isCancelled) {
                      bgColor = "#450a0a";
                      borderColor = "#ef4444";
                    } else if (isCompleted) {
                      bgColor = "#064e3b";
                      borderColor = "#10b981";
                    }

                    return (
                      <div
                        key={wp.id}
                        style={{
                          backgroundColor: bgColor,
                          padding: "15px",
                          borderRadius: "8px",
                          border: `1px solid ${borderColor}`,
                          opacity: isCancelled ? 0.8 : 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                          }}
                        >
                          <strong
                            style={{
                              color: isCancelled
                                ? "#ef4444"
                                : isCompleted
                                  ? "#34d399"
                                  : "#38bdf8",
                              textDecoration: isCancelled
                                ? "line-through"
                                : "none",
                              fontSize: "15px",
                            }}
                          >
                            Paket No: {wp.packageNo}
                            {isCancelled && " (❌ İPTAL)"}
                            {isCompleted && " (✅ TAMAMLANDI)"}
                          </strong>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            📅 Sipariş: {wp.orderDate}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            color: "#cbd5e1",
                            marginBottom: "10px",
                          }}
                        >
                          <strong>Teslim Hedefi:</strong> {wp.deliveryDate}
                          <br />
                          <strong>Özel Notlar:</strong>{" "}
                          {wp.qualityNotes || "Yok"}
                        </div>

                        {/* YENİ: SİPARİŞİN İÇERİĞİ (HANGİ PARÇALAR VARDI?) */}
                        <div
                          style={{
                            backgroundColor: "rgba(0,0,0,0.2)",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px dashed rgba(255,255,255,0.1)",
                          }}
                        >
                          <strong
                            style={{ fontSize: "12px", color: "#94a3b8" }}
                          >
                            📦 Sipariş Detayı:
                          </strong>
                          <ul
                            style={{
                              margin: "5px 0 0 0",
                              paddingLeft: "20px",
                              fontSize: "13px",
                              color: "#e2e8f0",
                            }}
                          >
                            {wpParts.length === 0 ? (
                              <li
                                style={{
                                  fontStyle: "italic",
                                  color: "#64748b",
                                }}
                              >
                                İçerik boş.
                              </li>
                            ) : (
                              wpParts.map((p) => (
                                <li key={p.id}>
                                  <strong>{p.quantity} Adet</strong> -{" "}
                                  {p.productName}{" "}
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "11px",
                                    }}
                                  >
                                    (No: {p.partNo})
                                  </span>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>

                        {/* YENİ: KALICI SİL BUTONU ARTIK TAMAMLANANLAR İÇİN DE AKTİF */}
                        {(isCancelled || isCompleted) &&
                          user?.role === "ADMIN" && (
                            <button
                              onClick={() => handleHardDeleteOrder(wp.id)}
                              style={{
                                backgroundColor: "#dc2626",
                                color: "#fff",
                                border: "none",
                                padding: "8px 12px",
                                borderRadius: "4px",
                                marginTop: "12px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                width: "100%",
                              }}
                            >
                              🗑️ Paketi ve İçeriğini Kalıcı Olarak Temizle
                            </button>
                          )}
                      </div>
                    );
                  })
              )}
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              style={{
                backgroundColor: "#475569",
                color: "#fff",
                border: "none",
                padding: "10px",
                width: "100%",
                borderRadius: "6px",
                marginTop: "20px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
