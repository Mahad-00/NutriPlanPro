import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
} from 'recharts';

/* ─────────────────────────────────────────
   Calories — smooth teal area chart
   matches: smooth curve, teal stroke,
   light teal fill, gridlines, y-axis labels
───────────────────────────────────────── */
export function CaloriesChart({ data = [] }) {
    return (
        <div style={{ width: '100%', height: 220, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#0f766e" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        tickCount={5}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#334155',
                        }}
                        formatter={(v) => [`${v} kcal`, 'Calories']}
                        labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="calories"
                        stroke="#0f766e"
                        strokeWidth={2}
                        fill="url(#calGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#0f766e', strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ─────────────────────────────────────────
   Macro split — NO donut, just a legend
   The Overview.jsx handles the progress
   bars below; this just shows the legend
   dots (Protein / Carbs / Fat)
───────────────────────────────────────── */
export function MacroDonutChart({ data = [] }) {
    // In the screenshot the donut area is empty/hidden when values are 0;
    // we render a minimal legend that matches what's visible
    return (
        <div style={{ padding: '12px 0 4px' }}>
            {data.map(d => (
                <div key={d.name} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: '#475569', marginBottom: 6,
                }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: d.color, flexShrink: 0,
                    }} />
                    {d.name}: {d.value}g
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────
   Weight progress — simple line chart
───────────────────────────────────────── */
export function WeightProgressChart({ data = [] }) {
    return (
        <div style={{ width: '100%', height: 180, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} domain={['auto', 'auto']} />
                    <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [`${v} kg`, 'Weight']}
                    />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#0f766e"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#0f766e', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ─────────────────────────────────────────
   Water & exercise trend — bar chart
───────────────────────────────────────── */
export function WaterChart({ data = [] }) {
    return (
        <div style={{ width: '100%', height: 180, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [`${v} ml`, 'Water']}
                    />
                    <Bar dataKey="water" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}