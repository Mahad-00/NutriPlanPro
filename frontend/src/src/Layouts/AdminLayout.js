import { Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, LogOut, Utensils, Apple, Barcode, ClipboardList, Calendar, Droplets, TrendingUp, Dumbbell, ListOrdered, Lightbulb, Target, ShoppingCart } from 'lucide-react';
import BrandLogo from '../componenets/BrandLogo';

const nav = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { divider: true },
    { to: '/admin/contact-messages', label: 'Contact Messages', icon: MessageSquare },
    { to: '/admin/recipes', label: 'Recipes', icon: Utensils },
    { to: '/admin/custom-foods', label: 'Custom Foods', icon: Apple },
    { to: '/admin/barcode-foods', label: 'Barcode Foods', icon: Barcode },
    { divider: true },
    { to: '/admin/food-diary', label: 'Food Diary', icon: ClipboardList },
    { to: '/admin/meal-plans', label: 'Meal Plans', icon: Calendar },
    { to: '/admin/water-logs', label: 'Water Logs', icon: Droplets },
    { to: '/admin/progress-entries', label: 'Progress', icon: TrendingUp },
    { divider: true },
    { to: '/admin/workout-logs', label: 'Workout Logs', icon: Dumbbell },
    { to: '/admin/workout-routines', label: 'Workout Routines', icon: ListOrdered },
    { divider: true },
    { to: '/admin/diet-recommendations', label: 'Diet Recommendations', icon: Lightbulb },
    { to: '/admin/goals', label: 'Goals', icon: Target },
    { to: '/admin/grocery-items', label: 'Grocery Items', icon: ShoppingCart },
];

export default function AdminLayout({ children }) {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.is_admin) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <aside style={{
                width: '16rem', background: '#fff',
                borderRight: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, left: 0, bottom: 0,
                zIndex: 40, boxShadow: '1px 0 3px rgba(0,0,0,.04)'
            }}>
                <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <Link to="/admin" style={{ textDecoration: 'none', display: 'block' }}>
                        <BrandLogo />
                    </Link>
                </div>
                <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.125rem', overflowY: 'auto' }}>
                    {nav.map((item) => {
                        if (item.divider) {
                            return <div key={Math.random()} style={{ height: 1, background: '#e2e8f0', margin: '0.375rem 0.5rem' }} />;
                        }
                        const { to, label, icon: Icon } = item;
                        const active = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
                        return (
                            <Link
                                key={to} to={to}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f766e'; }}}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.625rem 0.75rem',
                                    borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
                                    color: active ? '#0f766e' : '#475569',
                                    background: active ? '#f0fdf4' : 'transparent',
                                    textDecoration: 'none', transition: 'all 0.15s',
                                    borderLeft: active ? '3px solid #0f766e' : '3px solid transparent',
                                }}>
                                <Icon size={18} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
                <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={handleLogout}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b91c1c'; }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.625rem 0.75rem', width: '100%',
                            borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
                            color: '#b91c1c', background: 'transparent',
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>
            <main style={{ marginLeft: '16rem', flex: 1, padding: '2rem', minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
}