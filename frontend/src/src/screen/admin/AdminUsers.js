import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../styles/Admin.css';
import { Trash2, Users as UsersIcon, Search, Download, ChevronLeft, ChevronRight, RefreshCw, CheckSquare, Check, X } from 'lucide-react';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

const shimmerStyle = `
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
`;

const Skeleton = ({ width = '100%', height = '1rem', style = {} }) => (
    <div style={{ width, height, borderRadius: '0.375rem', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', ...style }} />
);

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [checked, setChecked] = useState([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { document.title = 'Admin Users'; }, []);

    useEffect(() => { loadUsers(); }, [page, sortBy, sortDir]);

    const loadUsers = () => {
        setLoading(true);
        API.get(`/admin/users?page=${page}&per_page=15&sort_by=${sortBy}&sort_dir=${sortDir}${search ? `&search=${encodeURIComponent(search)}` : ''}`, { headers: headers() })
            .then(r => { setUsers(r.data.users); setTotal(r.data.total); setPages(r.data.pages); })
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    };

    const doSearch = () => { setPage(1); loadUsers(); };

    const toggleSort = (col) => {
        if (sortBy === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
        else { setSortBy(col); setSortDir('desc'); }
    };

    const doDelete = () => {
        if (!confirmDelete) return;
        setDeleting(true);
        API.delete(`/admin/users/${confirmDelete.id}`, { headers: headers() })
            .then(() => { setConfirmDelete(null); loadUsers(); })
            .catch(err => alert(err.response?.data?.error || 'Delete failed.'))
            .finally(() => setDeleting(false));
    };

    const toggleCheck = (id) => {
        setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (checked.length === users.length) { setChecked([]); }
        else { setChecked(users.map(u => u.id)); }
    };

    const bulkDelete = () => {
        if (!checked.length) return;
        if (!window.confirm(`Delete ${checked.length} selected users? This cannot be undone.`)) return;
        setBulkDeleting(true);
        API.post('/admin/users/bulk-delete', { user_ids: checked }, { headers: headers() })
            .then(() => { setChecked([]); loadUsers(); })
            .catch(err => alert(err.response?.data?.error || 'Bulk delete failed.'))
            .finally(() => setBulkDeleting(false));
    };

    const exportCsv = () => {
        window.open(`/api/admin/users/export?token=${localStorage.getItem('token')}`, '_blank');
    };

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <span style={{ color: '#d1d5db', marginLeft: '0.25rem', fontSize: '0.7rem' }}>&#8597;</span>;
        return <span style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
    };

    return (
        <AdminLayout>
            <style>{shimmerStyle}</style>
            <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeInUp 0.3s ease-out' }}>
                {/* Header */}
                <div style={{
                    marginBottom: '1.5rem', padding: '1.5rem 2rem',
                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
                    borderRadius: '1rem', boxShadow: '0 4px 20px rgba(15, 118, 110, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <UsersIcon size={28} color="#fff" />
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>Users</h1>
                            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.125rem' }}>{total} registered users</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => { setRefreshing(true); loadUsers(); setRefreshing(false); }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,1)'; e.currentTarget.style.color = '#0f766e'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' }}>
                            <RefreshCw size={16} /> Refresh
                        </button>
                        <button onClick={exportCsv}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,1)'; e.currentTarget.style.color = '#0f766e'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' }}>
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Search + Bulk Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '14rem', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doSearch()}
                            placeholder="Search name or email..."
                            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', outline: 'none', boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,.02)' }}
                            onFocus={e => { e.target.style.borderColor = '#0f766e'; e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.1)'; }}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,.02)'; }}
                        />
                    </div>
                    <button onClick={doSearch}
                        onMouseEnter={e => e.currentTarget.style.background = '#115e59'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0f766e'}
                        style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', background: '#0f766e', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Search size={16} /> Search
                    </button>
                    {checked.length > 0 && (
                        <button onClick={bulkDelete} disabled={bulkDeleting}
                            onMouseEnter={e => { if (!bulkDeleting) e.currentTarget.style.background = '#dc2626'; }}
                            onMouseLeave={e => { if (!bulkDeleting) e.currentTarget.style.background = '#b91c1c'; }}
                            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', background: bulkDeleting ? '#94a3b8' : '#b91c1c', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: bulkDeleting ? 'not-allowed' : 'pointer', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Trash2 size={16} /> {bulkDeleting ? 'Deleting...' : `Delete ${checked.length} selected`}
                        </button>
                    )}
                </div>

                {/* Users Table */}
                <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                    <th style={{ padding: '0.875rem 0.5rem', width: '2.5rem', borderBottom: '2px solid #e2e8f0' }}>
                                        <input type="checkbox" checked={checked.length === users.length && users.length > 0} onChange={toggleAll}
                                            style={{ cursor: 'pointer', accentColor: '#0f766e' }} />
                                    </th>
                                    <th style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }} onClick={() => toggleSort('name')}>
                                        Name<SortIcon col="name" />
                                    </th>
                                    <th style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }} onClick={() => toggleSort('email')}>
                                        Email<SortIcon col="email" />
                                    </th>
                                    <th style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plans</th>
                                    <th style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Diary</th>
                                    <th style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scans</th>
                                    <th style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Onboard</th>
                                    <th style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }} onClick={() => toggleSort('created_at')}>
                                        Joined<SortIcon col="created_at" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.875rem 0.5rem', textAlign: 'center' }}><Skeleton width="1rem" height="1rem" /></td>
                                            <td style={{ padding: '0.875rem 1rem' }}><Skeleton width="10rem" height="1rem" /></td>
                                            <td style={{ padding: '0.875rem 1rem' }}><Skeleton width="14rem" height="1rem" /></td>
                                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}><Skeleton width="2rem" height="1rem" style={{ margin: '0 auto' }} /></td>
                                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}><Skeleton width="2rem" height="1rem" style={{ margin: '0 auto' }} /></td>
                                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}><Skeleton width="2rem" height="1rem" style={{ margin: '0 auto' }} /></td>
                                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}><Skeleton width="1.5rem" height="1rem" style={{ margin: '0 auto', borderRadius: '50%' }} /></td>
                                            <td style={{ padding: '0.875rem 1rem' }}><Skeleton width="6rem" height="1rem" /></td>
                                        </tr>
                                    ))
                                ) : users.map((u, idx) => (
                                    <tr key={u.id}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '0.875rem 0.5rem', textAlign: 'center' }}>
                                            <input type="checkbox" checked={checked.includes(u.id)} onChange={() => toggleCheck(u.id)}
                                                style={{ cursor: 'pointer', accentColor: '#0f766e' }} />
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#020617' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#020617' }}>{u.name}</p>
                                                <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    ID #{u.id} {u.has_onboarding ? '\u2022 Onboarded' : ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>{u.email}</td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '1.75rem', padding: '0.125rem 0.375rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f766e', background: '#f0fdf4' }}>{u.meal_plans_count}</span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '1.75rem', padding: '0.125rem 0.375rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#0ea5e9', background: '#f0f9ff' }}>{u.diary_entries_count}</span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '1.75rem', padding: '0.125rem 0.375rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: '#8b5cf6', background: '#f5f3ff' }}>{u.scans_count}</span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                                            {u.has_onboarding
                                                ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: '#f0fdf4' }}><Check size={14} color="#0f766e" strokeWidth={3} /></span>
                                                : <span style={{ color: '#d1d5db', display: 'inline-flex', alignItems: 'center' }}><X size={14} strokeWidth={2.5} /></span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{u.created_at?.slice(0, 10)}</td>
                                    </tr>
                                ))}
                                {!users.length && !loading && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center' }}>
                                            <UsersIcon size={40} color="#e2e8f0" style={{ marginBottom: '0.5rem' }} />
                                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>No users found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Page {page} of {pages} &middot; {total} total users
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: page <= 1 ? '#d1d5db' : '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', transition: 'all 0.1s' }}
                                onMouseEnter={e => { if (page > 1) { e.currentTarget.style.borderColor = '#0f766e'; e.currentTarget.style.color = '#0f766e'; }}}
                                onMouseLeave={e => { if (page > 1) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}}>
                                <ChevronLeft size={16} /> Prev
                            </button>
                            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                                let p;
                                if (pages <= 7) { p = i + 1; }
                                else if (page <= 4) { p = i + 1; }
                                else if (page >= pages - 3) { p = pages - 6 + i; }
                                else { p = page - 3 + i; }
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        style={{
                                            fontSize: '0.875rem', fontWeight: 600, minWidth: '2.25rem', height: '2.25rem',
                                            borderRadius: '0.375rem', border: p === page ? 'none' : '1px solid #e2e8f0',
                                            background: p === page ? '#0f766e' : '#fff',
                                            color: p === page ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.1s',
                                        }}
                                        onMouseEnter={e => { if (p !== page) { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#0f766e'; }}}
                                        onMouseLeave={e => { if (p !== page) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}}>{p}</button>
                                );
                            })}
                            <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: page >= pages ? '#d1d5db' : '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', cursor: page >= pages ? 'not-allowed' : 'pointer', transition: 'all 0.1s' }}
                                onMouseEnter={e => { if (page < pages) { e.currentTarget.style.borderColor = '#0f766e'; e.currentTarget.style.color = '#0f766e'; }}}
                                onMouseLeave={e => { if (page < pages) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}}>
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
