import { useEffect } from 'react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { PageHeader, Panel } from '../../componenets/Ui';
import '../../styles/Nutrition.css';

const GOAL = { calories: 2450, protein: 95, carbs: 347, fat: 76, sugar: 50, sodium: 2300, fiber: 34 };
const TOTALS = { calories: 460, protein: 21, carbs: 76, fat: 8, sugar: 4, sodium: 520, fiber: 12 };

const NUTRIENTS = [
    { key: 'calories', label: 'Calories', total: TOTALS.calories, goal: GOAL.calories, unit: 'kcal' },
    { key: 'protein', label: 'Protein', total: TOTALS.protein, goal: GOAL.protein, unit: 'g' },
    { key: 'carbs', label: 'Carbs', total: TOTALS.carbs, goal: GOAL.carbs, unit: 'g' },
    { key: 'fat', label: 'Fat', total: TOTALS.fat, goal: GOAL.fat, unit: 'g' },
    { key: 'sugar', label: 'Sugar', total: TOTALS.sugar, goal: GOAL.sugar, unit: 'g' },
    { key: 'sodium', label: 'Sodium', total: TOTALS.sodium, goal: GOAL.sodium, unit: 'mg' },
    { key: 'fiber', label: 'Fiber', total: TOTALS.fiber, goal: GOAL.fiber, unit: 'g' },
];

const INSIGHTS = [
    { tone: 'warning', message: 'You are short on protein today. Add lean protein or Greek yogurt to close the gap.' },
    { tone: 'info', message: 'Fiber is low. Lentils, salad, oats, or fruit would help tomorrow feel better.' },
];

export default function Nutrition() {
    useEffect(() => { document.title = 'Nutrition Reports'; }, []);

    return (
        <DashboardLayout>
            <div className="dashPage"><div className="dashInner">
                <PageHeader title="Nutrition Reports" subtitle="Daily, weekly, and monthly nutrient graphs with plain-language insights." />

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
                    {NUTRIENTS.map(n => (
                        <Panel key={n.key}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{n.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#020617', margin: '0.25rem 0 0' }}>{n.total}</p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>of {n.goal} {n.unit}</p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', margin: '0.5rem 0 0' }}>
                                {Math.round(n.goal - n.total)} {n.unit} remaining
                            </p>
                        </Panel>
                    ))}
                </div>

                <Panel>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#020617', margin: 0, marginBottom: '1rem' }}>Insights</h2>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {INSIGHTS.map((insight, i) => (
                            <div key={i} style={{
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1rem',
                                fontSize: '0.875rem',
                                lineHeight: '1.5rem',
                                background: insight.tone === 'warning' ? '#fff7ed' : '#f0fdfa',
                                color: insight.tone === 'warning' ? '#9a3412' : '#115e59',
                            }}>
                                <span style={{
                                    display: 'inline-block', borderRadius: '9999px', padding: '0.25rem 0.75rem',
                                    fontSize: '0.75rem', fontWeight: 600,
                                    background: insight.tone === 'warning' ? '#ffedd5' : '#ccfbf1',
                                    color: insight.tone === 'warning' ? '#9a3412' : '#115e59',
                                }}>{insight.tone === 'warning' ? 'Warning' : 'Tip'}</span>
                                <p style={{ margin: '0.5rem 0 0' }}>{insight.message}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div></div>
        </DashboardLayout>
    );
}
