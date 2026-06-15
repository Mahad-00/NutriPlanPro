import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, EmptyState, PageHeader, Panel } from '../../componenets/Ui';
import InputError from '../../componenets/InputError';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CheckCircle2, ScanLine, Trash2 } from 'lucide-react';
import '../../styles/BarcodeScanner.css';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const RECENT_DEFAULTS = [
    { name: 'Nature Valley Granola Bar', barcode: '016000123456' },
    { name: 'Kellogg Corn Flakes', barcode: '038000123456' },
    { name: 'Tofu', barcode: '111000000027' },
    { name: 'Avocado', barcode: '111000000028' },
    { name: 'Turkey slices', barcode: '111000000029' },
    { name: 'Pasta', barcode: '111000000030' },
    { name: 'Spinach', barcode: '111000000031' },
    { name: 'Cucumber', barcode: '111000000032' },
    { name: 'Tomato', barcode: '111000000033' },
    { name: 'Cottage cheese', barcode: '111000000034' },
    { name: 'Peanut butter', barcode: '111000000035' },
    { name: 'Black coffee', barcode: '111000000036' },
    { name: 'Chicken karahi', barcode: '111000000037' },
    { name: 'Daal chawal', barcode: '111000000038' },
    { name: 'Greek yogurt', barcode: '111000000039' },
    { name: 'Almond milk', barcode: '111000000040' },
    { name: 'Protein bar', barcode: '111000000041' },
    { name: 'Oatmeal', barcode: '111000000042' },
    { name: 'Whole wheat bread', barcode: '111000000043' },
    { name: 'Biryani', barcode: '111000000044' },
    { name: 'Nihari', barcode: '111000000045' },
    { name: 'Haleem', barcode: '111000000046' },
    { name: 'Chicken tikka', barcode: '111000000047' },
    { name: 'Samosa', barcode: '111000000048' },
    { name: 'Lassi', barcode: '111000000049' },
    { name: 'Chapati', barcode: '111000000050' },
    { name: 'Seekh kebab', barcode: '111000000051' },
];

const RECENT_MAP = Object.fromEntries(RECENT_DEFAULTS.map(f => [f.barcode, f.name]));

const MOCK_EXTERNAL = {
    name: 'Nature Valley Granola Bar Oats N Honey', brand: 'Nature Valley', barcode: '016000123456',
    serving_size: 1, serving_unit: 'bar', calories: 190, protein: 3, carbs: 29, fat: 7, fiber: 2,
};

