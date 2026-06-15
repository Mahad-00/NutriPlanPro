import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, EmptyState, PageHeader, Panel, ProgressBar } from '../../componenets/Ui';
import InputError from '../../componenets/InputError';
import { CalendarDays, CheckCircle2, Copy, Plus, RefreshCw, ShoppingBasket, Shuffle, SlidersHorizontal, Sparkles, Trash2, Utensils } from 'lucide-react';
import '../../styles/MealPlanner.css';

const goals = [['lose_weight', 'Lose weight'], ['maintain_weight', 'Maintain'], ['gain_weight', 'Gain weight'], ['build_muscle', 'Build muscle']];
const diets = ['balanced', 'vegetarian', 'vegan', 'keto', 'high_protein', 'low_carb', 'diabetic_friendly', 'heart_healthy', 'halal'];
const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const API = axios.create({ baseURL: '/api' });

function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const PREVIEW_TARGETS = {
    target_calories: 2450, protein_grams: 95, carbs_grams: 347, fat_grams: 76, water_ml: 2700,
};

const GOAL_MAP = {
    lose_weight: 'Weight Loss', maintain_weight: 'Maintenance',
    gain_weight: 'Muscle Gain', build_muscle: 'Muscle Gain',
};
const ACTIVITY_MAP = {
    sedentary: 'sedentary', lightly_active: 'light',
    moderately_active: 'moderate', very_active: 'active', athlete: 'very_active',
};

function getWeekDates(start) {
    const dates = [];
    const d = new Date(start);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    for (let i = 0; i < 7; i++) {
        const wd = new Date(d);
        wd.setDate(wd.getDate() + i);
        dates.push(wd);
    }
    return dates;
}
function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

