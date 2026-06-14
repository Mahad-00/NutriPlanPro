import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import '../../styles/DietRecommender.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const MOCK_PICKS = [
    { id: 1, name: 'Chicken karahi',   brand: 'Custom Pakistani', fit: 99, note: 'Closes the protein gap with a strong calorie fit.', kcal: 430, pro: 34, carbs: 12, fiber: 3 },
    { id: 2, name: 'Protein shake',    brand: 'Lift Lab',          fit: 99, note: 'Closes the protein gap with a strong calorie fit.', kcal: 210, pro: 32, carbs: 9,  fiber: 1 },
    { id: 3, name: 'Grilled fish',     brand: 'Ocean Fresh',       fit: 99, note: 'Closes the protein gap with a strong calorie fit.', kcal: 210, pro: 32, carbs: 0,  fiber: 0 },
    { id: 4, name: 'Chicken breast',   brand: 'Fresh Market',      fit: 99, note: 'Closes the protein gap with a strong calorie fit.', kcal: 165, pro: 31, carbs: 0,  fiber: 0 },
    { id: 5, name: 'Homemade biryani', brand: 'Custom Pakistani',  fit: 99, note: 'Closes the protein gap with a strong calorie fit.', kcal: 520, pro: 28, carbs: 62, fiber: 4 },
    { id: 6, name: 'Tuna',             brand: 'Ocean Fresh',       fit: 99, note: 'Closes the protein gap with a strong calorie fit.', kcal: 132, pro: 28, carbs: 0,  fiber: 0 },
];

const MOCK_RHYTHM = [
    { meal: 'Breakfast', share: 25, kcal: 605 },
    { meal: 'Lunch',     share: 35, kcal: 847 },
    { meal: 'Dinner',    share: 30, kcal: 726 },
    { meal: 'Snacks',    share: 10, kcal: 242 },
];

const MOCK_RECIPES = [
    { name: 'Quinoa Salad',    meal: 'Lunch',     fit: 94, kcal: 518, protein: 27, prep: 25 },
    { name: 'Homemade Biryani',meal: 'Dinner',    fit: 94, kcal: 536, protein: 30, prep: 10 },
    { name: 'Chicken Karahi',  meal: 'Breakfast', fit: 94, kcal: 554, protein: 33, prep: 15 },
];

const MOCK_RULES = [
    'Choose the highest protein option when two meals have similar calories.',
    'Pair a lower fiber meal with salad, lentils, oats, fruit, or vegetables.',
    'Use calorie dense add-ons after protein is covered, not before.',
    'Add a protein forward snack before dinner to avoid chasing the target late.',
];

const IconStar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);
const IconClock = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);
const IconFlame = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-7-7c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
    </svg>
);
const IconRecipe = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
);

