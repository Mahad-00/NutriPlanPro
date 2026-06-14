import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, EmptyState, PageHeader, Panel } from '../../componenets/Ui';
import { Plus } from 'lucide-react';
import '../../styles/CustomFoods.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CustomFoods() {
    useEffect(() => { document.title = 'Custom Foods'; }, []);

    const [foods, setFoods] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const submitting = useRef(false);
    const [form, setForm] = useState({
        name: '', brand: '', barcode: '', serving_unit: 'serving',
        calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0,
        description: '',
    });
    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const fetchFoods = useCallback(async () => {
        try {
            const res = await API.get('/custom-foods', { headers: headers() });
            setFoods(res.data.foods);
        } catch { setFoods([]); }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) fetchFoods();
    }, [fetchFoods]);

    const save = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/custom-foods', {
                ...form,
                calories: Number(form.calories), protein: Number(form.protein),
                carbs: Number(form.carbs), fat: Number(form.fat),
                sugar: Number(form.sugar), sodium: Number(form.sodium), fiber: Number(form.fiber),
            }, { headers: headers() });
            setFoods(prev => [res.data.food, ...prev]);
            setForm({ name: '', brand: '', barcode: '', serving_unit: 'serving', calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0, description: '' });
            setShowForm(false);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    if (showForm) {
        return (
            <DashboardLayout>
                <div className="dashPage"><div className="dashInner">
                    <PageHeader title="Create Food" subtitle="Add barcode, serving, and custom nutrition values." />
                    <Panel>
                        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                                <Field label="Name" value={form.name} onChange={(v) => set('name', v)} />
                                <Field label="Brand" value={form.brand} onChange={(v) => set('brand', v)} />
                                <Field label="Barcode" value={form.barcode} onChange={(v) => set('barcode', v)} />
                                <Field label="Serving unit" value={form.serving_unit} onChange={(v) => set('serving_unit', v)} />
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
                    title="Custom Foods"
                    subtitle="Create local meals, barcode foods, and custom nutrition entries."
                    action={<button onClick={() => setShowForm(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                        <Plus size={16} /> New
                    </button>}
                />
                <Panel>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Recent records</h2>
                        <Badge tone="slate">{foods.length} items</Badge>
                    </div>
                    {foods.length ? (
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' }}>
                            {foods.map(f => (
                                <div key={f.id} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                    <h3 style={{ fontWeight: 600, color: '#020617', margin: 0 }}>{f.name}</h3>
                                    {f.brand && <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>{f.brand}</p>}
                                    {f.barcode && <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{f.barcode}</p>}
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'flex', gap: '1rem' }}>
                                        <span>{f.calories} kcal</span>
                                        <span>{f.protein}g protein</span>
                                        <span>{f.fiber}g fiber</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No custom foods yet" text="Create your first custom food with the New button above." />
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
