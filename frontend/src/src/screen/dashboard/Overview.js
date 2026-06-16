import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { CaloriesChart, MacroDonutChart, WaterChart, WeightProgressChart } from '../../componenets/Charts';
import { Badge, Panel } from '../../componenets/Ui';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Activity, Apple, Beef, Camera, Droplets, Flame, QrCode, Salad, Scale, Target, Utensils, Waves, ChevronRight, TrendingUp, Award, Clock } from 'lucide-react';
import '../../styles/Overview.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOCK_CHARTS = {
    calories: [
        { date: 'Mon', calories: 2100 },
        { date: 'Tue', calories: 1950 },
        { date: 'Wed', calories: 2320 },
        { date: 'Thu', calories: 1780 },
        { date: 'Fri', calories: 2010 },
        { date: 'Sat', calories: 460  },
        { date: 'Sun', calories: 1840 },
    ],
    macroSplit: [
        { name: 'Protein', value: 68, color: '#0ea5e9' },
        { name: 'Carbs',   value: 210, color: '#f59e0b' },
        { name: 'Fat',     value: 52, color: '#14b8a6' },
    ],
    weight: [
        { date: 'W1', weight: 54.2 },
        { date: 'W2', weight: 53.8 },
        { date: 'W3', weight: 53.5 },
        { date: 'W4', weight: 53.0 },
    ],
    water: [
        { date: 'Mon', water: 1800 }, { date: 'Tue', water: 2100 },
        { date: 'Wed', water: 1600 }, { date: 'Thu', water: 1900 },
        { date: 'Fri', water: 2200 }, { date: 'Sat', water: 1500 },
        { date: 'Sun', water: 1500 },
    ],
};

const MOCK_RECOMMENDED = [
    { id: 1, name: 'Chicken karahi',   calories: 430, protein: 34 },
    { id: 2, name: 'Protein shake',    calories: 210, protein: 32 },
    { id: 3, name: 'Grilled fish',     calories: 210, protein: 32 },
    { id: 4, name: 'Chicken breast',   calories: 165, protein: 31 },
    { id: 5, name: 'Homemade biryani', calories: 520, protein: 28 },
    { id: 6, name: 'Tuna',             calories: 132, protein: 28 },
];

const MOCK_GROCERY = [
    { id: 1, name: 'Chicken breast', quantity: 500, unit: 'g' },
    { id: 2, name: 'Mixed greens',   quantity: 1,   unit: 'bag' },
    { id: 3, name: 'Brown rice',     quantity: 1,   unit: 'kg' },
    { id: 4, name: 'Greek yogurt',   quantity: 2,   unit: 'cups' },
];

const MOCK_FRIENDS = [
    { id: 1, body: 'Shared a quick strength routine for clients who need low-equipment workouts.', user: { name: 'Coach Hamza' } },
    { id: 2, body: 'Completed 5 planned meals this week and stayed inside my target range.',       user: { name: 'Ayesha Khan'  } },
];

const quickLinks = [
    { to: '/dashboard/diet-recommender', icon: Target,   label: 'Generate Diet Plan', color: '#0f766e' },
    { to: '/dashboard/food-diary',       icon: Utensils, label: 'Food Diary',         color: '#0ea5e9' },
    { to: '/dashboard/barcode-scanner',  icon: QrCode,   label: 'Scan Barcode',       color: '#8b5cf6' },
    { to: '/dashboard/meal-scan',        icon: Camera,   label: 'Meal Photo Scan',    color: '#f59e0b' },
    { to: '/dashboard/water',            icon: Waves,    label: 'Log Water',          color: '#06b6d4' },
    { to: '/dashboard/progress',         icon: Scale,    label: 'Track Progress',     color: '#b91c1c' },
];

