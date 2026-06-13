import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Sparkles, CheckCircle } from 'lucide-react';
import '../../styles/Workouts.css';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const goals = [
    ['build_muscle', 'Build muscle'],
    ['fat_loss', 'Fat loss'],
    ['endurance', 'Endurance'],
    ['general_fitness', 'General fitness'],
];

export default function Workouts() {
    useEffect(() => { document.title = 'Workouts'; }, []);

    const [goal, setGoal] = useState('build_muscle');
    const [logRoutine, setLogRoutine] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
    const [generated, setGenerated] = useState(false);
    const [logged, setLogged] = useState(false);
    const [routines, setRoutines] = useState([]);
    const [logs, setLogs] = useState([]);
    const submitting = useRef(false);

    const fetchRoutines = useCallback(async () => {
        try {
            const res = await API.get('/workouts/routines', { headers: headers() });
            setRoutines(res.data.routines);
        } catch { setRoutines([]); }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await API.get('/workouts/logs', { headers: headers() });
            setLogs(res.data.logs);
        } catch { setLogs([]); }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) { fetchRoutines(); fetchLogs(); }
    }, [fetchRoutines, fetchLogs]);

    const handleGenerate = async () => {
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/workouts/routines', { goal }, { headers: headers() });
            setRoutines(prev => [res.data.routine, ...prev]);
            setGenerated(true);
            setTimeout(() => setGenerated(false), 2000);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    const handleLog = async () => {
        if (submitting.current) return;
        submitting.current = true;
        try {
            const routine = routines.find(r => r.name === logRoutine);
            await API.post('/workouts/logs', {
                routine_name: logRoutine,
                goal,
                date: logDate,
                exercises: routine?.exercises || '',
            }, { headers: headers() });
            setLogged(true);
            fetchLogs();
            setTimeout(() => setLogged(false), 2000);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    return (
        <DashboardLayout>
            <div style={{ padding: '28px 28px', background: '#f1f5f9', minHeight: '100%' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Workouts</h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px' }}>Generate goal-based routines, log workouts, mark completion, and sync calories burned.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '20px 22px' }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Workout generator</h2>
                        <div style={{ marginBottom: 6 }}>
                            <label style={{ fontSize: 13, color: '#334155', fontWeight: 500, display: 'block', marginBottom: 6 }}>Goal</label>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <select
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    style={{
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        padding: '9px 12px', fontSize: 13,
                                        color: '#0f172a', outline: 'none',
                                        background: '#fff', appearance: 'auto',
                                        flex: 1, height: 40,
                                    }}
                                >
                                    {goals.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    style={{
                                        background: '#0f766e', color: '#fff', border: 'none',
                                        borderRadius: 8, padding: '0 16px', fontSize: 13,
                                        fontWeight: 600, cursor: 'pointer', height: 40,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Sparkles size={14} />
                                    {generated ? 'Generated!' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '20px 22px' }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Log workout</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 13, color: '#334155', fontWeight: 500, display: 'block', marginBottom: 6 }}>Routine</label>
                                <select
                                    value={logRoutine}
                                    onChange={e => setLogRoutine(e.target.value)}
                                    style={{
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        padding: '9px 12px', fontSize: 13,
                                        color: '#0f172a', outline: 'none',
                                        background: '#fff', appearance: 'auto',
                                        width: '100%', height: 40,
                                    }}
                                >
                                    <option value="">Select routine</option>
                                    {routines.map(r => (
                                        <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, color: '#334155', fontWeight: 500, display: 'block', marginBottom: 6 }}>Date</label>
                                <input
                                    type="date"
                                    value={logDate}
                                    onChange={e => setLogDate(e.target.value)}
                                    style={{
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        padding: '9px 12px', fontSize: 13,
                                        color: '#0f172a', outline: 'none',
                                        height: 40, boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLog}
                            style={{
                                background: '#0f766e', color: '#fff', border: 'none',
                                borderRadius: 8, padding: '10px 0', fontSize: 13,
                                fontWeight: 600, cursor: 'pointer', width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                        >
                            <CheckCircle size={15} />
                            {logged ? 'Logged!' : 'Log complete'}
                        </button>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '18px 22px', marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Workout plans</h2>
                        <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 10px' }}>
                            {routines.length} routines
                        </span>
                    </div>
                    {routines.length ? routines.map(plan => (
                        <div key={plan.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', margin: '0 0 2px' }}>{plan.name}</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>{plan.goal} | {plan.level}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {plan.exercises.split(',').map((ex, i) => (
                                    <div key={i} style={{
                                        background: '#f8fafc', borderRadius: 6,
                                        padding: '8px 12px', fontSize: 13, color: '#334155',
                                    }}>{ex.trim()}</div>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <div style={{ border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: '36px 20px', textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>No routines yet</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Generate a workout routine above.</p>
                        </div>
                    )}
                </div>

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Workout logs</h2>
                        <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 10px' }}>{logs.length} entries</span>
                    </div>
                    {logs.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {logs.map(log => (
                                <div key={log.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 600 }}>{log.routine_name}</span>
                                        <span style={{ color: '#64748b' }}>{log.date}</span>
                                    </div>
                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{log.exercises}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: '36px 20px', textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>No workout logs</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Log a completed workout above.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
