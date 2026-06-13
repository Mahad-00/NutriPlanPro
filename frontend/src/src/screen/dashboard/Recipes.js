import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, EmptyState, PageHeader, Panel } from '../../componenets/Ui';
import { Plus } from 'lucide-react';
import '../../styles/Recipes.css';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const dietTypes = ['balanced', 'vegetarian', 'vegan', 'keto', 'high_protein', 'low_carb', 'diabetic_friendly', 'heart_healthy', 'halal'];

export default function Recipes() {
    useEffect(() => { document.title = 'Recipes'; }, []);

    const [recipes, setRecipes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const submitting = useRef(false);
    const [form, setForm] = useState({
        title: '', category: '', diet_type: 'balanced', servings: 2,
        calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0,
        description: '',
    });
    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const fetchRecipes = useCallback(async () => {
        try {
            const res = await API.get('/recipes', { headers: headers() });
            setRecipes(res.data.recipes);
        } catch { setRecipes([]); }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) fetchRecipes();
    }, [fetchRecipes]);

    const save = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/recipes', {
                ...form,
                servings: Number(form.servings),
                calories: Number(form.calories), protein: Number(form.protein),
                carbs: Number(form.carbs), fat: Number(form.fat),
                sugar: Number(form.sugar), sodium: Number(form.sodium), fiber: Number(form.fiber),
            }, { headers: headers() });
            setRecipes(prev => [res.data.recipe, ...prev]);
            setForm({ title: '', category: '', diet_type: 'balanced', servings: 2, calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0, description: '' });
            setShowForm(false);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    if (showForm) {
        return (
            <DashboardLayout>
                <div className="dashPage"><div className="dashInner">
                    <PageHeader title="Create Recipe" subtitle="Add recipe details, nutrition, ingredients, and instructions." />
                    <Panel>
                        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                                <Field label="Title" value={form.title} onChange={(v) => set('title', v)} />
                                <Select label="Category" value={form.category} onChange={(v) => set('category', v)} options={categories.map(c => [c, c.charAt(0).toUpperCase() + c.slice(1)])} />
                                <Select label="Diet type" value={form.diet_type} onChange={(v) => set('diet_type', v)} options={dietTypes.map(d => [d, d.replaceAll('_', ' ')])} />
                                <Field label="Servings" value={form.servings} onChange={(v) => set('servings', v)} type="number" />
                                <Field label="Calories" value={form.calories} onChange={(v) => set('calories', v)} type="number" />
                                <Field label="Protein" value={form.protein} onChange={(v) => set('protein', v)} type="number" />
                                <Field label="Carbs" value={form.carbs} onChange={(v) => set('carbs', v)} type="number" />
                                <Field label="Fat" value={form.fat} onChange={(v) => set('fat', v)} type="number" />
                                <Field label="Sugar" value={form.sugar} onChange={(v) => set('sugar', v)} type="number" />
                                <Field label="Sodium" value={form.sodium} onChange={(v) => set('sodium', v)} type="number" />
                                <Field label="Fiber" value={form.fiber} onChange={(v) => set('fiber', v)} type="number" />
                            </div>
                            <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                                Description
                                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4}
                                    style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit"
                                    style={{ borderRadius: '0.5rem', background: '#0f766e', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
                                <button type="button" onClick={() => setShowForm(false)}
                                    style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </Panel>
                </div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader
                    title="Recipes"
                    subtitle="Save recipes, favorite meals, and add servings to diary or planner."
                    action={<button onClick={() => setShowForm(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                        <Plus size={16} /> New
                    </button>}
                />
                <Panel>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Recent records</h2>
                        <Badge tone="slate">{recipes.length} items</Badge>
                    </div>
                    {recipes.length ? (
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' }}>
                            {recipes.map(r => (
                                <div key={r.id} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                    <h3 style={{ fontWeight: 600, color: '#020617', margin: 0 }}>{r.title}</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0', lineHeight: '1.5rem' }}>{r.description || 'A practical NutriPlan Pro recipe built for balanced macros and repeatable weekly planning.'}</p>
                                    <Badge tone="teal" style={{ marginTop: '0.75rem' }}>recipes</Badge>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'flex', gap: '1rem' }}>
                                        <span>{r.calories} kcal</span>
                                        <span>{r.protein}g protein</span>
                                        <span>{r.fiber}g fiber</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No recipes yet" text="Create your first recipe with the New button above." />
                    )}
                </Panel>
            </div></div>
        </DashboardLayout>
    );
}

function Field({ label, value, onChange, type = 'text' }) {
    return (
        <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>
            {label}
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
                style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }} />
        </label>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>
            {label}
            <select value={value} onChange={(e) => onChange(Number(e.target.value) || e.target.value)}
                style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: '#fff', outline: 'none' }}>
                {options.map(([ov, ol]) => (
                    <option key={ov} value={ov}>{ol}</option>
                ))}
            </select>
        </label>
    );
}
