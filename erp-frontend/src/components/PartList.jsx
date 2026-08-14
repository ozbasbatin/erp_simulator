import { useState } from 'react';

export default function PartList({ parts, machines, workPackages, onRefresh }) {
    const [partNo, setPartNo] = useState('');
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [machineId, setMachineId] = useState('');
    const [selectedWpId, setSelectedWpId] = useState('');

    const handleAddPart = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/parts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                partNo, productName, quantity: Number(quantity), status: "BEKLIYOR",
                machine: { id: Number(machineId) },
                workPackage: { id: Number(selectedWpId) }
            })
        });
        setPartNo(''); setProductName(''); setQuantity(''); setMachineId(''); setSelectedWpId('');
        onRefresh();
    };

    const handleUpdateStatus = async (id, newStatus) => {
        await fetch(`http://localhost:8080/api/parts/${id}/status?status=${newStatus}`, { method: 'PUT' });
        onRefresh();
    };

    // --- YENİ: SİLME FONKSİYONU ---
    const handleDeletePart = async (id) => {
        if (window.confirm("Bu parçayı silmek istediğinize emin misiniz?")) {
            await fetch(`http://localhost:8080/api/parts/${id}`, { method: 'DELETE' });
            onRefresh();
        }
    };

    const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' };

    return (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h2>Parça Üretim Takibi</h2>
            <form onSubmit={handleAddPart} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Parça No" value={partNo} onChange={(e) => setPartNo(e.target.value)} required style={inputStyle} />
                <input type="text" placeholder="Ürün Adı" value={productName} onChange={(e) => setProductName(e.target.value)} required style={inputStyle} />
                <input type="number" placeholder="Adet" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={inputStyle} />

                <select value={machineId} onChange={(e) => setMachineId(e.target.value)} required style={inputStyle}>
                    <option value="" disabled>Makine Seçin</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <select value={selectedWpId} onChange={(e) => setSelectedWpId(e.target.value)} required style={inputStyle}>
                    <option value="" disabled>İş Paketi Seçin</option>
                    {workPackages.map(wp => <option key={wp.id} value={wp.id}>{wp.packageNo}</option>)}
                </select>

                <button type="submit" style={{ backgroundColor: '#16a34a', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Parça Ekle</button>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                        <th style={{ padding: '8px' }}>P.No</th>
                        <th style={{ padding: '8px' }}>Ürün</th>
                        <th style={{ padding: '8px' }}>Durum</th>
                        <th style={{ padding: '8px' }}>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    {parts.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px' }}>{p.partNo}</td>
                            <td style={{ padding: '8px' }}>{p.productName}</td>
                            <td style={{ padding: '8px' }}>
                                <span style={{ backgroundColor: p.status === 'BEKLIYOR' ? '#854d0e' : '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{p.status}</span>
                            </td>
                            <td style={{ padding: '8px', display: 'flex', gap: '5px' }}>
                                {p.status === 'BEKLIYOR' && <button onClick={() => handleUpdateStatus(p.id, 'URETIMDE')} style={{ backgroundColor: '#ca8a04', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Üretime Al</button>}
                                <button onClick={() => handleDeletePart(p.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Sil</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}