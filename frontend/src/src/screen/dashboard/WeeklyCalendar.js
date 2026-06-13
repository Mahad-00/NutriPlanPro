import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function getWeekStart(d) {
    const dt = new Date(d);
    const day = dt.getDay();
    const diff = dt.getDate() - day;
    return new Date(dt.getFullYear(), dt.getMonth(), diff);
}

function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function DayCell({ dateStr, dayIndex, dayDate, isToday, entries, onAdd, onDelete }) {
    const [inputName, setInputName] = useState('');
    const [inputCals, setInputCals] = useState('');
    const [inputType, setInputType] = useState('Breakfast');
    const submitting = useRef(false);

    const handleAdd = () => {
        if (!inputName.trim() || submitting.current) return;
        submitting.current = true;
        onAdd(dateStr, inputType, inputName.trim(), Number(inputCals) || 0);
        setInputName('');
        setInputCals('');
        setTimeout(() => { submitting.current = false; }, 300);
    };

    const s = {
        col: { background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        colHead: { padding: '12px 10px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', background: isToday ? '#f0f9ff' : '#fff' },
        dayName: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
        dayDate: { fontSize: 22, fontWeight: 700, color: isToday ? '#0ea5e9' : '#0f172a', marginTop: 2 },
        todayBadge: { fontSize: 10, fontWeight: 700, color: '#0ea5e9', background: '#f0f9ff', borderRadius: 999, padding: '1px 8px', display: 'inline-block', marginTop: 4 },
        body: { padding: '8px 8px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
        meal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 6, border: '1px solid #f1f5f9', fontSize: 12 },
        mealName: { fontWeight: 600, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        mealCals: { color: '#64748b', marginLeft: 6, whiteSpace: 'nowrap' },
        mealType: { fontSize: 10, fontWeight: 600, color: '#94a3b8', background: '#f8fafc', borderRadius: 4, padding: '1px 6px', marginRight: 6 },
        del: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, flexShrink: 0, marginLeft: 4 },
        addForm: { borderTop: '1px solid #f1f5f9', padding: '8px', marginTop: 'auto' },
        addRow: { display: 'flex', gap: 4, alignItems: 'center' },
        addInput: { flex: 1, border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none', height: 30, boxSizing: 'border-box', width: 0, minWidth: 0 },
        addCals: { border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 6px', fontSize: 11, outline: 'none', width: 46, height: 30, boxSizing: 'border-box' },
        addBtn: { background: '#0f766e', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '0 8px', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        empty: { textAlign: 'center', color: '#94a3b8', fontSize: 11, padding: '12px 4px', border: '1px dashed #e2e8f0', borderRadius: 6 },
        select: { border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', fontSize: 11, height: 30, marginBottom: 4, width: '100%', boxSizing: 'border-box', outline: 'none', background: '#fff' },
    };

    return (
        <div style={s.col}>
            <div style={s.colHead}>
                <div style={s.dayName}>{DAY_NAMES[dayIndex]}</div>
                <div style={s.dayDate}>{dayDate}</div>
                {isToday && <div style={s.todayBadge}>Today</div>}
            </div>

            <div style={s.body}>
                {entries.length === 0 ? (
                    <div style={s.empty}>No meals</div>
                ) : (
                    entries.map(e => (
                        <div key={e.id} style={s.meal}>
                            <span style={s.mealType}>{e.meal_type}</span>
                            <span style={s.mealName}>{e.name}</span>
                            <span style={s.mealCals}>{e.calories} kcal</span>
                            <button type="button" style={s.del} onClick={() => onDelete(e.id)}>
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div style={s.addForm}>
                <select value={inputType} onChange={e => setInputType(e.target.value)} style={s.select}>
                    {MEAL_TYPES.map(mt => <option key={mt} value={mt}>{mt}</option>)}
                </select>
                <div style={s.addRow}>
                    <input placeholder="Meal name" value={inputName} onChange={e => setInputName(e.target.value)} style={s.addInput} />
                    <input placeholder="Cal" type="number" value={inputCals} onChange={e => setInputCals(e.target.value)} style={s.addCals} />
                    <button type="button" style={s.addBtn} disabled={!inputName.trim()} onClick={handleAdd}>
                        <Plus size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function WeeklyCalendar() {
    useEffect(() => { document.title = 'Weekly Calendar'; }, []);

    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [days, setDays] = useState({});
    const [loading, setLoading] = useState(true);

    const weekStartStr = formatDate(weekStart);

    const fetchWeek = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get(`/weekly-calendar?week_start=${weekStartStr}`, { headers: headers() });
            setDays(res.data.days || {});
        } catch {
            setDays({});
        } finally {
            setLoading(false);
        }
    }, [weekStartStr]);

    useEffect(() => {
        if (localStorage.getItem('token')) fetchWeek();
    }, [fetchWeek]);

    const goPrev = () => setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7));
    const goNext = () => setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7));
    const goToday = () => setWeekStart(getWeekStart(new Date()));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        weekDates.push(d);
    }

    const addEntry = async (dateStr, mealType, name, calories) => {
        try {
            await API.post('/weekly-calendar', { date: dateStr, meal_type: mealType, name, calories }, { headers: headers() });
            fetchWeek();
        } catch { /* error */ }
    };

    const deleteEntry = async (id) => {
        try {
            await API.delete(`/weekly-calendar/${id}`, { headers: headers() });
            fetchWeek();
        } catch { /* error */ }
    };

    const todayStr = formatDate(new Date());

    const s = {
        wrap: { padding: '28px', background: '#f1f5f9', minHeight: '100%', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
        header: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
        sub: { fontSize: 13, color: '#64748b', margin: '0 0 20px' },
        nav: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
        navBtn: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4, height: 38 },
        navLabel: { fontSize: 15, fontWeight: 700, color: '#0f172a', minWidth: 200, textAlign: 'center' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 },
        loader: { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 },
    };

    return (
        <DashboardLayout>
            <div style={s.wrap}>
                <h1 style={s.header}>Weekly Calendar</h1>
                <p style={s.sub}>Plan your meals for the week. Add, view, and delete meals per day.</p>

                <div style={s.nav}>
                    <button type="button" style={s.navBtn} onClick={goPrev}><ChevronLeft size={15} /> Prev</button>
                    <span style={s.navLabel}>
                        {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' — '}
                        {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button type="button" style={s.navBtn} onClick={goNext}>Next <ChevronRight size={15} /></button>
                    <button type="button" style={{ ...s.navBtn, color: '#0ea5e9', borderColor: '#bae6fd' }} onClick={goToday}>Today</button>
                </div>

                {loading ? (
                    <div style={s.loader}>Loading...</div>
                ) : (
                    <div style={s.grid}>
                        {weekDates.map((d) => {
                            const ds = formatDate(d);
                            return (
                                <DayCell
                                    key={ds}
                                    dateStr={ds}
                                    dayIndex={d.getDay()}
                                    dayDate={d.getDate()}
                                    isToday={ds === todayStr}
                                    entries={days[ds] || []}
                                    onAdd={addEntry}
                                    onDelete={deleteEntry}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
