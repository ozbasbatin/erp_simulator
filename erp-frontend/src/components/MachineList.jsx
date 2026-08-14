import { useState } from 'react';

export default function MachineList({ machines, onRefresh }) {
    const [machineName, setMachineName] = useState('');
    const [maintenanceDate, setMaintenanceDate] = useState('');

    const handleAddMachine = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/machines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: machineName, maintenanceDate })
        });
        setMachineName('');
        setMaintenanceDate('');
        onRefresh();
    };

    // --- YENİ: SİLME FONKSİYONU ---
    const handleDeleteMachine = async (id) => {
        if (window.confirm("Bu makineyi silmek istediğinize emin misiniz?")) {
            await fetch(`http://localhost:8080/api/machines/${id}`, { method: 'DELETE' });
            onRefresh();
        }
    };

    const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' };

    return (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h2>Makineler / Tezgahlar</h2>
            <form onSubmit={handleAddMachine} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Makine Adı" value={machineName} onChange={(e) => setMachineName(e.target.value)} required style={inputStyle} />
                <input type="date" value={maintenanceDate} onChange={(e) => setMaintenanceDate(e.target.value)} required style={inputStyle} />
                <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Makine Ekle</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Adı</th>
                        <th style={{ padding: '8px' }}>Bakım</th>
                        <th style={{ padding: '8px' }}>İşlem</th> {/* YENİ SÜTUN */}
                    </tr>
                </thead>
                <tbody>
                    {machines.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px' }}>{m.id}</td>
                            <td style={{ padding: '8px' }}>{m.name}</td>
                            <td style={{ padding: '8px' }}>{m.maintenanceDate}</td>
                            <td style={{ padding: '8px' }}>
                                <button onClick={() => handleDeleteMachine(m.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Sil</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}