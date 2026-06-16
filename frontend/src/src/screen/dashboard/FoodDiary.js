import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, EmptyState, PageHeader, Panel, ProgressBar } from '../../componenets/Ui';
import InputError from '../../componenets/InputError';
import { Copy, Plus, Trash2, PieChart } from 'lucide-react';
import { MealBreakdownChart } from '../../componenets/Charts';
import '../../styles/FoodDiary.css';

const API = axios.create({ baseURL: '/api' });

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

const MOCK_FOODS = [
    { id: 1, name: 'Oatmeal', calories: 300, protein: 10 },
    { id: 2, name: 'Chicken breast', calories: 250, protein: 45 },
    { id: 3, name: 'Brown rice', calories: 216, protein: 5 },
    { id: 4, name: 'Apple', calories: 95, protein: 0.5 },
    { id: 5, name: 'Greek yogurt', calories: 150, protein: 15 },
];

const MOCK_RECIPES = [
    { id: 1, title: 'Quinoa bowl', calories: 420, protein: 18 },
    { id: 2, title: 'Salmon wrap', calories: 380, protein: 24 },
    { id: 3, title: 'Veggie stir-fry', calories: 310, protein: 14 },
];

function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function FoodDiary() {
    useEffect(() => { document.title = 'Food Diary'; }, []);

    const today = new Date().toISOString().slice(0, 10);
    const [date, setDate] = useState(today);
    const [entries, setEntries] = useState([]);
    const [form, setForm] = useState({
        meal_type: 'breakfast',
        entry_type: 'food',
        food_id: String(MOCK_FOODS[0]?.id ?? ''),
        recipe_id: '',
        custom_name: '',
        quantity: 1,
        serving_unit: 'serving',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const submitting = useRef(false);

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const fetchEntries = useCallback(async () => {
        try {
            const res = await API.get(`/food-diary?date=${date}`, { headers: headers() });
            setEntries(res.data.entries);
        } catch {
            setEntries([]);
        }
    }, [date]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) fetchEntries();
    }, [fetchEntries]);

    const totals = entries.reduce((acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        waterMl: 0,
        exerciseCalories: 0,
    }), { calories: 0, protein: 0, waterMl: 0, exerciseCalories: 0 });

    const goal = { calories: 2450, protein: 95, water: 2700 };

    const submit = async (event) => {
        event.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        setLoading(true);
        setErrors({});

        const name = form.entry_type === 'food'
            ? MOCK_FOODS.find(f => String(f.id) === form.food_id)?.name ?? ''
            : form.entry_type === 'recipe'
                ? MOCK_RECIPES.find(r => String(r.id) === form.recipe_id)?.title ?? ''
                : form.custom_name;

        const selectedFood = form.entry_type === 'food'
            ? MOCK_FOODS.find(f => String(f.id) === form.food_id) : null;
        const selectedRecipe = form.entry_type === 'recipe'
            ? MOCK_RECIPES.find(r => String(r.id) === form.recipe_id) : null;

        const payload = {
            date,
            meal_type: form.meal_type,
            entry_type: form.entry_type,
            name,
            quantity: Number(form.quantity),
            serving_unit: form.serving_unit,
            calories: form.entry_type === 'food' ? (selectedFood?.calories ?? 0)
                : form.entry_type === 'recipe' ? (selectedRecipe?.calories ?? 0)
                : Number(form.calories),
            protein: form.entry_type === 'food' ? (selectedFood?.protein ?? 0)
                : form.entry_type === 'recipe' ? (selectedRecipe?.protein ?? 0)
                : Number(form.protein),
            carbs: form.entry_type === 'custom' ? Number(form.carbs) : 0,
            fat: form.entry_type === 'custom' ? Number(form.fat) : 0,
            fiber: form.entry_type === 'custom' ? Number(form.fiber) : 0,
            notes: form.notes,
        };

        try {
            const res = await API.post('/food-diary', payload, { headers: headers() });
            setEntries(prev => [...prev, res.data.entry]);
            setForm(prev => ({ ...prev, custom_name: '', notes: '' }));
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setLoading(false);
            submitting.current = false;
        }
    };

    const deleteEntry = async (id) => {
        try {
            await API.delete(`/food-diary/${id}`, { headers: headers() });
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch {
            /* ignore */
        }
    };

    const copyYesterday = () => {
        /* no-op in mock */
    };

    const entriesByMeal = mealTypes.reduce((carry, meal) => {
        carry[meal] = entries.filter(e => e.meal_type === meal);
        return carry;
    }, {});

    return (
        <DashboardLayout>
            <div className="dashPage">
                <div className="dashInner">
                    <PageHeader
                        title="Food Diary"
                        subtitle="Log foods, recipes, custom entries, planned meals, water, and exercise by date."
                    />

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
                        <Stat label="Calories" value={`${Math.round(totals.calories)} / ${goal.calories}`} percent={(totals.calories / goal.calories) * 100} />
                        <Stat label="Protein" value={`${Math.round(totals.protein)}g / ${goal.protein}g`} percent={(totals.protein / goal.protein) * 100} color="#0ea5e9" />
                        <Stat label="Water" value={`0ml / ${goal.water}ml`} percent={0} color="#0284c7" />
                        <Stat label="Exercise" value={`${totals.exerciseCalories} kcal`} percent={0} color="#f97316" />
                    </div>

                    <Panel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                            <PieChart size={16} />
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Calorie breakdown by meal</h2>
                        </div>
                        {(() => {
                            const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
                            const breakdown = mealTypes
                                .filter(m => entriesByMeal[m].length)
                                .map(m => ({
                                    meal: mealLabels[m] || m,
                                    calories: entriesByMeal[m].reduce((s, e) => s + Number(e.calories || 0), 0),
                                }));
                            return breakdown.length ? <MealBreakdownChart data={breakdown} /> : <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No entries today yet.</p>;
                        })()}
                    </Panel>

                    <Panel>
                        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem' }}>
                            <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                                Date
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                                    style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
                            </label>
                            <button onClick={copyYesterday} type="button"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', background: '#fff', cursor: 'pointer' }}>
                                <Copy size={16} /> Copy yesterday
                            </button>
                        </div>
                        <form onSubmit={submit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                            <Select label="Meal" value={form.meal_type} error={errors.meal_type} onChange={(v) => set('meal_type', v)} options={mealTypes.map(m => [m, m])} />
                            <Select label="Type" value={form.entry_type} error={errors.entry_type} onChange={(v) => set('entry_type', v)} options={[['food', 'Food'], ['recipe', 'Recipe'], ['custom', 'Custom']]} />
                            {form.entry_type === 'food' && (
                                <Select label="Food" value={form.food_id} error={errors.food_id} onChange={(v) => set('food_id', v)}
                                    options={MOCK_FOODS.map(f => [String(f.id), `${f.name} (${Math.round(f.calories)} kcal)`])} />
                            )}
                            {form.entry_type === 'recipe' && (
                                <Select label="Recipe" value={form.recipe_id} error={errors.recipe_id} onChange={(v) => set('recipe_id', v)}
                                    options={MOCK_RECIPES.map(r => [String(r.id), `${r.title} (${Math.round(r.calories)} kcal)`])} />
                            )}
                            {form.entry_type === 'custom' && (
                                <Field label="Custom name" value={form.custom_name} error={errors.custom_name} onChange={(v) => set('custom_name', v)} />
                            )}
                            {errors.name && <p style={{ color: '#dc2626', fontSize: '0.8rem', gridColumn: '1 / -1' }}>{errors.name}</p>}
                            <Field label="Quantity" value={form.quantity} error={errors.quantity} onChange={(v) => set('quantity', Number(v))} type="number" />
                            <Field label="Serving unit" value={form.serving_unit} error={errors.serving_unit} onChange={(v) => set('serving_unit', v)} />
                            {form.entry_type === 'custom' && ['calories', 'protein', 'carbs', 'fat', 'fiber'].map(field => (
                                <Field key={field} label={field} value={form[field]} error={errors[field]} onChange={(v) => set(field, Number(v))} type="number" />
                            ))}
                            <button type="submit" disabled={loading}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', gridColumn: '1 / -1' }}>
                                <Plus size={16} /> {loading ? 'Adding...' : 'Add entry'}
                            </button>
                        </form>
                    </Panel>

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))' }}>
                        {mealTypes.map(meal => (
                            <Panel key={meal}>
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0, textTransform: 'capitalize' }}>{meal === 'snack' ? 'Snacks' : meal}</h2>
                                    <Badge tone="slate">{entriesByMeal[meal].length}</Badge>
                                </div>
                                {entriesByMeal[meal].length ? (
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {entriesByMeal[meal].map(entry => (
                                            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9', padding: '0.75rem' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: '#020617', margin: 0 }}>{entry.name}</p>
                                                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>{Math.round(entry.calories)} kcal | {Math.round(entry.protein)}g protein</p>
                                                </div>
                                                <button onClick={() => deleteEntry(entry.id)} type="button"
                                                    style={{ borderRadius: '0.5rem', border: '1px solid #fecaca', padding: '0.5rem', color: '#b91c1c', background: 'none', cursor: 'pointer', display: 'flex' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title="No entries" text="Add a food, recipe, custom entry, or planned meal." />
                                )}
                            </Panel>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Stat({ label, value, percent, color = '#14b8a6' }) {
    return (
        <Panel>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0 }}>{label}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#020617' }}>{value}</p>
            <ProgressBar value={percent} color={color} />
        </Panel>
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
            <select value={value} onChange={(e) => onChange(e.target.value)}
                style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: '#fff', outline: 'none' }}>
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>{optionLabel}</option>
                ))}
            </select>
            <InputError message={error} />
        </label>
    );
}