const s = {
    page:    { padding: '0 24px 32px', background: '#f1f5f9', minHeight: '100%', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
    card:    { background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' },
    fitBadge:{ background: '#f0fdfa', color: '#0f766e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
    btnAdd:  { background: '#0f766e', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    btnGen:  { background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

const MacroBar = ({ label, pct, color }) => (
    <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
            <span>{label}</span><span>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: '#e2e8f0' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
        </div>
    </div>
);

const FoodCard = ({ p, onAdd }) => (
    <div style={{ ...s.card, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{p.brand}</p>
            </div>
            <span style={s.fitBadge}>{p.fit}% fit</span>
        </div>
        <p style={{ fontSize: 11, color: '#64748b', margin: '5px 0 6px', lineHeight: 1.5 }}>{p.note}</p>
        <div style={{ display: 'flex', gap: 18, fontSize: 11, color: '#64748b', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>{p.kcal} kcal</span>
            <span>{p.pro}g pro</span>
            <span>{p.carbs}g carb</span>
            <span>{p.fiber}g fiber</span>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
            <button style={s.btnAdd} onClick={() => onAdd(p, 'added')}>Add to Diary</button>
            <button style={s.btnGen} onClick={() => onAdd(p, 'generated')}>Generate Day</button>
        </div>
    </div>
);

const RecipeRow = ({ r, onAdd }) => (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', margin: 0 }}>{r.name}</p>
            <span style={{ ...s.fitBadge, background: 'transparent', color: '#0ea5e9', fontWeight: 700 }}>{r.fit}%</span>
        </div>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 3px' }}>{r.meal}</p>
        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 8px' }}>{r.kcal} kcal · {r.protein}g protein · {r.prep} min prep</p>
        <div style={{ display: 'flex', gap: 7 }}>
            <button style={s.btnAdd} onClick={() => onAdd(r, 'added')}>Add to Diary</button>
            <button style={s.btnGen} onClick={() => onAdd(r, 'generated')}>Generate Day</button>
        </div>
    </div>
);

export default function DietRecommender() {
    useEffect(() => { document.title = 'Diet Recommender'; }, []);

    const submitting = useRef(false);
    const [recommendations, setRecommendations] = useState([]);
    const [enginePicks, setEnginePicks] = useState([]);
    const [recGoal, setRecGoal] = useState('Muscle Gain');

    const goalMap = {
        'Weight Loss': 'Weight Loss', 'Muscle Gain': 'Muscle Gain',
        'Maintenance': 'Maintenance', 'Gain Weight': 'Weight Loss',
    };

    const fetchEnginePicks = useCallback(async () => {
        try {
            const res = await API.post('/recommendation/diet-recommender', {
                goal: goalMap[recGoal] || recGoal, topK: 6, sortBy: 'protein g',
            }, { headers: headers() });
            setEnginePicks(res.data.results || []);
        } catch { setEnginePicks([]); }
    }, [recGoal]);

    const fetchRecommendations = useCallback(async () => {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const res = await API.get(`/diet-recommender?date=${today}`, { headers: headers() });
            setRecommendations(res.data.recommendations);
        } catch { setRecommendations([]); }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) { fetchEnginePicks(); fetchRecommendations(); }
    }, [fetchEnginePicks, fetchRecommendations]);

    const addRecommendation = async (item, action) => {
        if (submitting.current) return;
        submitting.current = true;
        try {
            const today = new Date().toISOString().slice(0, 10);
            await API.post('/diet-recommender', {
                name: item.name || item.food_name || '',
                brand: item.brand || '',
                fit_score: item.fit || 0,
                kcal: item.kcal || item.calories_per_serving || 0,
                protein: item.pro || item.protein_g || 0,
                carbs: item.carbs || item.carbs_g || 0,
                fiber: item.fiber || 0,
                meal_type: item.meal || '',
                date: today,
                action_taken: action,
            }, { headers: headers() });
            fetchRecommendations();
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    return (
        <DashboardLayout>
            <div style={s.page}>
                <div style={{ padding: '22px 0 16px' }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>Diet Recommender</h1>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Goal-aware food and recipe picks based on today's calories, macros, preferences, and allergy settings.</p>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Goal:</span>
                        {['Weight Loss', 'Muscle Gain', 'Maintenance'].map(g => (
                            <button key={g} type="button" onClick={() => setRecGoal(g)}
                                style={{
                                    borderRadius: 8, border: recGoal === g ? '1.5px solid #0f766e' : '1px solid #e2e8f0',
                                    padding: '6px 14px', fontSize: 12, fontWeight: 600,
                                    color: recGoal === g ? '#0f766e' : '#64748b',
                                    background: recGoal === g ? '#f0fdfa' : '#fff', cursor: 'pointer',
                                }}>{g}</button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {[
                        { label: 'Goal-aware picks',       color: '#0f766e', pct: 40 },
                        { label: 'Macro gap scoring',      color: '#3b82f6', pct: 58 },
                        { label: 'Allergy-aware filters',  color: '#f97316', pct: 80 },
                    ].map(b => (
                        <div key={b.label} style={{ ...s.card, padding: '12px 16px' }}>
                            <span style={{ display: 'inline-block', border: `1px solid ${b.color}`, color: b.color, fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, marginBottom: 8 }}>{b.label}</span>
                            <div style={{ height: 5, borderRadius: 999, background: '#e2e8f0' }}>
                                <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: 999 }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ ...s.card, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, border: '1px solid #bbf7d0' }}>Gain Weight plan</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                        { label: 'Protein', color: '#0ea5e9', cur: 0, goal: 95  },
                        { label: 'Calorie', color: '#f59e0b', cur: 0, goal: 347 },
                        { label: 'Fat',     color: '#14b8a6', cur: 0, goal: 76  },
                        { label: 'Fiber',   color: '#22c55e', cur: 0, goal: 34  },
                    ].map(m => (
                        <div key={m.label} style={{ ...s.card, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 5 }}>
                                <span>{m.label}</span><span>0%</span>
                            </div>
                            <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                                {m.cur} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>/ {m.goal}g</span>
                            </p>
                            <div style={{ height: 5, borderRadius: 999, background: '#e2e8f0' }}>
                                <div style={{ height: '100%', width: '0%', background: m.color, borderRadius: 999 }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 14 }}>
                    <div style={{ ...s.card, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                            <IconStar />
                            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Best food picks</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {(enginePicks.length ? enginePicks : MOCK_PICKS).map((p, i) => {
                                const fp = {
                                    id: p.id || i, name: p["food name"] || p.food_name || p.name || "Unknown", brand: p.brand || '',
                                    fit: p.fit || Math.round((p["protein g"] || p.protein_g || 0) / 40 * 100) || 85,
                                    note: p["recommendation reason"] || ` ${p["protein g"] || p.protein_g || 0}g protein · ${p["calories per serving"] || 0} kcal`,
                                    kcal: p["calories per serving"] || p.kcal || 0,
                                    pro: p["protein g"] || p.protein_g || p.pro || 0,
                                    carbs: p["carbs g"] || p.carbs_g || p.carbs || 0,
                                    fiber: p.fiber || 0,
                                };
                                return <FoodCard key={fp.id} p={fp} onAdd={addRecommendation} />;
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ ...s.card, padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                                <IconClock />
                                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Meal rhythm</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {MOCK_RHYTHM.map(r => (
                                    <div key={r.meal}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>{r.meal}</p>
                                                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{r.share}% target share</p>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#0ea5e9' }}>{r.kcal} kcal</span>
                                        </div>
                                        <div style={{ height: 4, borderRadius: 999, background: '#e2e8f0' }}>
                                            <div style={{ height: '100%', width: `${r.share}%`, background: '#0f766e', borderRadius: 999 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ ...s.card, padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <IconFlame />
                                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Watchouts</h2>
                            </div>
                            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 12px' }}>
                                <p style={{ fontSize: 12, color: '#c2410c', margin: 0 }}>No major nutrition warnings for the next meal.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ ...s.card, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <IconRecipe />
                            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Recipe matches</h2>
                        </div>
                        {MOCK_RECIPES.map(r => <RecipeRow key={r.name} r={r} onAdd={addRecommendation} />)}
                        {recommendations.length > 0 && (
                            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Today's saved picks ({recommendations.length})</p>
                                {recommendations.map(r => (
                                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span>{r.name}</span>
                                        <span style={{ color: r.action_taken === 'added' ? '#0f766e' : '#f59e0b' }}>{r.action_taken}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ ...s.card, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="2" x2="3" y2="22"/><path d="M7 2v10a4 4 0 008 0V2"/><line x1="11" y1="2" x2="11" y2="6"/>
                            </svg>
                            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Smart diet rules</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {MOCK_RULES.map((rule, i) => (
                                <div key={i} style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 8, padding: '12px 14px' }}>
                                    <p style={{ fontSize: 12, color: '#713f12', margin: 0, lineHeight: 1.6 }}>{rule}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
