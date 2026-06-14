import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import '../../styles/Progress.css';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const IconScale = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a9 9 0 100 18A9 9 0 0012 3z"/><path d="M12 8v4l3 3"/>
    </svg>
);
const IconSave = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
);
const IconUpload = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
);
const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const EmptyState = ({ title, text }) => (
    <div className="progress-empty">
        <div className="progress-empty-icon"><IconSearch /></div>
        <h3>{title}</h3>
        <p>{text}</p>
    </div>
);

export default function Progress() {
    useEffect(() => { document.title = 'Progress'; }, []);

    const [current, setCurrent] = useState(50);
    const [target] = useState(75);
    const [weightDate, setWeightDate] = useState(new Date().toISOString().slice(0, 10));
    const [weightVal, setWeightVal] = useState(50);
    const [weights, setWeights] = useState([]);

    const [measureDate, setMeasureDate] = useState(new Date().toISOString().slice(0, 10));
    const [measurements, setMeasurements] = useState({ waist: '', chest: '', hips: '', arms: '', thighs: '' });
    const [measureLogs, setMeasureLogs] = useState([]);

    const [photoDate, setPhotoDate] = useState(new Date().toISOString().slice(0, 10));
    const [photoFile, setPhotoFile] = useState(null);
    const [photoLogs, setPhotoLogs] = useState([]);

    const submitting = useRef(false);

    const fetchWeights = useCallback(async () => {
        try {
            const res = await API.get('/progress?type=weight', { headers: headers() });
            setWeights(res.data.entries);
            if (res.data.entries.length > 0) {
                const latest = res.data.entries.reduce((a, b) => a.date > b.date ? a : b);
                setCurrent(latest.weight);
            }
        } catch { setWeights([]); }
    }, []);

    const fetchMeasurements = useCallback(async () => {
        try {
            const res = await API.get('/progress?type=measurement', { headers: headers() });
            setMeasureLogs(res.data.entries);
        } catch { setMeasureLogs([]); }
    }, []);

    const fetchPhotos = useCallback(async () => {
        try {
            const res = await API.get('/progress?type=photo', { headers: headers() });
            setPhotoLogs(res.data.entries);
        } catch { setPhotoLogs([]); }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) { fetchWeights(); fetchMeasurements(); fetchPhotos(); }
    }, [fetchWeights, fetchMeasurements, fetchPhotos]);

    const saveWeight = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/progress', {
                entry_type: 'weight',
                date: weightDate,
                weight: weightVal,
            }, { headers: headers() });
            setWeights(prev => [res.data.entry, ...prev]);
            setCurrent(weightVal);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    const saveMeasurements = async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        try {
            const res = await API.post('/progress', {
                entry_type: 'measurement',
                date: measureDate,
                ...measurements,
            }, { headers: headers() });
            setMeasureLogs(prev => [res.data.entry, ...prev]);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    const uploadPhoto = async (e) => {
        e.preventDefault();
        if (!photoFile || submitting.current) return;
        submitting.current = true;
        try {
            const fd = new FormData();
            fd.append('file', photoFile);
            fd.append('date', photoDate);
            const res = await API.post('/progress/upload-photo', fd, { headers: { ...headers(), 'Content-Type': 'multipart/form-data' } });
            setPhotoLogs(prev => [res.data.entry, ...prev]);
            setPhotoFile(null);
        } catch { /* error */ }
        finally { submitting.current = false; }
    };

    const change = (current - target).toFixed(1);
    const changeClass = Number(change) < 0 ? 'negative' : 'positive';

    return (
        <DashboardLayout>
            <div className="progress-page">
                <div className="progress-header">
                    <h1>Progress</h1>
                    <p>Track weight, body measurements, progress photos, trend, and goal progress.</p>
                </div>

                <div className="progress-stats">
                    <div className="progress-stat-card">
                        <p className="progress-stat-label current">Current</p>
                        <p className="progress-stat-value">{current}.0 kg</p>
                    </div>
                    <div className="progress-stat-card">
                        <p className="progress-stat-label target">Target</p>
                        <p className="progress-stat-value">{target}.0 kg</p>
                    </div>
                    <div className="progress-stat-card">
                        <p className="progress-stat-label change">Change</p>
                        <p className={`progress-stat-value ${changeClass}`}>{change} kg</p>
                    </div>
                </div>

                <div className="progress-middle">
                    <div className="progress-card">
                        <h2>Log weight</h2>
                        <form onSubmit={saveWeight}>
                            <div className="progress-field">
                                <label>Date</label>
                                <input className="progress-input" type="date" value={weightDate} onChange={e => setWeightDate(e.target.value)} />
                            </div>
                            <div className="progress-field">
                                <label>Weight Kg</label>
                                <input className="progress-input" type="number" step="0.1" value={weightVal} onChange={e => setWeightVal(Number(e.target.value))} />
                            </div>
                            <button type="submit" className="progress-btn-primary">
                                <IconScale /> Save weight
                            </button>
                        </form>
                    </div>

                    <div className="progress-card">
                        <h2>Measurements</h2>
                        <form onSubmit={saveMeasurements}>
                            <div className="progress-field">
                                <label>Date</label>
                                <input className="progress-input" type="date" value={measureDate} onChange={e => setMeasureDate(e.target.value)} />
                            </div>
                            {['waist', 'chest', 'hips', 'arms', 'thighs'].map(f => (
                                <div className="progress-field" key={f}>
                                    <label style={{ textTransform: 'capitalize' }}>{f} Cm</label>
                                    <input
                                        className="progress-input"
                                        type="number"
                                        step="0.1"
                                        value={measurements[f]}
                                        onChange={e => setMeasurements(prev => ({ ...prev, [f]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            <button type="submit" className="progress-btn-primary">
                                <IconSave /> Save measurements
                            </button>
                        </form>
                    </div>

                    <div className="progress-card">
                        <h2>Progress photo</h2>
                        <form onSubmit={uploadPhoto}>
                            <div className="progress-field">
                                <label>Date</label>
                                <input className="progress-input" type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)} />
                            </div>
                            <div className="progress-field">
                                <div className="progress-file-row">
                                    <label className="progress-file-btn" style={{ cursor: 'pointer' }}>
                                        Choose File
                                        <input type="file" style={{ display: 'none' }} onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                                    </label>
                                    <span className="progress-file-name">
                                        {photoFile ? photoFile.name : 'No file chosen'}
                                    </span>
                                </div>
                            </div>
                            <button type="submit" disabled={!photoFile} className="progress-btn-primary">
                                <IconUpload /> Upload photo
                            </button>
                        </form>
                    </div>
                </div>

                <div className="progress-logs-row">
                    <div className="progress-card">
                        <h2>Weight logs</h2>
                        {weights.length ? (
                            <div>
                                {weights.map(w => (
                                    <div key={w.id} className="progress-log-entry">
                                        <span>{w.date}</span>
                                        <span style={{ fontWeight: 600 }}>{w.weight} kg</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="No weights logged" text="Log your first weight above." />
                        )}
                    </div>
                    <div className="progress-card">
                        <h2>Measurement logs</h2>
                        {measureLogs.length ? (
                            <div>
                                {measureLogs.map(m => (
                                    <div key={m.id} className="progress-log-entry">
                                        <span>{m.date}</span>
                                        <span style={{ fontSize: 12, color: '#64748b' }}>
                                            W {m.waist}cm · C {m.chest}cm · H {m.hips}cm · A {m.arms}cm · T {m.thighs}cm
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="No measurements logged" text="Save your first measurement above." />
                        )}
                    </div>
                </div>

                <div className="progress-photos-row">
                    <div className="progress-card">
                        <h2>Photos</h2>
                        {photoLogs.length ? (
                            <div>
                                {photoLogs.map(p => (
                                    <div key={p.id} className="progress-log-entry" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <span>{p.date}</span>
                                        {p.filename && p.filename.startsWith('http') ? (
                                            <img src={p.filename} alt="Progress" style={{ width: '100%', maxHeight: 200, borderRadius: '0.5rem', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontWeight: 500 }}>{p.filename}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="No photos uploaded" text="Upload a progress photo above." />
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
