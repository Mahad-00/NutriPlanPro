import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../styles/Admin.css';
import { ListOrdered, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const API = axios.create({ baseURL: '/api' });
const h = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function AdminWorkoutRoutines() {
    const [routines, setRoutines] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => { document.title = 'Admin Workout Routines'; }, []);

    useEffect(() => {
        setLoading(true);
        API.get(`/admin/workout-routines?page=${page}&per_page=20`, { headers: h() })
            .then(r => { setRoutines(r.data.workout_routines); setTotal(r.data.total); setPages(Math.ceil(r.data.total / r.data.per_page)); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [page]);

    const del = (id) => {
        if (!window.confirm('Delete this workout routine?')) return;
        API.delete(`/admin/workout-routines/${id}`, { headers: h() })
            .then(() => setRoutines(prev => prev.filter(r => r.id !== id)))
            .catch(err => alert(err.response?.data?.error || 'Delete failed.'));
    };

    return (
        <AdminLayout>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #0f766e, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <ListOrdered size={20} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0 }}>Workout Routines</h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.125rem' }}>{total} generated workout routines</p>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                            {['Name', 'Goal', 'Level', 'Exercises', ''].map(h => (
                                <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {routines.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#020617' }}>{r.name}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b', textTransform: 'capitalize' }}>{r.goal?.replace('_', ' ')}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b', textTransform: 'capitalize' }}>{r.level}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b', maxWidth: '20rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.exercises}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <button onClick={() => del(r.id)}
                                        onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!routines.length && !loading && (
                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No workout routines found.</td></tr>
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
