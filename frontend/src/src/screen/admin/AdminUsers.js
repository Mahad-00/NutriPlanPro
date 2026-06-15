import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../styles/Admin.css';
import { Trash2, ArrowLeft, Users as UsersIcon, Mail, ClipboardList, Camera, Droplets, Target, Utensils, Apple, Search, Download, ChevronLeft, ChevronRight, Activity, Barcode, Eye, Check, X, RefreshCw, CheckSquare } from 'lucide-react';

const API = axios.create({ baseURL: '/api' });
function headers() {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

const labelStyle = { fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const valueStyle = { fontSize: '0.875rem', color: '#020617', margin: '0 0 0.75rem', lineHeight: 1.5 };
const panelTitle = { fontSize: '0.9rem', fontWeight: 700, color: '#020617', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' };

const shimmerStyle = `
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
`;

const Skeleton = ({ width = '100%', height = '1rem', style = {} }) => (
    <div style={{ width, height, borderRadius: '0.375rem', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', ...style }} />
);

const Avatar = ({ name, size = '2rem' }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: size === '2rem' ? '0.75rem' : '1rem', fontWeight: 700, flexShrink: 0
    }}>{name?.charAt(0).toUpperCase() || '?'}</div>
);

const DetailPanel = ({ title, icon: Icon, iconColor, children, count }) => (
    <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)', animation: 'fadeInUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={panelTitle}><Icon size={16} color={iconColor || '#0f766e'} />{title}</h3>
            {count !== undefined && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '0.125rem 0.5rem', borderRadius: '999px' }}>{count}</span>
            )}
        </div>
        {children}
    </div>
);

