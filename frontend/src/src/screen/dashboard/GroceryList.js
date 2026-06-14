import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, EmptyState, PageHeader, Panel } from '../../componenets/Ui';
import { AlertTriangle, Download, Printer, ShoppingBasket, Target, Trash2 } from 'lucide-react';
import '../../styles/GroceryList.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const DIET_RULES = {
    vegan: { label: 'Vegan', keywords: ['chicken', 'beef', 'pork', 'mutton', 'fish', 'shrimp', 'egg', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'honey', 'mayonnaise'], msg: 'Not vegan-friendly' },
    vegetarian: { label: 'Vegetarian', keywords: ['chicken', 'beef', 'pork', 'mutton', 'fish', 'shrimp', 'lamb'], msg: 'Not vegetarian-friendly' },
    keto: { label: 'Keto', keywords: ['rice', 'bread', 'pasta', 'noodle', 'potato', 'sugar', 'flour', 'cereal', 'oat', 'corn', 'bean', 'lentil', 'chickpea'], msg: 'High-carb item — may not fit keto' },
    low_carb: { label: 'Low-Carb', keywords: ['rice', 'bread', 'pasta', 'noodle', 'potato', 'sugar', 'flour', 'cereal'], msg: 'High-carb item — may exceed low-carb limits' },
    diabetic_friendly: { label: 'Diabetic-Friendly', keywords: ['sugar', 'candy', 'chocolate', 'soda', 'syrup', 'cake', 'cookie', 'ice cream', 'jelly', 'jam', 'honey'], msg: 'Sugary item — may not suit diabetic-friendly plan' },
    heart_healthy: { label: 'Heart-Healthy', keywords: ['bacon', 'sausage', 'butter', 'cream', 'lard', 'fried', 'processed', 'soda'], msg: 'High sodium/fat — may not suit heart-healthy plan' },
    halal: { label: 'Halal', keywords: ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'gelatin'], msg: 'Not halal-friendly' },
};

const GOAL_RULES = {
    lose_weight: { keywords: ['fried', 'soda', 'candy', 'chocolate', 'cake', 'cookie', 'donut', 'chips', 'burger', 'pizza', 'ice cream', 'sugar', 'butter', 'cream'], msg: 'High-calorie item — may slow weight loss' },
    build_muscle: { keywords: [], msg: '' },
    gain_weight: { keywords: [], msg: '' },
    maintain_weight: { keywords: [], msg: '' },
};

function findConflicts(name, dietaryPreference, goalType) {
    const lower = name.toLowerCase();
    const conflicts = [];
    const dietRule = DIET_RULES[dietaryPreference];
    if (dietRule) {
        for (const kw of dietRule.keywords) {
            if (lower.includes(kw)) {
                conflicts.push({ type: 'diet', rule: dietRule.label, message: dietRule.msg });
                break;
            }
        }
    }
    const goalRule = GOAL_RULES[goalType];
    if (goalRule) {
        for (const kw of goalRule.keywords) {
            if (lower.includes(kw)) {
                conflicts.push({ type: 'goal', rule: goalType.replace('_', ' '), message: goalRule.msg });
                break;
            }
        }
    }
    return conflicts;
}

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Frozen', 'Bakery', 'Pantry', 'Spices', 'Beverages', 'Snacks', 'Other'];

