import { useEffect } from 'react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, PageHeader, Panel } from '../../componenets/Ui';
import '../../styles/Friends.css';

const MOCK = [
    { id: 1, text: 'Shared a quick strength routine for clients who need low-equipment workouts.', author: 'NutriPlan Pro', tag: 'workout' },
    { id: 2, text: 'Completed 5 planned meals this week and stayed inside my target range.', author: 'NutriPlan Pro', tag: 'progress' },
];

export default function Friends() {
    useEffect(() => { document.title = 'Friends'; }, []);

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader title="Friends" subtitle="Friend requests, shared diaries, progress posts, comments, and privacy controls." />
                <Panel>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Recent records</h2>
                        <Badge tone="slate">{MOCK.length} items</Badge>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {MOCK.map(f => (
                            <div key={f.id} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0 }}>{f.text}</p>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0' }}>{f.author}</p>
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                    <Badge tone={f.tag === 'workout' ? 'orange' : 'teal'}>{f.tag}</Badge>
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