export default function Overview() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => { document.title = 'Dashboard'; }, []);

    const [charts, setCharts] = useState(MOCK_CHARTS);
    const [summary, setSummary] = useState(null);
    const [recommendedMeals] = useState(MOCK_RECOMMENDED);
    const [groceryReminders] = useState(MOCK_GROCERY);
    const [friendActivity]   = useState(MOCK_FRIENDS);
    const [progress, setProgress] = useState({ currentWeight: 53.0, targetWeight: 70.0 });

    const loadData = useCallback(async () => {
        try {
            const [foodRes, waterRes, weightRes] = await Promise.all([
                API.get('/food-diary/summary?days=7', { headers: headers() }),
                API.get('/water', { headers: headers() }),
                API.get('/progress?type=weight&per_page=50', { headers: headers() }),
            ]);

            const dailyCalories = foodRes.data.daily_calories || MOCK_CHARTS.calories;
            const macros = foodRes.data.today_macros || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
            const macroSplit = [
                { name: 'Protein', value: macros.protein, color: '#0ea5e9' },
                { name: 'Carbs',   value: macros.carbs,   color: '#f59e0b' },
                { name: 'Fat',     value: macros.fat,     color: '#14b8a6' },
            ];

            const goal = JSON.parse(localStorage.getItem('goal') || '{}');
            const calGoal = goal.calorie_goal || 2450;
            const protGoal = goal.protein_goal || 95;
            const carbGoal = goal.carb_goal || 347;
            const fatGoal = goal.fat_goal || 76;
            const fiberGoal = goal.fiber_goal || 34;

            const waterLogs = waterRes.data.logs || [];
            const waterByDay = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                waterByDay[dayNames[d.getDay()]] = 0;
            }
            for (const log of waterLogs) {
                const d = new Date(log.date + 'T00:00:00');
                const name = dayNames[d.getDay()];
                if (name in waterByDay) waterByDay[name] += log.ml || 0;
            }
            const waterChart = Object.entries(waterByDay).map(([date, water]) => ({ date, water }));

            const todayWater = waterLogs
                .filter(l => l.date === todayStr())
                .reduce((sum, l) => sum + (l.ml || 0), 0);

            const weightEntries = weightRes.data.entries || [];
            const weightChart = weightEntries
                .filter(e => e.weight != null)
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(e => ({ date: e.date.slice(5), weight: e.weight }));
            const latestWeight = weightEntries.length > 0
                ? weightEntries.reduce((a, b) => a.date > b.date ? a : b).weight || 53
                : 53;

            setCharts({
                calories: dailyCalories,
                macroSplit,
                weight: weightChart.length ? weightChart : MOCK_CHARTS.weight,
                water: waterChart,
            });
            setSummary({
                totals: macros,
                goal: { calories: calGoal, protein: protGoal, carbs: carbGoal, fat: fatGoal, fiber: fiberGoal },
                remainingCalories: Math.max(0, calGoal - macros.calories),
                netCalories: macros.calories,
                waterMl: todayWater,
                exerciseCalories: 0,
                entries: foodRes.data.today_entries || [],
                insights: [],
            });
            setProgress(p => ({ ...p, currentWeight: latestWeight }));
        } catch {
            setCharts(MOCK_CHARTS);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (user.is_admin) {
        return <Navigate to="/admin" replace />;
    }

    const s = summary || {
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        goal: { calories: 2450, protein: 95, carbs: 347, fat: 76, fiber: 34 },
        remainingCalories: 2450, netCalories: 0, waterMl: 0, exerciseCalories: 0,
        entries: [], insights: [],
    };
    const calPct = Math.min((s.totals.calories / s.goal.calories) * 100, 100);

    return (
        <DashboardLayout>
            <div className="dashPage">
                <div className="dashInner">

                    {/* ── Page Header ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0 }}>Today's Overview</h1>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.125rem' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <Link to="/dashboard/food-diary"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.375rem',
                                fontSize: '0.875rem', fontWeight: 600, color: '#fff',
                                background: '#0f766e', borderRadius: '0.5rem',
                                padding: '0.5rem 1rem', textDecoration: 'none',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#115e59'}
                            onMouseLeave={e => e.currentTarget.style.background = '#0f766e'}>
                            <Utensils size={16} /> Add Food
                        </Link>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))', marginBottom: '1.5rem' }}>
                        <StatCard2 icon={Flame}    label="Calories"     value={`${Math.round(s.totals.calories)}`}     sub={`${s.goal.calories} kcal target`}     color="#b91c1c" bg="#fef2f2" />
                        <StatCard2 icon={Activity} label="Remaining"    value={`${s.remainingCalories}`}               sub={`${s.netCalories} net`}               color="#0f766e" bg="#f0fdf4" />
                        <StatCard2 icon={Beef}     label="Protein"      value={`${Math.round(s.totals.protein)}g`}    sub={`${s.goal.protein}g target`}          color="#0ea5e9" bg="#f0f9ff" />
                        <StatCard2 icon={Droplets} label="Water"        value={`${(s.waterMl/1000).toFixed(1)}L`}     sub="Daily hydration"                      color="#06b6d4" bg="#ecfeff" />
                        <StatCard2 icon={Apple}    label="Carbs"        value={`${Math.round(s.totals.carbs)}g`}      sub={`${s.goal.carbs}g target`}            color="#f59e0b" bg="#fffbeb" />
                        <StatCard2 icon={Salad}    label="Fat"          value={`${Math.round(s.totals.fat)}g`}        sub={`${s.goal.fat}g target`}              color="#14b8a6" bg="#f0fdf4" />
                        <StatCard2 icon={Flame}    label="Exercise"     value={`${s.exerciseCalories}`}                sub="kcal burned"                         color="#ea580c" bg="#fff7ed" />
                        <StatCard2 icon={Scale}    label="Weight"       value={`${progress.currentWeight} kg`}         sub={`${progress.targetWeight} kg target`} color="#8b5cf6" bg="#f5f3ff" />
                    </div>

                    {/* ── Charts + Macros ── */}
                    <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1.5rem' }}>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Calories (7 days)</h2>
                                <Badge tone="teal">Weekly</Badge>
                            </div>
                            <CaloriesChart data={charts.calories} />
                        </Panel>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Award size={16} color="#0f766e" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Macro Progress</h2>
                            </div>
                            <MacroDonutChart data={charts.macroSplit} />
                            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                                {[
                                    ['Protein', s.totals.protein, s.goal.protein, '#0ea5e9'],
                                    ['Carbs',   s.totals.carbs,   s.goal.carbs,   '#f59e0b'],
                                    ['Fat',     s.totals.fat,     s.goal.fat,     '#14b8a6'],
                                    ['Fiber',   s.totals.fiber,   s.goal.fiber,   '#f97316'],
                                ].map(([label, value, goal, color]) => {
                                    const pct = Math.min((value / goal) * 100, 100);
                                    return (
                                        <div key={label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                                                <span style={{ fontWeight: 600, color: '#334155' }}>{label}</span>
                                                <span style={{ color: '#64748b' }}>{Math.round(value)} / {goal}g</span>
                                            </div>
                                            <div style={{ height: '0.375rem', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Panel>
                    </div>

                    {/* ── Today's Diary + Insights ── */}
                    <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1.5rem' }}>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Utensils size={16} color="#0ea5e9" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Today's Food Diary</h2>
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {s.entries.length
                                    ? s.entries.map(entry => (
                                        <div key={entry.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '0.5rem',
                                        }}>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617', margin: 0 }}>{entry.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.125rem 0 0', textTransform: 'capitalize' }}>{entry.meal_type}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#020617', margin: 0 }}>{Math.round(entry.calories)}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.125rem 0 0' }}>{Math.round(entry.protein)}g protein</p>
                                            </div>
                                        </div>
                                    ))
                                    : <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>No diary entries. Add your first meal!</div>
                                }
                            </div>
                        </Panel>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={16} color="#f59e0b" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Nutrition Insights</h2>
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {(s.insights || []).map(insight => (
                                    <div key={insight.message} style={{
                                        padding: '0.75rem', background: '#fffbeb', borderRadius: '0.5rem',
                                        borderLeft: '3px solid #f59e0b', fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5
                                    }}>
                                        {insight.message}
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>

                    {/* ── Active Plan + Workout + Quick Links ── */}
                    <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '1.5rem' }}>
                        <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={16} color="#0f766e" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Plan</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>No active plan selected</p>
                            <Link to="/dashboard/meal-planner" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                fontSize: '0.8rem', fontWeight: 600, color: '#0f766e',
                                textDecoration: 'none', marginTop: '0.75rem'
                            }}>Create a plan <ChevronRight size={14} /></Link>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={16} color="#0ea5e9" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today's Workout</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>No workout logged</p>
                            <Link to="/dashboard/workouts" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                fontSize: '0.8rem', fontWeight: 600, color: '#0ea5e9',
                                textDecoration: 'none', marginTop: '0.75rem'
                            }}>Log a workout <ChevronRight size={14} /></Link>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={16} color="#8b5cf6" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Actions</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                                {quickLinks.map(q => (
                                    <Link key={q.to} to={q.to} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                                        fontSize: '0.8rem', fontWeight: 600, color: q.color,
                                        textDecoration: 'none', padding: '0.375rem 0.5rem',
                                        borderRadius: '0.375rem', transition: 'background 0.1s'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <q.icon size={14} /> {q.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Recommended / Grocery / Friends ── */}
                    <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '1.5rem' }}>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Salad size={16} color="#0f766e" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recommended Meals</h2>
                            </div>
                            <div style={{ display: 'grid', gap: '0.375rem' }}>
                                {recommendedMeals.map(food => (
                                    <div key={food.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.5rem 0.625rem', background: '#f0fdf4', borderRadius: '0.375rem',
                                    }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617' }}>{food.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#0f766e' }}>{food.calories} kcal</span>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Apple size={16} color="#0ea5e9" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Grocery Reminders</h2>
                            </div>
                            {groceryReminders.length ? (
                                <div style={{ display: 'grid', gap: '0.375rem' }}>
                                    {groceryReminders.map(item => (
                                        <div key={item.id} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            padding: '0.5rem 0.625rem', background: '#f8fafc', borderRadius: '0.375rem',
                                            fontSize: '0.875rem'
                                        }}>
                                            <span style={{ fontWeight: 600, color: '#020617' }}>{item.name}</span>
                                            <span style={{ color: '#64748b' }}>{item.quantity} {item.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>No items.</p>}
                        </Panel>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={16} color="#ea580c" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Friend Activity</h2>
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {friendActivity.map(post => (
                                    <div key={post.id} style={{
                                        padding: '0.625rem', background: '#fff7ed', borderRadius: '0.375rem',
                                        fontSize: '0.8rem', color: '#9a3412', lineHeight: 1.5
                                    }}>
                                        <span style={{ fontWeight: 700, color: '#c2410c' }}>{post.user?.name ?? 'Friend'}: </span>
                                        {post.body}
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>

                    {/* ── Bottom Charts ── */}
                    <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1fr 1fr' }}>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={16} color="#8b5cf6" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Weight Progress</h2>
                            </div>
                            <WeightProgressChart data={charts.weight} />
                        </Panel>
                        <Panel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Droplets size={16} color="#06b6d4" />
                                </div>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Water & Exercise Trend</h2>
                            </div>
                            <WaterChart data={charts.water} />
                        </Panel>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard2({ icon: Icon, label, value, sub, color, bg }) {
    return (
        <div style={{
            background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
            padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={color} />
                </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0 }}>{value}</p>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.125rem 0 0' }}>{sub}</p>
        </div>
    );
}