import { useState, useEffect } from "react";

export default function EmployeeManager() {
  const [staffList, setStaffList] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("OPERATOR"); // Varsayılan rol

  const fetchStaff = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/staff");
      if (res.ok) setStaffList(await res.json());
    } catch (error) {
      console.error("Çalışanlar çekilirken hata:", error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newUsername) return;
    // Eğer rol operatör değilse ve şifre boşsa uyarı ver
    if (selectedRole !== "OPERATOR" && !newPassword) {
      alert("Üretim ve Kalite personeli için şifre zorunludur!");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/users/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: selectedRole === "OPERATOR" ? "-" : newPassword,
          role: selectedRole,
        }),
      });

      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        fetchStaff();
      }
    } catch (error) {
      console.error("Çalışan eklenirken hata:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu kişiyi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchStaff();
    } catch (error) {
      console.error("Silinirken hata:", error);
    }
  };

  // Rolleri Türkçe göstermek için ufak bir sözlük
  const roleNames = {
    OPERATOR: "Sahadaki Operatör",
    PRODUCTION: "Üretim Sorumlusu (Sistem)",
    QUALITY: "Kalite Sorumlusu (Sistem)",
  };

  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #334155",
        marginBottom: "20px",
      }}
    >
      <h2 style={{ color: "#38bdf8", marginTop: 0, marginBottom: "20px" }}>
        👥 Çalışan Yönetimi
      </h2>

      <form
        onSubmit={handleAddStaff}
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Ad Soyad / Kullanıcı Adı"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #475569",
            backgroundColor: "#0f172a",
            color: "#fff",
          }}
        />

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #475569",
            backgroundColor: "#0f172a",
            color: "#fff",
          }}
        >
          <option value="OPERATOR">Makine Operatörü</option>
          <option value="PRODUCTION">Üretim Sorumlusu</option>
          <option value="QUALITY">Kalite Sorumlusu</option>
        </select>

        {/* EĞER OPERATÖR SEÇİLİ DEĞİLSE ŞİFRE KUTUSUNU GÖSTER */}
        {selectedRole !== "OPERATOR" && (
          <input
            type="text"
            placeholder="Giriş Şifresi"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              flex: 1,
              minWidth: "150px",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #475569",
              backgroundColor: "#0f172a",
              color: "#fff",
            }}
          />
        )}

        <button
          type="submit"
          style={{
            backgroundColor: "#10b981",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Kaydet
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {staffList.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            Sistemde kayıtlı çalışan yok.
          </p>
        ) : (
          staffList.map((staff) => (
            <div
              key={staff.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#0f172a",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#f8fafc",
                    fontWeight: "bold",
                    marginRight: "10px",
                  }}
                >
                  {staff.username}
                </span>
                <span
                  style={{
                    color: "#38bdf8",
                    fontSize: "12px",
                    border: "1px solid #38bdf8",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    marginRight: "10px",
                  }}
                >
                  {roleNames[staff.role] || staff.role}
                </span>
                {staff.role !== "OPERATOR" && (
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                    Şifre: {staff.password}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(staff.id)}
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
