import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { GoalTrendChart } from '../../componenets/Charts';
import '../../styles/Goals.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const GOAL_CAL_MAP = {
    lose_weight: 'calories_for_weight_loss',
    maintain_weight: 'calories_for_maintenance',
    build_muscle: 'calories_for_muscle_gain',
    gain_weight: 'calories_for_muscle_gain',
};
const ACTIVITY_MAP = {
    sedentary: 'sedentary', lightly_active: 'light',
    moderately_active: 'moderate', very_active: 'active', athlete: 'very_active',
};

const ProgressBar = ({ color, pct }) => (
    <div style={{ height: 6, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden', marginTop: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
    </div>
);

export default function Goals() {
    useEffect(() => { document.title = 'Goals'; }, []);

    const submitting = useRef(false);
    const [onboardingData, setOnboardingData] = useState(null);
    const [form, setForm] = useState({
        calorie_goal: 2450,
        protein_goal: 95,
        carb_goal: 347,
        fat_goal: 76,
        goal_type: 'lose_weight',
    });
    const [tdeeLoading, setTdeeLoading] = useState(false);
    const [tdeeSource, setTdeeSource] = useState(false);
    const [saved, setSaved] = useState(false);
    const [records, setRecords] = useState([]);
    const [chartData, setChartData] = useState([]);
    const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

    const fetchGoals = useCallback(async () => {
        try {
            const res = await API.get('/goals', { headers: headers() });
            const goals = res.data.goals || [];
            setRecords(goals);
            setChartData(goals.slice().reverse().map(g => ({
                date: g.date?.slice(5) || '',
                calories: Math.round(g.calorie_goal || 0),
                protein: Math.round(g.protein_goal || 0),
            })));
        } catch { setRecords([]); setChartData([]); }
    }, []);

    const fetchOnboarding = useCallback(async () => {
        try {
            const res = await API.get('/auth/onboarding', { headers: headers() });
            setOnboardingData(res.data);
        } catch { setOnboardingData(null); }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) { fetchGoals(); fetchOnboarding(); }
    }, [fetchGoals, fetchOnboarding]);

    const autoFillFromProfile = useCallback(async (goalType) => {
        if (!onboardingData) return;
        setTdeeLoading(true);
        try {
            const engineActivity = ACTIVITY_MAP[onboardingData.activity_level] || 'moderate';
            const res = await API.post('/recommendation/tdee', {
                weight_kg: onboardingData.current_weight_kg,
                height_cm: onboardingData.height_cm,
                age: onboardingData.age,
                gender: onboardingData.gender,
                activity_level: engineActivity,
            }, { headers: headers() });
            const td = res.data;
            const calKey = GOAL_CAL_MAP[goalType] || 'calories_for_maintenance';
            setForm(prev => ({
                ...prev,
                goal_type: goalType,
                calorie_goal: Math.round(td[calKey] || td.tdee),
                protein_goal: Math.round(td.macro_targets?.protein_g || 0),
                carb_goal: Math.round(td.macro_targets?.carbs_g || 0),
                fat_goal: Math.round(td.macro_targets?.fat_g || 0),
            }));
            setTdeeSource(true);
            setTimeout(() => setTdeeSource(false), 4000);
        } catch { /* fallback to manual entry */ }
        finally { setTdeeLoading(false); }
    }, [onboardingData]);

    const save = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/goals', {
                ...form,
                date: new Date().toISOString().slice(0, 10),
            }, { headers: headers() });
            setRecords(prev => [res.data.goal, ...prev]);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    return (
        <DashboardLayout>
            <div style={{ padding: '28px 28px', background: '#f1f5f9', minHeight: '100%' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Goals</h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px' }}>Set weight, calorie, macro, and meal distribution targets.</p>

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '18px 22px', marginBottom: 18 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Goal Trends</h2>
                    {chartData.length ? <GoalTrendChart data={chartData} /> : <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Save goals to see trends here.</p>}
                </div>

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '22px 24px', marginBottom: 18 }}>
                    {onboardingData && (
                        <div style={{ marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Auto-fill from profile:</span>
                            {Object.entries(GOAL_CAL_MAP).map(([key, label]) => (
                                <button key={key} type="button" onClick={() => autoFillFromProfile(key)}
                                    style={{
                                        borderRadius: 6, border: form.goal_type === key ? '1.5px solid #0f766e' : '1px solid #e2e8f0',
                                        padding: '5px 12px', fontSize: 12, fontWeight: 600,
                                        color: form.goal_type === key ? '#0f766e' : '#64748b',
                                        background: form.goal_type === key ? '#f0fdfa' : '#fff', cursor: 'pointer',
                                    }}>{key.replace('_', ' ')}</button>
                            ))}
                            {tdeeLoading && <span style={{ fontSize: 11, color: '#94a3b8' }}>Calculating...</span>}
                            {tdeeSource && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Auto-filled from profile</span>}
                        </div>
                    )}
                    <form onSubmit={save}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
                            <Field label="calorie goal" value={form.calorie_goal} onChange={v => set('calorie_goal', Number(v))} />
                            <Field label="protein goal" value={form.protein_goal} onChange={v => set('protein_goal', Number(v))} />
                            <Field label="carb goal"    value={form.carb_goal}    onChange={v => set('carb_goal',    Number(v))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'flex-end' }}>
                            <Field label="fat goal" value={form.fat_goal} onChange={v => set('fat_goal', Number(v))} />
                            <GoalSelect value={form.goal_type} onChange={v => { set('goal_type', v); autoFillFromProfile(v); }} />
                            <button type="submit" style={{
                                background: '#0f766e', color: '#fff', border: 'none',
                                borderRadius: 8, padding: '11px 0', fontSize: 14,
                                fontWeight: 600, cursor: 'pointer', width: '100%',
                                height: 44,
                            }}>
                                {saved ? 'Saved!' : 'Save goals'}
                            </button>
                        </div>
                    </form>
                </div>

                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '18px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent records</h2>
                        <span style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 10px' }}>{records.length} items</span>
                    </div>
                    {records.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {records.map(r => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                                    <span style={{ fontWeight: 600 }}>{r.date}</span>
                                    <span>{r.calorie_goal} kcal | P:{r.protein_goal}g C:{r.carb_goal}g F:{r.fat_goal}g</span>
                                    <span style={{ color: '#64748b' }}>{r.goal_type?.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            border: '1.5px dashed #99f6e4', borderRadius: 10,
                            padding: '40px 20px', textAlign: 'center',
                        }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Nothing here yet</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Save your first goal above.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function Field({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{label}</label>
            <input
                type="number"
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 14,
                    color: '#0f172a', outline: 'none',
                    width: '100%', boxSizing: 'border-box',
                }}
            />
        </div>
    );
}

function GoalSelect({ value, onChange }) {
    const options = [
        ['lose_weight', 'Lose weight'],
        ['maintain_weight', 'Maintain'],
        ['gain_weight', 'Gain weight'],
        ['build_muscle', 'Build muscle'],
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>Goal type</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 14,
                    color: '#0f172a', outline: 'none',
                    background: '#fff', width: '100%',
                    height: 44, boxSizing: 'border-box',
                    appearance: 'auto',
                }}
            >
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </div>
    );
}
