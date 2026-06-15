import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Trash2 } from 'lucide-react';
import '../../styles/Water.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const QUICK_ML = [250, 500, 750, 1000];
const goal = 2000;

const WaterDropIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C12 2 5 10 5 14a7 7 0 0014 0C19 10 12 2 12 2z"/>
        <path d="M9 15a3 3 0 006 0" stroke="#bfdbfe" strokeWidth="1.5"/>
    </svg>
);

export default function Water() {
    useEffect(() => { document.title = 'Water'; }, []);

    const today = new Date().toISOString().slice(0, 10);
    const [total, setTotal] = useState(0);
    const [custom, setCustom] = useState(250);
    const [date, setDate] = useState(today);
    const [logs, setLogs] = useState([]);
    const [activeQuick, setActiveQuick] = useState(250);
    const submitting = useRef(false);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await API.get(`/water?date=${date}`, { headers: headers() });
            setLogs(res.data.logs);
            const sum = res.data.logs.reduce((acc, l) => acc + l.ml, 0);
            setTotal(sum);
        } catch { setLogs([]); setTotal(0); }
    }, [date]);

    useEffect(() => {
        if (localStorage.getItem('token')) fetchLogs();
    }, [fetchLogs]);

    const addWater = async (ml) => {
        if (submitting.current) return;
        submitting.current = true;
        try {
            const now = new Date().toLocaleTimeString();
            await API.post('/water', { ml, date, time: now }, { headers: headers() });
            fetchLogs();
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    const removeLog = async (id, ml) => {
        try {
            await API.delete(`/water/${id}`, { headers: headers() });
            setLogs(prev => prev.filter(l => l.id !== id));
            setTotal(prev => Math.max(0, prev - ml));
        } catch { /* error */ }
    };

    const pct = Math.min((total / goal) * 100, 100);

    return (
        <DashboardLayout>
            <div style={{ padding: '28px 28px', background: '#f1f5f9', minHeight: '100%', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Water</h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>Track hydration with quick buttons, custom amounts, and daily progress.</p>

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 20px 20px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <span style={{
                                display: 'inline-block',
                                border: '1px solid #0ea5e9',
                                color: '#0ea5e9',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 10px',
                                borderRadius: 20,
                                marginBottom: 16,
                            }}>Daily target</span>
                            <p style={{ fontSize: 28, fontWeight: 700, color: '#0ea5e9', margin: '0 0 14px' }}>
                                {total} <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 500 }}>/ {goal} ml</span>
                            </p>
                            <div style={{ height: 6, borderRadius: 999, background: '#e0f2fe', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                                    borderRadius: 999,
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>
                        <div style={{ marginLeft: 16, marginTop: 4 }}>
                            <WaterDropIcon />
                        </div>
                    </div>
                </div>

                {total < goal && total > 0 && (
                    <div style={{
                        background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
                        padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center',
                        gap: 10, fontSize: 13, color: '#c2410c',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span>Ensure your water intake is proper and complete — you're at <strong>{total} ml</strong> of {goal} ml.</span>
                    </div>
                )}

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>Date</span>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    padding: '7px 10px', fontSize: 13,
                                    color: '#0f172a', outline: 'none',
                                    height: 38, boxSizing: 'border-box',
                                    background: '#fff',
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }} />

                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginTop: 18 }}>
                            {QUICK_ML.map(ml => (
                                <button
                                    key={ml}
                                    type="button"
                                    onClick={() => { setActiveQuick(ml); setCustom(ml); }}
                                    style={{
                                        borderRadius: 8,
                                        border: activeQuick === ml ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
                                        padding: '7px 14px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: activeQuick === ml ? '#0ea5e9' : '#64748b',
                                        background: activeQuick === ml ? '#f0f9ff' : '#fff',
                                        cursor: 'pointer',
                                        height: 38,
                                    }}
                                >
                                    {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>Custom ml</span>
                            <input
                                type="number"
                                value={custom}
                                onChange={e => { setCustom(Number(e.target.value)); setActiveQuick(null); }}
                                style={{
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    padding: '7px 10px', fontSize: 13,
                                    color: '#0f172a', outline: 'none',
                                    width: 90, height: 38, boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => addWater(custom)}
                            style={{
                                background: '#0ea5e9', color: '#fff', border: 'none',
                                borderRadius: 8, padding: '0 20px', fontSize: 13,
                                fontWeight: 600, cursor: 'pointer',
                                height: 38, marginTop: 18,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Add water
                        </button>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Today's logs</h2>

                    {logs.length === 0 ? (
                        <div style={{
                            border: '1.5px dashed #bae6fd', borderRadius: 10,
                            padding: '36px 20px', textAlign: 'center',
                        }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>No water logged</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Use the quick buttons or custom amount above.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {logs.map(log => (
                                <div key={log.id} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    padding: '10px 14px',
                                    fontSize: 13, color: '#334155',
                                }}>
                                    <span style={{ fontWeight: 500 }}>{log.ml} ml</span>
                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{log.time}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeLog(log.id, log.ml)}
                                        style={{
                                            background: 'none', border: 'none',
                                            cursor: 'pointer', color: '#ef4444',
                                            display: 'flex', alignItems: 'center',
                                            padding: 4,
                                        }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