const EmptyState = ({ icon: Icon, message }) => (
    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
        <Icon size={28} color="#e2e8f0" style={{ marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>{message}</p>
    </div>
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
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
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

    const viewDetails = (u) => {
        setSelected(u);
        setLoadingDetail(true);
        setDetail(null);
        API.get(`/admin/users/${u.id}/details`, { headers: headers() })
            .then(r => setDetail(r.data))
            .catch(() => null)
            .finally(() => setLoadingDetail(false));
    };

    const doDelete = () => {
        if (!confirmDelete) return;
        setDeleting(true);
        API.delete(`/admin/users/${confirmDelete.id}`, { headers: headers() })
            .then(() => { setConfirmDelete(null); setSelected(null); setDetail(null); loadUsers(); })
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

    // ── Detail view ──
    if (selected && detail) {
        const d = detail;
        return (
            <AdminLayout>
                <style>{shimmerStyle}</style>
                <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'slideIn 0.3s ease-out' }}>
                    {/* Detail Header */}
                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => { setSelected(null); setDetail(null); }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f766e'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', color: '#64748b', transition: 'all 0.15s' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <Avatar name={d.user.name} size="3rem" />
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0 }}>{d.user.name}</h1>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.125rem 0 0' }}>{d.user.email} &middot; ID #{d.user.id}</p>
                        </div>
                        <button onClick={() => setConfirmDelete(d.user)}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.borderColor = '#fecaca'; }}
                            style={{
                                marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 600, color: '#b91c1c',
                                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem',
                                padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s'
                            }}><Trash2 size={16} /> Delete User</button>
                    </div>

                    {loadingDetail ? (
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                                    <Skeleton width="8rem" height="1rem" style={{ marginBottom: '1rem' }} />
                                    <Skeleton width="100%" height="1rem" style={{ marginBottom: '0.5rem' }} />
                                    <Skeleton width="60%" height="1rem" style={{ marginBottom: '0.5rem' }} />
                                    <Skeleton width="80%" height="1rem" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                            {d.onboarding && <DetailPanel title="Onboarding" icon={UsersIcon} iconColor="#0f766e">
                                <p style={labelStyle}>Age</p><p style={valueStyle}>{d.onboarding.age || 'N/A'}</p>
                                <p style={labelStyle}>Gender</p><p style={valueStyle}>{d.onboarding.gender || 'N/A'}</p>
                                <p style={labelStyle}>Height</p><p style={valueStyle}>{d.onboarding.height_cm || '?'} cm</p>
                                <p style={labelStyle}>Current / Target Weight</p><p style={valueStyle}>{d.onboarding.current_weight_kg || '?'} / {d.onboarding.target_weight_kg || '?'} kg</p>
                                <p style={labelStyle}>Activity Level</p><p style={valueStyle}>{d.onboarding.activity_level || 'N/A'}</p>
                                <p style={labelStyle}>Dietary Preference</p><p style={valueStyle}>{d.onboarding.dietary_preference || 'None'}</p>
                                <p style={labelStyle}>Meals Per Day</p><p style={valueStyle}>{d.onboarding.meals_per_day || 'N/A'}</p>
                            </DetailPanel>}

                            <DetailPanel title="Goals" icon={Target} iconColor="#0ea5e9" count={d.goals.length}>
                                {d.goals.length ? d.goals.map((g, i) => (
                                    <div key={i} style={{ marginBottom: i < d.goals.length - 1 ? '0.75rem' : 0, paddingBottom: i < d.goals.length - 1 ? '0.75rem' : 0, borderBottom: i < d.goals.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617', margin: 0, textTransform: 'capitalize' }}>{g.goal_type?.replace(/_/g, ' ') || 'General'}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.125rem 0 0' }}>Cal: {g.calorie_goal} &middot; Protein: {g.protein_goal}g &middot; Carbs: {g.carb_goal}g &middot; Fat: {g.fat_goal}g</p>
                                    </div>
                                )) : <EmptyState icon={Target} message="No goals set." />}
                            </DetailPanel>

                            <DetailPanel title="Meal Plans" icon={Utensils} iconColor="#0f766e" count={d.meal_plans.length}>
                                {d.meal_plans.length ? d.meal_plans.map(p => (
                                    <div key={p.id} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600, color: '#020617' }}>{p.title || 'Plan'}</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.status === 'active' ? '#0f766e' : '#94a3b8', background: p.status === 'active' ? '#f0fdf4' : '#f8fafc', padding: '0.125rem 0.5rem', borderRadius: '999px' }}>{p.status}</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.125rem 0 0' }}>{p.calorie_target} cal &middot; {p.duration_days} days</p>
                                    </div>
                                )) : <EmptyState icon={Utensils} message="No meal plans." />}
                            </DetailPanel>

                            <DetailPanel title="Food Diary" icon={ClipboardList} iconColor="#0ea5e9" count={d.diary_entries.length}>
                                {d.diary_entries.length ? d.diary_entries.map((e, i) => (
                                    <div key={e.id} style={{ marginBottom: i < d.diary_entries.length - 1 ? '0.375rem' : 0, paddingBottom: i < d.diary_entries.length - 1 ? '0.375rem' : 0, borderBottom: i < d.diary_entries.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#334155' }}>{e.name}</span>
                                        <span style={{ color: '#64748b' }}>{e.calories || 0} cal</span>
                                    </div>
                                )) : <EmptyState icon={ClipboardList} message="No diary entries." />}
                            </DetailPanel>

                            <DetailPanel title="Water Intake" icon={Droplets} iconColor="#0ea5e9" count={d.water_logs.length}>
                                {d.water_logs.length ? d.water_logs.map((w, i) => (
                                    <div key={w.id} style={{ marginBottom: i < d.water_logs.length - 1 ? '0.375rem' : 0, paddingBottom: i < d.water_logs.length - 1 ? '0.375rem' : 0, borderBottom: i < d.water_logs.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#334155' }}>{w.date?.slice(0, 10)}</span>
                                        <span style={{ color: '#0ea5e9', fontWeight: 600 }}>{w.ml} ml</span>
                                    </div>
                                )) : <EmptyState icon={Droplets} message="No water logs." />}
                            </DetailPanel>

                            <DetailPanel title="Meal Scans" icon={Camera} iconColor="#0f766e" count={d.meal_scans.length}>
                                {d.meal_scans.length ? d.meal_scans.map((s, i) => (
                                    <div key={s.id} style={{ marginBottom: i < d.meal_scans.length - 1 ? '0.75rem' : 0, paddingBottom: i < d.meal_scans.length - 1 ? '0.75rem' : 0, borderBottom: i < d.meal_scans.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            {s.image_url && <img src={s.image_url} alt="Meal scan" style={{ width: '4rem', height: '4rem', borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} onError={e => { e.target.style.display = 'none'; }} />}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617', margin: 0, textTransform: 'capitalize' }}>{s.meal_type || 'Scan'}</p>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.125rem 0 0' }}>{s.date?.slice(0, 10)}{s.notes ? ` \u00b7 ${s.notes}` : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                )) : <EmptyState icon={Camera} message="No scans." />}
                            </DetailPanel>

                            <DetailPanel title="Barcode Foods" icon={Barcode} iconColor="#8b5cf6" count={d.barcode_foods?.length}>
                                {d.barcode_foods?.length ? d.barcode_foods.map((f, i) => (
                                    <div key={f.id} style={{
                                        marginBottom: i < d.barcode_foods.length - 1 ? '0.375rem' : 0,
                                        paddingBottom: i < d.barcode_foods.length - 1 ? '0.375rem' : 0,
                                        borderBottom: i < d.barcode_foods.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <span style={{ color: '#020617', fontWeight: 600 }}>{f.name}</span>
                                            {f.brand && <span style={{ color: '#94a3b8', marginLeft: '0.375rem' }}>({f.brand})</span>}
                                        </div>
                                        <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>{f.calories} cal</span>
                                    </div>
                                )) : <EmptyState icon={Barcode} message="No barcode scans." />}
                            </DetailPanel>

                            <DetailPanel title="Recipes" icon={Utensils} iconColor="#f59e0b" count={d.recipes?.length}>
                                {d.recipes?.length ? d.recipes.map((r, i) => (
                                    <div key={r.id} style={{ marginBottom: i < d.recipes.length - 1 ? '0.5rem' : 0, paddingBottom: i < d.recipes.length - 1 ? '0.5rem' : 0, borderBottom: i < d.recipes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#020617' }}>{r.title}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.calories} cal</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.125rem 0 0' }}>
                                            {r.category && <span style={{ textTransform: 'capitalize' }}>{r.category}</span>}
                                            {r.category && r.diet_type ? ' \u00b7 ' : ''}
                                            {r.diet_type && <span style={{ textTransform: 'capitalize' }}>{r.diet_type}</span>}
                                            {` \u00b7 ${r.protein}g P \u00b7 ${r.carbs}g C \u00b7 ${r.fat}g F`}
                                        </p>
                                    </div>
                                )) : <EmptyState icon={Utensils} message="No recipes." />}
                            </DetailPanel>

                            <DetailPanel title="Custom Foods" icon={Apple} iconColor="#f97316" count={d.custom_foods?.length}>
                                {d.custom_foods?.length ? d.custom_foods.map((f, i) => (
                                    <div key={f.id} style={{
                                        marginBottom: i < d.custom_foods.length - 1 ? '0.375rem' : 0,
                                        paddingBottom: i < d.custom_foods.length - 1 ? '0.375rem' : 0,
                                        borderBottom: i < d.custom_foods.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <span style={{ color: '#020617', fontWeight: 600 }}>{f.name}</span>
                                            {f.brand && <span style={{ color: '#94a3b8', marginLeft: '0.375rem' }}>({f.brand})</span>}
                                        </div>
                                        <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>{f.calories} cal</span>
                                    </div>
                                )) : <EmptyState icon={Apple} message="No custom foods." />}
                            </DetailPanel>

                            <DetailPanel title="Activity Timeline" icon={Activity} iconColor="#8b5cf6" count={d.timeline?.length}>
                                {d.timeline?.length ? d.timeline.slice(0, 15).map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
                                        <span style={{ color: '#94a3b8', whiteSpace: 'nowrap', width: '5rem', flexShrink: 0 }}>{t.date}</span>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 600, padding: '0.0625rem 0.375rem', borderRadius: '999px',
                                            background: t.type === 'diary' ? '#f0fdf4' : t.type === 'meal_plan' ? '#fffbeb' : t.type === 'scan' ? '#f0f9ff' : '#eff6ff',
                                            color: t.type === 'diary' ? '#0f766e' : t.type === 'meal_plan' ? '#b45309' : t.type === 'scan' ? '#0ea5e9' : '#0284c7'
                                        }}>{t.type}</span>
                                        <span style={{ color: '#475569' }}>{t.label}</span>
                                    </div>
                                )) : <EmptyState icon={Activity} message="No activity." />}
                            </DetailPanel>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {confirmDelete && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, animation: 'fadeInUp 0.2s ease-out' }}>
                            <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', width: 'min(90vw, 28rem)', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,.1)' }}>
                                <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Trash2 size={24} color="#b91c1c" />
                                </div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#020617', margin: '0 0 0.5rem' }}>Delete User?</h2>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.5rem' }}>
                                    Permanently delete <strong>{confirmDelete.name}</strong> ({confirmDelete.email}) and all associated data.
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', cursor: deleting ? 'not-allowed' : 'pointer' }}>Cancel</button>
                                    <button onClick={doDelete} disabled={deleting} style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', background: deleting ? '#94a3b8' : '#b91c1c', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', cursor: deleting ? 'not-allowed' : 'pointer' }}>{deleting ? 'Deleting...' : 'Delete'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        );
    }

    // ── List view ──
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
                                    <th style={{ padding: '0.875rem 1rem', borderBottom: '2px solid #e2e8f0', width: '5rem' }}></th>
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
                                            <td style={{ padding: '0.875rem 1rem' }}><Skeleton width="4rem" height="1rem" /></td>
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
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#020617', cursor: 'pointer' }} onClick={() => viewDetails(u)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                <Avatar name={u.name} />
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#020617' }}>{u.name}</p>
                                                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                        ID #{u.id} {u.has_onboarding ? '\u2022 Onboarded' : ''}
                                                    </p>
                                                </div>
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
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <button onClick={() => viewDetails(u)}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#0f766e'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#0f766e'; }}
                                                style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f766e', background: 'transparent', border: '1px solid #0f766e', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!users.length && !loading && (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '3rem', textAlign: 'center' }}>
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
