import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Badge, EmptyState, PageHeader, Panel } from '../../componenets/Ui';
import { CheckCircle2, Plus, Trash2, Upload } from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const emptyItem = { name: '', quantity: 1, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export default function MealScan() {
    useEffect(() => { document.title = 'Meal Scan'; }, []);
    const navigate = useNavigate();

    const [view, setView] = useState('index');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [scans, setScans] = useState([]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const [date, setDate] = useState(todayStr);
    const [mealType, setMealType] = useState('lunch');
    const [items, setItems] = useState([{ ...emptyItem }]);

    const fetchScans = async () => {
        try {
            const res = await API.get('/meal-scan', { headers: headers() });
            setScans(res.data.scans || []);
        } catch { setScans([]); }
    };

    useEffect(() => {
        if (localStorage.getItem('token')) fetchScans();
    }, []);

    const uploadScan = async (e) => {
        e.preventDefault();
        if (!file || uploading) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await API.post('/meal-scan/upload', fd, { headers: { ...headers(), 'Content-Type': 'multipart/form-data' } });
            setImageUrl(res.data.url);
            setView('show');
        } catch {
            alert('Upload failed. Try again.');
        } finally {
            setUploading(false);
        }
    };

    const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
    const setItem = (idx, field, value) => {
        setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const confirmToDiary = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            if (imageUrl) {
                await API.post('/meal-scan', { image_url: imageUrl, date, meal_type: mealType }, { headers: headers() });
            }
            const foodItems = items
                .filter(i => i.name.trim())
                .map(i => ({ ...i, date, meal_type: mealType, entry_type: 'food' }));
            if (foodItems.length) {
                await API.post('/food-diary/batch', foodItems, { headers: headers() });
            }
            navigate('/dashboard/food-diary');
        } catch {
            alert('Failed to save. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (view === 'show' && imageUrl) {
        return (
            <DashboardLayout>
                <div className="dashPage"><div className="dashInner">
                    <PageHeader title="Meal Scan Result" subtitle="Review the photo, add food items, then confirm to diary." />
                    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '0.9fr 1.4fr' }}>
                        <Panel>
                            <img src={imageUrl} alt="Meal scan" style={{ width: '100%', borderRadius: '0.5rem', objectFit: 'cover' }} />
                        </Panel>
                        <Panel>
                            <form onSubmit={confirmToDiary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                    <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                                        Date
                                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                                            style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }} />
                                    </label>
                                    <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                                        Meal
                                        <select value={mealType} onChange={(e) => setMealType(e.target.value)}
                                            style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: '#fff', outline: 'none' }}>
                                            <option value="breakfast">Breakfast</option>
                                            <option value="lunch">Lunch</option>
                                            <option value="dinner">Dinner</option>
                                            <option value="snack">Snack</option>
                                        </select>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#020617', margin: 0 }}>Food items</h3>
                                    <button type="button" onClick={addItem}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#334155', background: '#fff', cursor: 'pointer' }}>
                                        <Plus size={14} /> Add item
                                    </button>
                                </div>

                                {items.map((item, idx) => (
                                    <div key={idx} style={{ border: '1px solid #f1f5f9', borderRadius: '0.5rem', padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Item {idx + 1}</span>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(idx)}
                                                    style={{ border: 'none', background: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', padding: '0' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                                                Name
                                                <input type="text" value={item.name} onChange={(e) => setItem(idx, 'name', e.target.value)} placeholder="e.g. Chicken breast"
                                                    style={{ borderRadius: '0.4rem', border: '1px solid #e2e8f0', padding: '0.4rem 0.6rem', fontSize: '0.8rem', outline: 'none' }} />
                                            </label>
                                            <div style={{ display: 'grid', gap: '0.4rem', gridTemplateColumns: 'repeat(6, 1fr)' }}>
                                                {[
                                                    { key: 'quantity', label: 'Qty', type: 'number', step: '0.1' },
                                                    { key: 'calories', label: 'Cal', type: 'number' },
                                                    { key: 'protein', label: 'Protein', type: 'number' },
                                                    { key: 'carbs', label: 'Carbs', type: 'number' },
                                                    { key: 'fat', label: 'Fat', type: 'number' },
                                                    { key: 'fiber', label: 'Fiber', type: 'number' },
                                                ].map(f => (
                                                    <label key={f.key} style={{ display: 'grid', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                                                        {f.label}
                                                        <input type={f.type} value={item[f.key]} step={f.step || '1'} min="0"
                                                            onChange={(e) => setItem(idx, f.key, Number(e.target.value))}
                                                            style={{ borderRadius: '0.4rem', border: '1px solid #e2e8f0', padding: '0.4rem 0.4rem', fontSize: '0.8rem', outline: 'none', width: '100%' }} />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button type="submit" disabled={submitting}
                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#0f766e', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: submitting ? 'default' : 'pointer' }}>
                                    <CheckCircle2 size={16} /> {submitting ? 'Saving...' : 'Confirm to diary'}
                                </button>
                            </form>
                        </Panel>
                    </div>
                </div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader title="Meal Scan" subtitle="Upload a meal photo, identify food items, and add them to your food diary." />
                <Panel>
                    <form onSubmit={uploadScan} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr auto', alignItems: 'flex-end' }}>
                        <label style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                            Meal image
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.75rem', fontSize: '0.875rem' }} />
                        </label>
                        <button type="submit" disabled={!file || uploading}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: file && !uploading ? '#0f766e' : '#94a3b8', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', border: 'none', cursor: file && !uploading ? 'pointer' : 'default' }}>
                            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload scan'}
                        </button>
                    </form>
                </Panel>
                <Panel>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0 }}>Scan history</h2>
                    {scans.length ? (
                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                            {scans.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9', padding: '0.75rem' }}>
                                    <img src={s.image_url} alt="" style={{ width: 60, height: 60, borderRadius: '0.5rem', objectFit: 'cover' }} />
                                    <div>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617', margin: 0 }}>{s.meal_type} — {s.date}</p>
                                        {s.notes && <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>{s.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No scans yet" text="Upload a meal image above." />
                    )}
                </Panel>
            </div></div>
        </DashboardLayout>
    );
}