export default function MealPlanner() {
    const navigate = useNavigate();
    useEffect(() => { document.title = 'Meal Planner'; }, []);

    const [view, setView] = useState('index');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [mealPlans, setMealPlans] = useState([]);
    const [onboardingData, setOnboardingData] = useState(null);
    const [calendarEntries, setCalendarEntries] = useState({});
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [generatingGroceries, setGeneratingGroceries] = useState(false);
    const submitting = useRef(false);

    const fetchPlans = useCallback(async () => {
        try {
            const res = await API.get('/meal-plans', { headers: headers() });
            setMealPlans(res.data.plans);
        } catch {
            setMealPlans([]);
        }
    }, []);

    const fetchOnboarding = useCallback(async () => {
        try {
            const res = await API.get('/auth/onboarding', { headers: headers() });
            setOnboardingData(res.data.detail);
        } catch {
            setOnboardingData(null);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) { fetchPlans(); fetchOnboarding(); }
    }, [fetchPlans, fetchOnboarding]);

    const activePlan = mealPlans.find(p => p.is_active);

    const [createForm, setCreateForm] = useState({
        title: '', start_date: new Date().toISOString().slice(0, 10), duration_days: 7,
        goal_type: 'lose_weight', dietary_preference: 'balanced', meals_per_day: 3,
        allergies: '', disliked_foods: '', preferred_cuisines: '', budget_level: 'medium',
        cooking_time_preference: 'moderate',
    });
    const cf = (field) => (value) => setCreateForm(prev => ({ ...prev, [field]: value }));

    const [editForm, setEditForm] = useState({ title: '', starts_on: '', notes: '', status: 'saved' });
    const ef = (field) => (value) => setEditForm(prev => ({ ...prev, [field]: value }));

    const generatePlan = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const profile = onboardingData;
            if (!profile) {
                alert('Please complete your profile onboarding first.');
                submitting.current = false;
                return;
            }
            const engineGoal = GOAL_MAP[createForm.goal_type] || 'Maintenance';
            const engineActivity = ACTIVITY_MAP[profile.activity_level] || 'moderate';

            const planRes = await API.post('/recommendation/personalized-plan', {
                weight_kg: profile.current_weight_kg,
                height_cm: profile.height_cm,
                age: profile.age,
                gender: profile.gender,
                activity_level: engineActivity,
                goal: engineGoal,
                region: createForm.preferred_cuisines || undefined,
            }, { headers: headers() });

            const { calorie_target, macro_targets, meal_plan: engineMealPlan } = planRes.data;

            const body = {
                title: createForm.title || 'Untitled plan',
                starts_on: createForm.start_date,
                ends_on: new Date(new Date(createForm.start_date).getTime() + createForm.duration_days * 86400000).toISOString().slice(0, 10),
                duration_days: Number(createForm.duration_days),
                calorie_target: Math.round(calorie_target),
                protein_target: Math.round(macro_targets?.protein_g || 0),
                carb_target: Math.round(macro_targets?.carbs_g || 0),
                fat_target: Math.round(macro_targets?.fat_g || 0),
                fiber_target: 30,
                status: 'generated',
                is_active: false,
                dietary_preference: createForm.dietary_preference,
                goal_type: createForm.goal_type,
                items_count: engineMealPlan?.meal_plan ? Object.keys(engineMealPlan.meal_plan).length : 0,
                notes: '',
            };
            const saveRes = await API.post('/meal-plans', body, { headers: headers() });
            const savedPlan = saveRes.data.plan;

            if (engineMealPlan?.meal_plan) {
                const startDate = new Date(createForm.start_date);
                const days = Number(createForm.duration_days);
                const mealTypeMap = { Breakfast: 'breakfast', Lunch: 'lunch', Dinner: 'dinner', Snack: 'snack' };
                for (let day = 0; day < days; day++) {
                    const cur = new Date(startDate);
                    cur.setDate(cur.getDate() + day);
                    const ds = fmtDate(cur);
                    for (const [label, food] of Object.entries(engineMealPlan.meal_plan)) {
                        if (!food) continue;
                        await API.post('/weekly-calendar', {
                            date: ds,
                            meal_type: mealTypeMap[label] || label.toLowerCase(),
                            name: food['food name'] || 'Meal',
                            calories: Math.round(food['calories per serving'] || 0),
                            protein: Math.round(food['protein g'] || 0),
                            carbs: Math.round(food['carbs g'] || 0),
                            fat: Math.round(food['fat g'] || 0),
                        }, { headers: headers() });
                    }
                }
                const weekStart = new Date(createForm.start_date);
                const ws = fmtDate(weekStart);
                const calRes = await API.get(`/weekly-calendar?week_start=${ws}`, { headers: headers() });
                setCalendarEntries(calRes.data.days || {});
            }

            setMealPlans(prev => [savedPlan, ...prev]);
            setSelectedPlan(savedPlan);
            setView('show');
        } catch (err) {
            console.error('Failed to generate plan', err);
        } finally {
            submitting.current = false;
        }
    };

    const openPlan = (plan) => {
        setSelectedPlan(plan);
        setView('show');
    };

    const editPlan = (plan) => {
        setSelectedPlan(plan);
        setEditForm({ title: plan.title, starts_on: plan.starts_on, notes: plan.notes || '', status: plan.status });
        setView('edit');
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.put(`/meal-plans/${selectedPlan.id}`, editForm, { headers: headers() });
            setMealPlans(prev => prev.map(p => p.id === selectedPlan.id ? res.data.plan : p));
            setSelectedPlan(res.data.plan);
            setView('show');
        } catch {
            /* error */
        } finally {
            submitting.current = false;
        }
    };

    const deletePlan = async (id) => {
        try {
            await API.delete(`/meal-plans/${id}`, { headers: headers() });
            setMealPlans(prev => prev.filter(p => p.id !== id));
            if (view === 'show') setView('index');
        } catch {
            /* error */
        }
    };

    const duplicatePlan = async (plan) => {
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/meal-plans', {
                title: plan.title + ' (copy)',
                starts_on: plan.starts_on,
                ends_on: plan.ends_on,
                duration_days: plan.duration_days,
                calorie_target: plan.calorie_target,
                protein_target: plan.protein_target,
                carb_target: plan.carb_target,
                fat_target: plan.fat_target,
                fiber_target: plan.fiber_target,
                status: 'saved',
                is_active: false,
                dietary_preference: plan.dietary_preference,
                goal_type: plan.goal_type,
                items_count: plan.items_count,
                notes: plan.notes,
            }, { headers: headers() });
            setMealPlans(prev => [res.data.plan, ...prev]);
        } catch {
            /* error */
        } finally {
            submitting.current = false;
        }
    };

    const activatePlan = async (plan) => {
        try {
            await API.post(`/meal-plans/activate/${plan.id}`, {}, { headers: headers() });
            setMealPlans(prev => prev.map(p => ({ ...p, is_active: p.id === plan.id })));
        } catch {
            /* error */
        }
    };

    const addToDiary = (item) => {
        /* no-op in mock */
    };

    const fetchCalendarForPlan = useCallback(async (plan) => {
        if (!plan) return;
        setCalendarLoading(true);
        try {
            const weekStart = new Date(plan.starts_on);
            const ws = fmtDate(weekStart);
            const res = await API.get(`/weekly-calendar?week_start=${ws}`, { headers: headers() });
            setCalendarEntries(res.data.days || {});
        } catch {
            setCalendarEntries({});
        } finally {
            setCalendarLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'show' && selectedPlan) {
            fetchCalendarForPlan(selectedPlan);
        }
    }, [view, selectedPlan, fetchCalendarForPlan]);

    const generateGroceries = async () => {
        if (!selectedPlan) return;
        setGeneratingGroceries(true);
        try {
            await API.post(`/meal-plans/${selectedPlan.id}/generate-grocery-list`, {}, { headers: headers() });
            navigate('/dashboard/grocery-list');
        } catch (err) {
            console.error('Failed to generate grocery list', err);
        } finally {
            setGeneratingGroceries(false);
        }
    };

    const target = Number(selectedPlan?.calorie_target || 1);

    if (view === 'create') {
        return (
            <DashboardLayout>
                <div className="dashPage"><div className="dashInner">
                    <PageHeader title="Generate Diet Plan" subtitle="Create a plan from your calorie target, macro target, diet preference, allergies, cooking time, and budget." />
                    <Panel>
                                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', background: '#115e59', borderRadius: '0.5rem', padding: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>
                                            {[['Calories', PREVIEW_TARGETS.target_calories], ['Protein', `${PREVIEW_TARGETS.protein_grams}g`], ['Carbs', `${PREVIEW_TARGETS.carbs_grams}g`], ['Fat', `${PREVIEW_TARGETS.fat_grams}g`], ['Water', `${Math.round(PREVIEW_TARGETS.water_ml / 1000)}L`]].map(([label, value]) => (
                                <div key={label} style={{ borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', padding: '0.75rem' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ccfbf1', margin: 0 }}>{label}</p>
                                    <p style={{ marginTop: '0.25rem', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{value}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={generatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                                <Field label="Plan title" value={createForm.title} onChange={cf('title')} />
                                <Field label="Start date" value={createForm.start_date} onChange={cf('start_date')} type="date" />
                                <Select label="Duration" value={createForm.duration_days} onChange={cf('duration_days')} options={[[1, '1 day'], [7, '7 days'], [30, '30 days']]} />
                                <Select label="Goal" value={createForm.goal_type} onChange={cf('goal_type')} options={goals} />
                                <Select label="Diet" value={createForm.dietary_preference} onChange={cf('dietary_preference')} options={diets.map(d => [d, d.replaceAll('_', ' ')])} />
                                <Select label="Meals per day" value={createForm.meals_per_day} onChange={cf('meals_per_day')} options={[[3, '3'], [4, '4'], [5, '5'], [6, '6']]} />
                            </div>
                            <details style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                <summary style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                                    <SlidersHorizontal size={16} /> Advanced preferences
                                </summary>
                                <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                                    <Field label="Allergies" value={createForm.allergies} onChange={cf('allergies')} />
                                    <Field label="Disliked foods" value={createForm.disliked_foods} onChange={cf('disliked_foods')} />
                                    <Field label="Preferred cuisines" value={createForm.preferred_cuisines} onChange={cf('preferred_cuisines')} />
                                    <Select label="Budget" value={createForm.budget_level} onChange={cf('budget_level')} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} />
                                    <Select label="Cooking time" value={createForm.cooking_time_preference} onChange={cf('cooking_time_preference')} options={[['quick', 'Quick'], ['moderate', 'Moderate'], ['flexible', 'Flexible']]} />
                                </div>
                            </details>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                                    <Sparkles size={16} /> Generate plan
                                </button>
                                <button type="button" onClick={() => setView('index')} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </Panel>
                </div></div>
            </DashboardLayout>
        );
    }

    if (view === 'show' && selectedPlan) {
        const plan = selectedPlan;
        return (
            <DashboardLayout>
                <div className="dashPage"><div className="dashInner">
                    <PageHeader
                        title={plan.title}
                        subtitle={`${plan.starts_on} to ${plan.ends_on} | ${plan.duration_days} days`}
                        action={<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button onClick={() => editPlan(plan)} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>Edit</button>
                            {!plan.is_active && <button onClick={() => activatePlan(plan)} style={{ borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>Mark active</button>}
                            <button onClick={() => setView('index')} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>Back</button>
                        </div>}
                    />

                    <Panel>
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', background: '#115e59', borderRadius: '0.5rem', padding: '1.5rem', color: '#fff' }}>
                            {[['Calories', plan.calorie_target], ['Protein', `${plan.protein_target}g`], ['Carbs', `${plan.carb_target}g`], ['Fat', `${plan.fat_target}g`], ['Fiber', `${plan.fiber_target}g`]].map(([label, value]) => (
                                <div key={label} style={{ borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', padding: '0.75rem' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ccfbf1', margin: 0 }}>{label}</p>
                                    <p style={{ marginTop: '0.25rem', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{value}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {plan.is_active && <Badge tone="yellow">Active plan</Badge>}
                            <Badge tone="teal">{plan.dietary_preference?.replaceAll('_', ' ')}</Badge>
                            <Badge tone="blue">{plan.goal_type?.replaceAll('_', ' ')}</Badge>
                        </div>
                    </Panel>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}><RefreshCw size={16} /> Regenerate full plan</button>
                        <button type="button" onClick={() => duplicatePlan(plan)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}><Copy size={16} /> Duplicate week</button>
                        <button type="button" onClick={generateGroceries} disabled={generatingGroceries} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#ea580c', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: generatingGroceries ? 'wait' : 'pointer', opacity: generatingGroceries ? 0.7 : 1 }}><ShoppingBasket size={16} /> {generatingGroceries ? 'Generating...' : 'Generate grocery list'}</button>
                        <button type="button" onClick={() => { deletePlan(plan.id); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', border: '1px solid #fecaca', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#b91c1c', background: '#fff', cursor: 'pointer' }}><Trash2 size={16} /> Delete</button>
                    </div>

                    {calendarLoading ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 }}>Loading meal plan...</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                            {getWeekDates(new Date(plan.starts_on)).map((dayDate, i) => {
                                const ds = fmtDate(dayDate);
                                const dayEntries = calendarEntries[ds] || [];
                                const dayTotals = dayEntries.reduce((s, e) => s + (e.calories || 0), 0);
                                const grouped = {};
                                dayEntries.forEach(e => {
                                    const mt = e.meal_type || 'meal';
                                    if (!grouped[mt]) grouped[mt] = [];
                                    grouped[mt].push(e);
                                });
                                return (
                                    <Panel key={ds}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617', margin: 0 }}>{DAY_NAMES[dayDate.getDay()]}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{dayTotals} kcal</p>
                                            </div>
                                        </div>
                                        <ProgressBar value={(dayTotals / target) * 100} />
                                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                                            {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                                                const items = grouped[mealType] || [];
                                                return (
                                                    <div key={`${ds}-${mealType}`} style={{ borderRadius: '0.5rem', border: '1px solid #f1f5f9', background: '#f8fafc', padding: '0.75rem' }}>
                                                        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Utensils size={16} color="#0f766e" />
                                                            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', margin: 0 }}>{mealLabels[mealType] || mealType}</p>
                                                        </div>
                                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                            {items.length ? items.map(item => (
                                                                <div key={item.id} style={{ borderRadius: '0.5rem', background: '#fff', padding: '0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617', margin: 0 }}>{item.name}</p>
                                                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>{Math.round(item.calories)} kcal | {Math.round(item.protein)}g protein</p>
                                                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                                                        <button type="button" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', background: '#fff', cursor: 'default' }}><CheckCircle2 size={12} /> Planned</button>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '0.5rem 0' }}>No meal</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Panel>
                                );
                            })}
                        </div>
                    )}
                </div></div>
            </DashboardLayout>
        );
    }

    if (view === 'edit' && selectedPlan) {
        return (
            <DashboardLayout>
                <div className="dashPage"><div className="dashInner">
                    <PageHeader title="Edit Meal Plan" subtitle="Update plan name, start date, status, and notes." />
                    <Panel>
                        <form onSubmit={saveEdit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
                            <Field label="Title" value={editForm.title} onChange={ef('title')} />
                            <Field label="Starts on" value={editForm.starts_on} onChange={ef('starts_on')} type="date" />
                            <Select label="Status" value={editForm.status} onChange={ef('status')} options={[['generated', 'Generated'], ['saved', 'Saved'], ['archived', 'Archived']]} />
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                                    Notes
                                    <textarea value={editForm.notes} onChange={e => ef('notes')(e.target.value)} rows={5}
                                        style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', gridColumn: '1 / -1' }}>
                                <button type="submit" style={{ borderRadius: '0.5rem', background: '#0f766e', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>Save plan</button>
                                <button type="button" onClick={() => setView('show')} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </Panel>
                </div></div>
            </DashboardLayout>
        );
    }

    /* ── Index view (default) ── */
    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader
                    title="Meal Planner"
                    subtitle="Generate, save, swap, duplicate, and activate diet plans built from your profile targets."
                    action={<button onClick={() => setView('create')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}><Plus size={16} /> Generate Diet Plan</button>}
                />

                {activePlan && (
                    <Panel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#115e59', borderRadius: '0.5rem', padding: '1.5rem', color: '#fff' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <Badge tone="yellow">Active plan</Badge>
                                    <h2 style={{ marginTop: '0.75rem', fontSize: '1.5rem', fontWeight: 600, margin: '0.75rem 0 0' }}>{activePlan.title}</h2>
                                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#ccfbf1' }}>{activePlan.starts_on} to {activePlan.ends_on}</p>
                                </div>
                                <button onClick={() => openPlan(activePlan)} style={{ borderRadius: '0.5rem', background: '#fff', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#115e59', border: 'none', cursor: 'pointer' }}>Open plan</button>
                            </div>
                        </div>
                    </Panel>
                )}

                <Panel>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Your plans</h2>
                        <Badge tone="slate">{mealPlans.length} plans</Badge>
                    </div>
                    {mealPlans.length ? (
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' }}>
                            {mealPlans.map(plan => (
                                <div key={plan.id} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: '#020617', margin: 0 }}>{plan.title}</h3>
                                            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>{plan.starts_on} to {plan.ends_on ?? 'open'}</p>
                                        </div>
                                        {plan.is_active ? <Badge tone="teal">Active</Badge> : <Badge tone="slate">{plan.status}</Badge>}
                                    </div>
                                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                        <span>{plan.duration_days ?? 7} days</span>
                                        <span>{plan.items_count ?? 0} meals</span>
                                        <span>{plan.calorie_target ?? 0} kcal</span>
                                    </div>
                                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <button onClick={() => openPlan(plan)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}><CalendarDays size={14} /> View</button>
                                        <button onClick={() => duplicatePlan(plan)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}><Copy size={14} /> Copy</button>
                                        <button onClick={() => deletePlan(plan.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderRadius: '0.5rem', border: '1px solid #fecaca', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', background: '#fff', cursor: 'pointer' }}><Trash2 size={14} /> Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No meal plans yet" text="Generate a 1, 7, or 30 day plan from your profile targets." />
                    )}
                </Panel>
            </div></div>
        </DashboardLayout>
    );
}

function Field({ label, value, error, onChange, type = 'text' }) {
    return (
        <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>
            {label}
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
                style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }} />
            <InputError message={error} />
        </label>
    );
}

function Select({ label, value, error, onChange, options }) {
    return (
        <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>
            {label}
            <select value={value} onChange={(e) => onChange(Number(e.target.value) || e.target.value)}
                style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: '#fff', outline: 'none' }}>
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>{optionLabel}</option>
                ))}
            </select>
            <InputError message={error} />
        </label>
    );
}
