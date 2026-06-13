import { useEffect } from 'react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, PageHeader, Panel } from '../../componenets/Ui';
import '../../styles/Exercise.css';

const MOCK_EXERCISES = [
    { id: 1, name: 'Plank', desc: 'Core isometric hold.', type: 'strength' },
    { id: 2, name: 'Jump Rope', desc: 'Conditioning intervals.', type: 'cardio' },
    { id: 3, name: 'HIIT', desc: 'High intensity intervals.', type: 'cardio' },
    { id: 4, name: 'Running', desc: 'Outdoor or treadmill running.', type: 'cardio' },
    { id: 5, name: 'Walking', desc: 'Brisk walking.', type: 'cardio' },
    { id: 6, name: 'Cycling', desc: 'Road or stationary cycling.', type: 'cardio' },
    { id: 7, name: 'Swimming', desc: 'Moderate laps.', type: 'cardio' },
    { id: 8, name: 'Push Ups', desc: 'Bodyweight chest and triceps.', type: 'strength' },
    { id: 9, name: 'Squats', desc: 'Bodyweight or weighted lower body.', type: 'strength' },
    { id: 10, name: 'Bench Press', desc: 'Barbell chest press.', type: 'strength' },
    { id: 11, name: 'Deadlift', desc: 'Full posterior chain lift.', type: 'strength' },
    { id: 12, name: 'Shoulder Press', desc: 'Overhead pressing movement.', type: 'strength' },
];

export default function Exercise() {
    useEffect(() => { document.title = 'Exercise'; }, []);

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader title="Exercise" subtitle="Log cardio, strength, custom exercises, and calories burned." />
                <Panel>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Recent records</h2>
                        <Badge tone="slate">{MOCK_EXERCISES.length} items</Badge>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
                        {MOCK_EXERCISES.map(e => (
                            <div key={e.id} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                <p style={{ fontWeight: 600, color: '#020617', margin: 0 }}>{e.name}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>{e.desc}</p>
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                    <Badge tone={e.type === 'strength' ? 'blue' : 'orange'}>{e.type}</Badge>
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
