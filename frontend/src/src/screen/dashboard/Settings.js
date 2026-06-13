import { useEffect } from 'react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import '../../styles/Settings.css';

const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const TOP_BADGES = [
    { label: 'Health Connect',       tone: 'green',  pct: 38 },
    { label: 'Samsung Health',       tone: 'blue',   pct: 60 },
    { label: 'Watch companion support', tone: 'orange', pct: 82 },
];

export default function Settings() {
    useEffect(() => { document.title = 'Settings'; }, []);

    return (
        <DashboardLayout>
            <div className="settings-page">

                {/* ── Page header ── */}
                <div className="settings-header">
                    <h1>Settings</h1>
                    <p>Privacy, integrations, notifications, and account preferences.</p>
                </div>

                {/* ── 3 badge-bar cards ── */}
                <div className="settings-badges">
                    {TOP_BADGES.map(b => (
                        <div key={b.label} className="settings-badge-card">
                            <span className={`settings-badge-label ${b.tone}`}>{b.label}</span>
                            <div className="settings-bar-track">
                                <div
                                    className={`settings-bar-fill ${b.tone}`}
                                    style={{ width: `${b.pct}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Integration status ── */}
                <div className="settings-integration-card">
                    <div className="settings-integration-header">
                        <h2>Integration status</h2>
                        <span className="settings-count-pill">0 items</span>
                    </div>
                    <div className="settings-empty">
                        <div className="settings-empty-icon">
                            <IconSearch />
                        </div>
                        <h3>Nothing here yet</h3>
                        <p>Seed data or your next action will appear in this module.</p>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}