export default function BarcodeScanner() {
    useEffect(() => { document.title = 'Barcode Scanner'; }, []);

    const videoRef = useRef(null);
    const [status, setStatus] = useState('Ready to scan');
    const [lookup, setLookup] = useState(null);
    const [barcode, setBarcode] = useState('');
    const [barcodeFoods, setBarcodeFoods] = useState([]);
    const [form, setForm] = useState({
        barcode: '', name: '', brand: '', serving_size: 1, serving_unit: 'serving',
        calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
    });
    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const addingToDiary = useRef(false);

    const fetchBarcodeFoods = useCallback(async () => {
        try {
            const res = await API.get('/barcode-foods', { headers: headers() });
            setBarcodeFoods(res.data.barcode_foods || []);
        } catch {
            setBarcodeFoods([]);
        }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) fetchBarcodeFoods();
    }, [fetchBarcodeFoods]);

    const scan = async () => {
        if (!videoRef.current) return;
        setStatus('Opening camera');
        const reader = new BrowserMultiFormatReader();
        try {
            const result = await reader.decodeOnceFromVideoDevice(undefined, videoRef.current);
            const text = result.getText();
            setStatus('Barcode found: ' + text);
            setBarcode(text);
            lookupBarcode(text);
        } catch {
            setStatus('Camera unavailable or no barcode detected');
        }
    };

    const lookupBarcode = async (code) => {
        setBarcode(code);
        try {
            const res = await API.get(`/barcode-foods`, { headers: headers() });
            const saved = res.data.barcode_foods || [];
            const match = saved.find(f => f.barcode === code);
            if (match) {
                setLookup({ food: match, external: null });
                setForm(prev => ({ ...prev, barcode: code, ...match }));
                setStatus('Found in your saved barcode foods');
                return;
            }
        } catch { /* ignore */ }

        const defaultName = RECENT_MAP[code];
        if (defaultName) {
            const food = { id: 0, name: defaultName, calories: 0, serving_unit: 'serving', serving_size: 1, protein: 0, carbs: 0, fat: 0, fiber: 0 };
            setLookup({ food, external: null });
            setForm(prev => ({ ...prev, barcode: code, name: defaultName, brand: '', serving_size: 1, serving_unit: 'serving', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }));
            setStatus('Local match found');
            try {
                await API.post('/barcode-foods', {
                    barcode: code, name: defaultName, brand: '', serving_size: 1, serving_unit: 'serving',
                    calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
                }, { headers: headers() });
                fetchBarcodeFoods();
            } catch { /* ignore */ }
        } else {
            setLookup({ food: null, external: null, message: 'No match found for this barcode.' });
            setForm(prev => ({ ...prev, barcode: code }));
        }
    };

    const importFood = async (e) => {
        e.preventDefault();
        try {
            await API.post('/barcode-foods', { ...form, barcode: form.barcode || barcode }, { headers: headers() });
            setLookup(null);
            setStatus('Imported and saved successfully');
            fetchBarcodeFoods();
        } catch {
            setStatus('Import failed');
        }
    };

    const addToDiary = async () => {
        if (addingToDiary.current) return;
        addingToDiary.current = true;
        try {
            const today = new Date().toISOString().slice(0, 10);
            const food = lookup?.food;
            await API.post('/food-diary', {
                date: today,
                meal_type: 'snack',
                entry_type: 'barcode',
                name: food?.name || 'Unknown',
                quantity: 1,
                serving_unit: food?.serving_unit || 'serving',
                calories: food?.calories || 0,
                protein: food?.protein || 0,
                carbs: food?.carbs || 0,
                fat: food?.fat || 0,
                fiber: food?.fiber || 0,
            }, { headers: headers() });
            setStatus('Added to diary');
        } catch {
            setStatus('Failed to add to diary');
        } finally {
            addingToDiary.current = false;
        }
    };

    const deleteBarcodeFood = async (id) => {
        try {
            await API.delete(`/barcode-foods/${id}`, { headers: headers() });
            setBarcodeFoods(prev => prev.filter(f => f.id !== id));
        } catch { /* ignore */ }
    };

    const allRecent = barcodeFoods.length > 0 ? barcodeFoods : RECENT_DEFAULTS.map((f, i) => ({ ...f, id: -(i + 1) }));

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader
                    title="Barcode Scanner"
                    subtitle="Scan packaged foods, check local matches first, optionally import OpenFoodFacts results, then add to your diary."
                />

                <Panel>
                    <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1.1fr 0.9fr' }}>
                        <div style={{ overflow: 'hidden', borderRadius: '0.5rem', background: '#020617' }}>
                            <video ref={videoRef} style={{ aspectRatio: '16 / 9', width: '100%', objectFit: 'cover' }} muted />
                        </div>
                        <div>
                            <button onClick={scan} type="button"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                                <ScanLine size={16} /> Scan barcode
                            </button>
                            <form onSubmit={(e) => { e.preventDefault(); lookupBarcode(barcode); }} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Enter barcode"
                                    style={{ flex: 1, minWidth: 0, borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }} />
                                <button type="submit"
                                    style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>Lookup</button>
                            </form>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>{status}</p>
                            {lookup?.message && (
                                <p style={{ marginTop: '0.5rem', borderRadius: '0.5rem', background: '#fff7ed', padding: '0.75rem', fontSize: '0.875rem', color: '#c2410c' }}>{lookup.message}</p>
                            )}
                            {lookup?.food && (
                                <div style={{ marginTop: '1rem', borderRadius: '0.5rem', background: '#f0fdfa', padding: '1rem' }}>
                                    <Badge tone="teal">Local match</Badge>
                                    <h2 style={{ marginTop: '0.5rem', fontWeight: 600, color: '#020617', fontSize: '1rem' }}>{lookup.food.name}</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#0f766e' }}>{Math.round(lookup.food.calories)} kcal per {lookup.food.serving_unit}</p>
                                    <button onClick={addToDiary} type="button"
                                        style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                                        <CheckCircle2 size={14} /> Add to diary
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Panel>

                {lookup?.external && (
                    <Panel>
                        <div style={{ marginBottom: '1rem' }}>
                            <Badge tone="blue">External result</Badge>
                            <h2 style={{ marginTop: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: '#020617' }}>Confirm imported product</h2>
                        </div>
                        <form onSubmit={importFood} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                            {['name', 'brand', 'barcode', 'serving_unit'].map(field => (
                                <Field key={field} label={field.replace('_', ' ')} value={form[field]} onChange={(v) => set(field, v)} />
                            ))}
                            {['serving_size', 'calories', 'protein', 'carbs', 'fat', 'fiber'].map(field => (
                                <Field key={field} label={field.replace('_', ' ')} value={form[field]} onChange={(v) => set(field, Number(v))} type="number" />
                            ))}
                            <button type="submit"
                                style={{ borderRadius: '0.5rem', background: '#0f766e', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', gridColumn: '1 / -1' }}>Import food</button>
                        </form>
                    </Panel>
                )}

                <Panel>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Recent barcode foods</h2>
                    {allRecent.length ? (
                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                            {allRecent.map(food => (
                                <div key={food.id} style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#020617', margin: 0 }}>{food.name}</p>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>{food.barcode}</p>
                                    </div>
                                    {food.id > 0 && (
                                        <button type="button" onClick={() => deleteBarcodeFood(food.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No barcode foods" text="Scanned and imported foods will appear here." />
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
