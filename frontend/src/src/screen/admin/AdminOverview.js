import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../Layouts/AdminLayout';
import { Users, Activity, Apple, BarChart3, Target, Leaf, UserCheck, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
const h = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
};

const colors = ['#0f766e', '#0ea5e9', '#f59e0b', '#b91c1c', '#8b5cf6', '#ec4899'];

const statMeta = [
    { key: 'total_users', label: 'Total Users', icon: Users },
    { key: 'active_users_7d', label: 'Active (7d)', icon: Activity },
    { key: 'active_users_30d', label: 'Active (30d)', icon: TrendingUp },
    { key: 'onboarding_rate', label: 'Onboarding Rate', icon: UserCheck, suffix: '%' },
    { key: 'avg_calories', label: 'Avg Calories', icon: Target, suffix: '', parent: 'nutrition_averages' },
    { key: 'avg_protein', label: 'Avg Protein', icon: BarChart3, suffix: 'g', parent: 'nutrition_averages' },
];

const shimmerStyle = `
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default function AdminOverview() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadAnalytics = () => {
        setLoading(true);
        API.get('/admin/analytics', { headers: h() })
            .then(r => setAnalytics(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        document.title = 'Admin Dashboard';
        loadAnalytics();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        API.get('/admin/analytics', { headers: h() })
            .then(r => setAnalytics(r.data))
            .catch(() => {})
            .finally(() => setRefreshing(false));
    };

    const containerStyle = { maxWidth: '1200px', margin: '0 auto' };

    const getVal = (meta) => {
        if (meta.parent && analytics) {
            const p = analytics[meta.parent];
            if (!p) return 0;
            const v = p[meta.key.replace(meta.parent + '_', '')] ?? 0;
            return v + (meta.suffix || '');
        }
        if (!analytics) return 0;
        const v = analytics[meta.key] ?? 0;
        return v + (meta.suffix || '');
    };

    return (
        <AdminLayout>
            <style>{shimmerStyle}</style>
            <div style={containerStyle}>
                {/* Header */}
                <div style={{ marginBottom: '2rem', padding: '1.5rem 0', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart3 size={22} color="#0f766e" /> Dashboard
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.125rem' }}>Platform overview at a glance.</p>
                    </div>
                    {!loading && analytics && (
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <button onClick={handleRefresh} disabled={refreshing}
                                style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f766e', background: 'transparent', border: '1px solid #0f766e', borderRadius: '0.375rem', padding: '0.375rem 0.75rem', cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' }}>
                                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                            </button>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Total</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#020617', margin: 0 }}>{analytics.total_users}</p>
                            </div>
                            <div style={{ width: '1px', height: '2rem', background: '#e2e8f0' }} />
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Onboarding</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#020617', margin: 0 }}>{analytics.onboarding_rate}%</p>
                            </div>
                            <div style={{ width: '1px', height: '2rem', background: '#e2e8f0' }} />
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Active 30d</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#020617', margin: 0 }}>{analytics.active_users_30d}</p>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>Loading...</p>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', marginBottom: '1.5rem' }}>
                            {statMeta.map((meta, idx) => (
                                <div key={meta.key} style={{
                                    background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
                                    padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                                    transition: 'box-shadow 0.2s, transform 0.2s',
                                    animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s both`,
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{meta.label}</span>
                                        <meta.icon size={18} color="#0f766e" />
                                    </div>
                                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#020617', margin: 0 }}>{getVal(meta)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charts Row */}
                        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                            {/* Daily Active Users */}
                            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#020617', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <Calendar size={16} color="#0ea5e9" /> Daily Active Users (14 days)
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: '8rem', paddingTop: '0.5rem' }}>
                                    {analytics.daily_active_users.map((d, i) => {
                                        const maxDau = Math.max(...analytics.daily_active_users.map(x => x.count), 1);
                                        const h = Math.max((d.count / maxDau) * 100, 3);
                                        const isToday = i === analytics.daily_active_users.length - 1;
                                        return (
                                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', opacity: d.count > 0 ? 1 : 0.4 }}>{d.count}</span>
                                                <div style={{
                                                    width: '100%', height: `${h}%`, borderRadius: '0.25rem 0.25rem 0 0',
                                                    background: isToday ? '#0f766e' : '#0ea5e9',
                                                    opacity: 0.8, minHeight: '3px', transition: 'height 0.3s',
                                                }} />
                                                <span style={{ fontSize: '0.55rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{d.date.slice(5)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Nutrition Averages */}
                            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#020617', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <Apple size={16} color="#b91c1c" /> Avg Daily Nutrition (7d)
                                </h2>
                                <div style={{ display: 'grid', gap: '0.875rem' }}>
                                    <NutritionBar label="Calories" value={analytics.nutrition_averages?.avg_calories || 0} unit="" max={3000} color="#b91c1c" />
                                    <NutritionBar label="Protein" value={analytics.nutrition_averages?.avg_protein || 0} unit="g" max={150} color="#0f766e" />
                                    <NutritionBar label="Carbs" value={analytics.nutrition_averages?.avg_carbs || 0} unit="g" max={400} color="#f59e0b" />
                                    <NutritionBar label="Fat" value={analytics.nutrition_averages?.avg_fat || 0} unit="g" max={100} color="#0ea5e9" />
                                </div>
                            </div>

                            {/* Goal Distribution */}
                            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#020617', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <Target size={16} color="#f59e0b" /> Goal Type Distribution
                                </h2>
                                {analytics.goal_distribution.length ? (
                                    <div style={{ display: 'grid', gap: '0.625rem' }}>
                                        {analytics.goal_distribution.map((g, i) => {
                                            const pct = analytics.total_users ? Math.round(g.count / analytics.total_users * 100) : 0;
                                            return (
                                                <div key={g.type}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{g.type.replace(/_/g, ' ')}</span>
                                                        <span style={{ color: '#64748b' }}>{g.count} ({pct}%)</span>
                                                    </div>
                                                    <div style={{ height: '0.5rem', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: '999px', transition: 'width 0.6s ease' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', padding: '1.5rem', margin: 0 }}>No goals data yet.</p>}
                            </div>

                            {/* Dietary Preferences */}
                            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#020617', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <Leaf size={16} color="#0f766e" /> Dietary Preferences
                                </h2>
                                {analytics.dietary_breakdown.length ? (
                                    <div style={{ display: 'grid', gap: '0.625rem' }}>
                                        {analytics.dietary_breakdown.map((d, i) => {
                                            const total = analytics.dietary_breakdown.reduce((s, x) => s + x.count, 0);
                                            const pct = total ? Math.round(d.count / total * 100) : 0;
                                            return (
                                                <div key={d.preference}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{d.preference.replace(/_/g, ' ')}</span>
                                                        <span style={{ color: '#64748b' }}>{d.count} ({pct}%)</span>
                                                    </div>
                                                    <div style={{ height: '0.5rem', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: '999px', transition: 'width 0.6s ease' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', padding: '1.5rem', margin: 0 }}>No dietary data yet.</p>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

function NutritionBar({ label, value, unit, max, color }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>{label}</span>
                <span style={{ color: '#64748b' }}>{value}{unit}</span>
            </div>
            <div style={{ height: '0.5rem', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s' }} />
            </div>
        </div>
    );
}
