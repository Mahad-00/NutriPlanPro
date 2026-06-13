import { useEffect } from 'react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, PageHeader, Panel } from '../../componenets/Ui';
import '../../styles/Restaurants.css';

const MOCK = [
    { id: 1, name: 'Cafe Balance', cuisine: 'Cafe' },
    { id: 2, name: 'Protein House', cuisine: 'Fitness' },
    { id: 3, name: 'Urban Bowl', cuisine: 'Bowls' },
    { id: 4, name: 'Green Fork', cuisine: 'Healthy' },
    { id: 5, name: 'Karachi Grill', cuisine: 'Pakistani' },
];

export default function Restaurants() {
    useEffect(() => { document.title = 'Restaurants'; }, []);

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader title="Restaurants" subtitle="Search restaurants, inspect menu nutrition, and log favorite meals." />
                <Panel>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Recent records</h2>
                        <Badge tone="slate">{MOCK.length} items</Badge>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
                        {MOCK.map(r => (
                            <div key={r.id} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                <p style={{ fontWeight: 600, color: '#020617', margin: 0 }}>{r.name}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>{r.cuisine}</p>
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                    <Badge tone="orange">restaurants</Badge>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>tracked</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ready</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>recent</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div></div>
        </DashboardLayout>
    );
}