export default function GroceryList() {
    useEffect(() => { document.title = 'Grocery List'; }, []);

    const [items, setItems] = useState([]);
    const [plans, setPlans] = useState([]);
    const [onboarding, setOnboarding] = useState(null);
    const submitting = useRef(false);
    const [form, setForm] = useState({ name: '', category: 'Produce', quantity: 1, unit: 'item' });
    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const [conflicts, setConflicts] = useState([]);
    const [addedConflicts, setAddedConflicts] = useState([]);
    const [itemFlags, setItemFlags] = useState({});

    const fetchItems = useCallback(async () => {
        try {
            const res = await API.get('/grocery-list', { headers: headers() });
            setItems(res.data.items);
        } catch { setItems([]); }
    }, []);

    const fetchPlans = useCallback(async () => {
        try {
            const res = await API.get('/meal-plans', { headers: headers() });
            setPlans(res.data.plans);
        } catch { setPlans([]); }
    }, []);

    const fetchOnboarding = useCallback(async () => {
        try {
            const res = await API.get('/auth/onboarding', { headers: headers() });
            setOnboarding(res.data.detail);
        } catch { setOnboarding(null); }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) { fetchItems(); fetchPlans(); fetchOnboarding(); }
    }, [fetchItems, fetchPlans, fetchOnboarding]);

    useEffect(() => {
        if (form.name.trim()) {
            setConflicts(findConflicts(form.name, onboarding?.dietary_preference, onboarding?.goal_type));
        } else {
            setConflicts([]);
        }
    }, [form.name, onboarding]);

    useEffect(() => {
        const flags = {};
        for (const item of items) {
            const itemConflicts = findConflicts(item.name, onboarding?.dietary_preference, onboarding?.goal_type);
            if (itemConflicts.length > 0) flags[item.id] = itemConflicts;
        }
        setItemFlags(flags);
    }, [items, onboarding]);

    const addItem = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/grocery-list', form, { headers: headers() });
            setItems(prev => [res.data.item, ...prev]);
            const itemConflicts = findConflicts(form.name, onboarding?.dietary_preference, onboarding?.goal_type);
            if (itemConflicts.length > 0) {
                setAddedConflicts(prev => [{ name: form.name, conflicts: itemConflicts }, ...prev].slice(0, 5));
                setTimeout(() => setAddedConflicts(prev => prev.filter(c => c.name !== form.name)), 6000);
            }
            setForm({ name: '', category: 'Produce', quantity: 1, unit: 'item' });
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    const togglePurchased = async (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        try {
            const res = await API.put(`/grocery-list/${id}`, { purchased: !item.purchased }, { headers: headers() });
            setItems(prev => prev.map(i => i.id === id ? res.data.item : i));
        } catch { /* error */ }
    };

    const deleteItem = async (id) => {
        try {
            await API.delete(`/grocery-list/${id}`, { headers: headers() });
            setItems(prev => prev.filter(i => i.id !== id));
        } catch { /* error */ }
    };

    const clearPurchased = async () => {
        try {
            await API.post('/grocery-list/clear-purchased', {}, { headers: headers() });
            setItems(prev => prev.filter(i => !i.purchased));
        } catch { /* error */ }
    };

    const generateFromPlan = async (plan) => {
        if (submitting.current) return;
        submitting.current = true;
        try {
            const names = [`${plan.title} - Meal Prep`];
            for (const name of names) {
                const res = await API.post('/grocery-list', { name, category: 'Frozen', quantity: 1, unit: 'serving', plan_id: plan.id }, { headers: headers() });
                setItems(prev => [res.data.item, ...prev]);
                const itemConflicts = findConflicts(name, onboarding?.dietary_preference, onboarding?.goal_type);
                if (itemConflicts.length > 0) {
                    setAddedConflicts(prev => [{ name, conflicts: itemConflicts }, ...prev].slice(0, 5));
                    setTimeout(() => setAddedConflicts(prev => prev.filter(c => c.name !== name)), 6000);
                }
            }
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    const activePlan = plans.find(p => p.is_active);
    const groups = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader
                    title="Grocery List"
                    subtitle="Generate grocery items from meal plans, group by category, check off purchases, print, or export CSV."
                    action={<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button type="button" onClick={() => window.print()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>
                            <Printer size={16} /> Print
                        </button>
                        <button type="button"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                            <Download size={16} /> CSV
                        </button>
                    </div>}
                />

                {(onboarding || activePlan) && (
                    <div style={{
                        background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10,
                        padding: '14px 18px', marginBottom: 14, display: 'flex', flexWrap: 'wrap',
                        gap: 12, alignItems: 'center',
                    }}>
                        <Target size={18} color="#0f766e" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f766e' }}>Current goals &amp; plan:</span>
                        {onboarding?.goal_type && (
                            <Badge tone="teal">{onboarding.goal_type.replace('_', ' ')}</Badge>
                        )}
                        {onboarding?.dietary_preference && (
                            <Badge tone="blue">{onboarding.dietary_preference.replace('_', ' ')}</Badge>
                        )}
                        {activePlan && (
                            <Badge tone="yellow">{activePlan.title}</Badge>
                        )}
                        {!onboarding && !activePlan && (
                            <span style={{ fontSize: 12, color: '#64748b' }}>Complete your profile to see goal tracking</span>
                        )}
                    </div>
                )}

                {addedConflicts.length > 0 && addedConflicts.map(ac => (
                    <div key={ac.name} style={{
                        background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                        padding: '10px 16px', marginBottom: 10, display: 'flex', alignItems: 'center',
                        gap: 8, fontSize: 13, color: '#991b1b',
                    }}>
                        <AlertTriangle size={16} color="#dc2626" />
                        <span><strong>"{ac.name}"</strong> — {ac.conflicts.map(c => c.message).join('; ')}</span>
                    </div>
                ))}

                <Panel>
                    <form onSubmit={addItem} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
                        <div>
                            <Field label="Name" value={form.name} onChange={(v) => set('name', v)} />
                            {conflicts.length > 0 && (
                                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {conflicts.map((c, i) => (
                                        <span key={i} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 3,
                                            fontSize: 11, fontWeight: 600, color: '#991b1b',
                                            background: '#fef2f2', border: '1px solid #fecaca',
                                            borderRadius: 6, padding: '3px 8px',
                                        }}>
                                            <AlertTriangle size={12} /> {c.message}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Select label="Category" value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES.map(c => [c, c])} />
                        <Field label="Quantity" value={form.quantity} onChange={(v) => set('quantity', Number(v))} type="number" />
                        <Field label="Unit" value={form.unit} onChange={(v) => set('unit', v)} />
                        <button type="submit"
                            style={{ alignSelf: 'flex-end', borderRadius: '0.5rem', background: '#0f766e', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>Add item</button>
                    </form>
                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {plans.map(plan => (
                            <button key={plan.id} type="button" onClick={() => generateFromPlan(plan)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ffedd5', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#c2410c', background: '#fff', cursor: 'pointer' }}>
                                <ShoppingBasket size={14} /> {plan.title}
                            </button>
                        ))}
                        <button type="button" onClick={clearPurchased}
                            style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>Clear purchased</button>
                    </div>
                </Panel>

                {items.length ? (
                    <div style={{ marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {onboarding && (
                            <>
                                <span style={{ fontSize: 12, color: '#64748b' }}>Goal check:</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 10px' }}>
                                    {Object.values(itemFlags).filter(f => f.length === 0).length || items.length} aligned
                                </span>
                                {Object.keys(itemFlags).length > 0 && (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 10px' }}>
                                        {Object.keys(itemFlags).length} flagged
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                ) : null}
                {items.length ? (
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(24rem, 1fr))' }}>
                        {Object.entries(groups).map(([category, categoryItems]) => (
                            <Panel key={category}>
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>{category}</h2>
                                    <Badge tone="slate">{categoryItems.length}</Badge>
                                </div>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {categoryItems.map(item => {
                                        const flags = itemFlags[item.id] || [];
                                        return (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', borderRadius: '0.5rem', border: flags.length ? '1px solid #fecaca' : '1px solid #f1f5f9', padding: '0.75rem', background: flags.length ? '#fff5f5' : '#fff' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, cursor: 'pointer', flex: 1 }}>
                                                <input type="checkbox" checked={item.purchased} onChange={() => togglePurchased(item.id)}
                                                    style={{ borderRadius: '0.25rem', border: '1px solid #cbd5e1', accentColor: '#0f766e' }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: item.purchased ? '#94a3b8' : '#020617', textDecoration: item.purchased ? 'line-through' : 'none', display: 'block' }}>
                                                        {item.name}
                                                    </span>
                                                    {flags.length > 0 && (
                                                        <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                            {flags.map((f, i) => (
                                                                <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                                                    <AlertTriangle size={10} /> {f.message}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                                {flags.length === 0 && onboarding && (
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>Goal-aligned</span>
                                                )}
                                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{Number(item.quantity).toFixed(1)} {item.unit}</span>
                                                <button onClick={() => deleteItem(item.id)} type="button"
                                                    style={{ borderRadius: '0.5rem', border: '1px solid #fecaca', padding: '0.5rem', color: '#b91c1c', background: 'none', cursor: 'pointer', display: 'flex' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </Panel>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="No grocery items" text="Generate a list from a meal plan or add a manual item." />
                )}
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
        </label>
    );
}