import { useState } from 'react';

export default function WorkPackageList({ workPackages, onRefresh }) {
    const [packageNo, setPackageNo] = useState('');
    const [qualityNotes, setQualityNotes] = useState('');

    const handleAddWorkPackage = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/work-packages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageNo, qualityNotes })
        });
        setPackageNo(''); setQualityNotes('');
        onRefresh();
    };

    // --- YENİ: SİLME FONKSİYONU ---
    const handleDeleteWorkPackage = async (id) => {
        if (window.confirm("Bu iş paketini silmek istediğinize emin misiniz?")) {
            await fetch(`http://localhost:8080/api/work-packages/${id}`, { method: 'DELETE' });
            onRefresh();
        }
    };

    const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' };

    return (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h2>Sipariş ve İş Paketleri</h2>
            <form onSubmit={handleAddWorkPackage} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Paket No (Örn: WP-2026-01)" value={packageNo} onChange={(e) => setPackageNo(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
                <input type="text" placeholder="Kalite Notları (Opsiyonel)" value={qualityNotes} onChange={(e) => setQualityNotes(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                <button type="submit" style={{ backgroundColor: '#6366f1', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Oluştur</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Paket No</th>
                        <th style={{ padding: '8px' }}>Kalite Özel Notu</th>
                        <th style={{ padding: '8px' }}>İşlem</th> {/* YENİ SÜTUN */}
                    </tr>
                </thead>
                <tbody>
                    {workPackages.map((wp) => (
                        <tr key={wp.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px', color: '#94a3b8' }}>{wp.id}</td>
                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#e2e8f0' }}>{wp.packageNo}</td>
                            <td style={{ padding: '8px' }}>{wp.qualityNotes || '-'}</td>
                            <td style={{ padding: '8px' }}>
                                <button onClick={() => handleDeleteWorkPackage(wp.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Sil</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}