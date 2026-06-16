import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../styles/Admin.css';
import { Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const API = axios.create({ baseURL: '/api' });
const h = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function AdminMealPlans() {
    const [plans, setPlans] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => { document.title = 'Admin Meal Plans'; }, []);

    useEffect(() => {
        setLoading(true);
        API.get(`/admin/meal-plans?page=${page}&per_page=20`, { headers: h() })
            .then(r => { setPlans(r.data.meal_plans); setTotal(r.data.total); setPages(Math.ceil(r.data.total / r.data.per_page)); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [page]);

    const del = (id) => {
        if (!window.confirm('Delete this meal plan?')) return;
        API.delete(`/admin/meal-plans/${id}`, { headers: h() })
            .then(() => setPlans(prev => prev.filter(p => p.id !== id)))
            .catch(err => alert(err.response?.data?.error || 'Delete failed.'));
    };

    return (
        <AdminLayout>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #0f766e, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Calendar size={20} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0 }}>Meal Plans</h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.125rem' }}>{total} meal plans</p>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                            {['Title', 'Starts', 'Ends', 'Duration', 'Calorie Target', 'Diet', 'Goal', 'Status', ''].map(h => (
                                <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#020617' }}>{p.title}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.starts_on}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.ends_on}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.duration_days}d</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.calorie_target} kcal</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b', textTransform: 'capitalize' }}>{p.dietary_preference}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b', textTransform: 'capitalize' }}>{p.goal_type?.replace('_', ' ')}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: p.is_active ? '#dcfce7' : '#f1f5f9', color: p.is_active ? '#166534' : '#64748b' }}>{p.is_active ? 'Active' : p.status}</span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <button onClick={() => del(p.id)}
                                        onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!plans.length && !loading && (
                            <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No meal plans found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: '0.875rem', fontWeight: 600, color: page <= 1 ? '#d1d5db' : '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontSize: '0.875rem', color: '#64748b', padding: '0.375rem 0.75rem' }}>Page {page} of {pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ fontSize: '0.875rem', fontWeight: 600, color: page >= pages ? '#d1d5db' : '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', cursor: page >= pages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
