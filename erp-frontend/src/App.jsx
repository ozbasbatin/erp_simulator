import { useState, useEffect } from 'react';
import MachineList from './components/MachineList.jsx';
import PartList from './components/PartList.jsx';
import WorkPackageList from './components/WorkPackageList.jsx';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('production');

  // Sadece Veriler (State)
  const [machines, setMachines] = useState([]);
  const [parts, setParts] = useState([]);
  const [workPackages, setWorkPackages] = useState([]);

  // Backend'den Veri Çekme
  const fetchData = async () => {
    try {
      const machRes = await fetch('http://localhost:8080/api/machines');
      setMachines(await machRes.json());
      const partRes = await fetch('http://localhost:8080/api/parts');
      setParts(await partRes.json());
      const wpRes = await fetch('http://localhost:8080/api/work-packages');
      setWorkPackages(await wpRes.json());
    } catch (error) {
      console.error("Backend bağlantı hatası:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tabStyle = (tabName) => ({
    padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold', border: 'none', borderRadius: '8px', marginRight: '10px', transition: '0.3s',
    backgroundColor: activeTab === tabName ? '#38bdf8' : '#1e293b',
    color: activeTab === tabName ? '#0f172a' : '#94a3b8',
  });

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '30px' }}>

      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>⚙️ Nexom ERP</h1>
          <span style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', border: '1px solid #475569', fontSize: '14px' }}>
            Backend: <span style={{ color: '#4ade80' }}>● Bağlı</span>
          </span>
        </div>

        <nav style={{ display: 'flex' }}>
          <button style={tabStyle('production')} onClick={() => setActiveTab('production')}>🏭 Üretim & Makineler</button>
          <button style={tabStyle('workPackages')} onClick={() => setActiveTab('workPackages')}>📦 İş Paketleri</button>
        </nav>
      </header>

      <main>
        {activeTab === 'production' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Alt Bileşenleri Çağırıyoruz */}
            <MachineList machines={machines} onRefresh={fetchData} />
            <PartList parts={parts} machines={machines} workPackages={workPackages} onRefresh={fetchData} />
          </div>
        )}

        {activeTab === 'workPackages' && (
          <div style={{ maxWidth: '800px' }}>
            <WorkPackageList workPackages={workPackages} onRefresh={fetchData} />
          </div>
        )}
      </main>

    </div>
  );
}

export default App;