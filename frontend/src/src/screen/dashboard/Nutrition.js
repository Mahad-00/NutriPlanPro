import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { PageHeader, Panel } from '../../componenets/Ui';
import { CaloriesChart, MacroBarChart } from '../../componenets/Charts';
import '../../styles/Nutrition.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

const GOAL = { calories: 2450, protein: 95, carbs: 347, fat: 76, sugar: 50, sodium: 2300, fiber: 34 };

const NUTRIENTS = [
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'carbs', label: 'Carbs', unit: 'g' },
    { key: 'fat', label: 'Fat', unit: 'g' },
    { key: 'sugar', label: 'Sugar', unit: 'g' },
    { key: 'sodium', label: 'Sodium', unit: 'mg' },
    { key: 'fiber', label: 'Fiber', unit: 'g' },
];

const INSIGHTS = [
    { tone: 'warning', message: 'You are short on protein today. Add lean protein or Greek yogurt to close the gap.' },
    { tone: 'info', message: 'Fiber is low. Lentils, salad, oats, or fruit would help tomorrow feel better.' },
];

export default function Nutrition() {
    useEffect(() => { document.title = 'Nutrition Reports'; }, []);

    const [dailyCalories, setDailyCalories] = useState([]);
    const [dailyMacros, setDailyMacros] = useState([]);
    const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0 });

    const load = useCallback(async () => {
        try {
            const res = await API.get('/food-diary/summary?days=7', { headers: headers() });
            setDailyCalories(res.data.daily_calories || []);
            setDailyMacros(res.data.daily_macros || []);
            const m = res.data.today_macros || {};
            setTotals({
                calories: m.calories || 0,
                protein: m.protein || 0,
                carbs: m.carbs || 0,
                fat: m.fat || 0,
                sugar: 0,
                sodium: 0,
                fiber: m.fiber || 0,
            });
        } catch { /* keep defaults */ }
    }, []);

    useEffect(() => { if (localStorage.getItem('token')) load(); }, [load]);

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader title="Nutrition Reports" subtitle="Daily, weekly, and monthly nutrient graphs with plain-language insights." />

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', marginBottom: '1.5rem' }}>
                    {NUTRIENTS.map(n => (
                        <Panel key={n.key}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{n.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#020617', margin: '0.25rem 0 0' }}>{totals[n.key]}</p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>of {GOAL[n.key]} {n.unit}</p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', margin: '0.5rem 0 0' }}>
                                {Math.round(GOAL[n.key] - totals[n.key])} {n.unit} remaining
                            </p>
                        </Panel>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1.5rem' }}>
                    <Panel>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Calories (7 days)</h2>
                        <CaloriesChart data={dailyCalories} />
                    </Panel>
                    <Panel>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Macro Breakdown (7 days)</h2>
                        <MacroBarChart data={dailyMacros} />
                    </Panel>
                </div>

                <Panel>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0, marginBottom: '1rem' }}>Insights</h2>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {INSIGHTS.map((insight, i) => (
                            <div key={i} style={{
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1rem',
                                fontSize: '0.875rem',
                                lineHeight: '1.5rem',
                                background: insight.tone === 'warning' ? '#fff7ed' : '#f0fdfa',
                                color: insight.tone === 'warning' ? '#9a3412' : '#115e59',
                            }}>
                                <span style={{
                                    display: 'inline-block', borderRadius: '9999px', padding: '0.25rem 0.75rem',
                                    fontSize: '0.75rem', fontWeight: 600,
                                    background: insight.tone === 'warning' ? '#ffedd5' : '#ccfbf1',
                                    color: insight.tone === 'warning' ? '#9a3412' : '#115e59',
                                }}>{insight.tone === 'warning' ? 'Warning' : 'Tip'}</span>
                                <p style={{ margin: '0.5rem 0 0' }}>{insight.message}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div></div>
        </DashboardLayout>
    );
}
