import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../componenets/BrandLogo';
import { Badge, Panel, ProgressBar } from '../../componenets/Ui';
import { Activity, HeartPulse, Salad, Scale } from 'lucide-react';
import '../../styles/Onboarding.css';

const API = axios.create({ baseURL: '/api' });

const goals = [
    ['lose_weight', 'Lose weight'],
    ['maintain_weight', 'Maintain'],
    ['gain_weight', 'Gain weight'],
    ['build_muscle', 'Build muscle'],
];

const activities = [
    ['sedentary', 'Sedentary'],
    ['lightly_active', 'Lightly active'],
    ['moderately_active', 'Moderately active'],
    ['very_active', 'Very active'],
    ['athlete', 'Athlete'],
];

const diets = ['balanced', 'vegetarian', 'vegan', 'keto', 'high_protein', 'low_carb', 'diabetic_friendly', 'heart_healthy', 'halal'];

export default function Onboarding() {
    const [data, setData] = useState({
        age: '', gender: 'female', height_cm: '', current_weight_kg: '',
        target_weight_kg: '', goal_type: 'lose_weight', activity_level: 'moderately_active',
        dietary_preference: 'balanced', allergies: '', disliked_foods: '',
        preferred_cuisines: '', meals_per_day: 3, budget_level: 'medium',
        cooking_time_preference: 'moderate', medical_notes: '',
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => { document.title = 'Profile setup'; }, []);

    const set = (field) => (value) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!data.age) newErrors.age = 'Age is required.';
        if (!data.height_cm) newErrors.height_cm = 'Height is required.';
        if (!data.current_weight_kg) newErrors.current_weight_kg = 'Current weight is required.';
        if (!data.target_weight_kg) newErrors.target_weight_kg = 'Target weight is required.';
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        try {
            await API.post('/auth/onboarding', data, {
                headers: { Authorization: `Bearer ${token}` },
            });
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: 'Failed to save. Please try again.' });
            }
        }
    };

    return (
        <div className="onboardingPage">
            <div className="onboardingInner">
                <div className="onboardingTop">
                    <BrandLogo />
                    <Badge tone="teal">Profile setup</Badge>
                </div>

                <Panel style={{ background: '#115e59', color: '#fff', padding: '1rem' }}>
                    <div className="onboardingHeroGrid">
                        <div>
                            <h1 className="onboardingHeroTitle">Build your diet targets</h1>
                            <p className="onboardingHeroDesc">
                                Complete these nutrition details once so meal plans, diary targets, water goals, grocery lists, and recommendations work together.
                            </p>
                        </div>
                        <div className="onboardingMetrics">
                            <Metric icon={Scale} label="Body" />
                            <Metric icon={Activity} label="Activity" />
                            <Metric icon={Salad} label="Meals" />
                        </div>
                    </div>
                </Panel>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="onboardingSection">
                        <div className="onboardingSectionHeader">
                            <HeartPulse className="onboardingSectionIcon" />
                            <h2 className="onboardingSectionTitle">Profile</h2>
                        </div>
                        <div className="onboardingGrid">
                            <Field label="Age" value={data.age} error={errors.age} onChange={set('age')} type="number" />
                            <SelectField label="Gender" value={data.gender} onChange={set('gender')} options={[['female', 'Female'], ['male', 'Male'], ['non_binary', 'Non binary'], ['prefer_not_to_say', 'Prefer not to say']]} />
                            <Field label="Height cm" value={data.height_cm} error={errors.height_cm} onChange={set('height_cm')} type="number" />
                            <Field label="Current weight kg" value={data.current_weight_kg} error={errors.current_weight_kg} onChange={set('current_weight_kg')} type="number" />
                            <Field label="Target weight kg" value={data.target_weight_kg} error={errors.target_weight_kg} onChange={set('target_weight_kg')} type="number" />
                            <SelectField label="Goal" value={data.goal_type} onChange={set('goal_type')} options={goals} />
                            <SelectField label="Activity level" value={data.activity_level} onChange={set('activity_level')} options={activities} />
                            <SelectField label="Dietary preference" value={data.dietary_preference} onChange={set('dietary_preference')} options={diets.map((diet) => [diet, diet.replaceAll('_', ' ')])} />
                            <SelectField label="Meals per day" value={data.meals_per_day} onChange={(v) => set('meals_per_day')(Number(v))} options={[[3, '3'], [4, '4'], [5, '5'], [6, '6']]} />
                        </div>
                    </div>

                    <div className="onboardingSection">
                        <div className="onboardingGrid">
                            <SelectField label="Budget" value={data.budget_level} onChange={set('budget_level')} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} />
                            <SelectField label="Cooking time" value={data.cooking_time_preference} onChange={set('cooking_time_preference')} options={[['quick', 'Quick'], ['moderate', 'Moderate'], ['flexible', 'Flexible']]} />
                            <Field label="Preferred cuisines" value={data.preferred_cuisines} onChange={set('preferred_cuisines')} />
                            <Field label="Allergies" value={data.allergies} onChange={set('allergies')} />
                            <Field label="Disliked foods" value={data.disliked_foods} onChange={set('disliked_foods')} />
                            <label className="onboardingField">
                                Medical notes
                                <textarea value={data.medical_notes} onChange={(e) => set('medical_notes')(e.target.value)} rows={4} />
                                {errors.medical_notes && <span className="onboardingError">{errors.medical_notes}</span>}
                            </label>
                        </div>
                    </div>

                    <div className="onboardingBottom">
                        <div>
                            <p className="onboardingProgressLabel">Setup progress</p>
                            <div className="onboardingProgressWrap">
                                <ProgressBar value={90} />
                            </div>
                        </div>
                        <button type="submit" className="onboardingBtn">Complete setup</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Metric({ icon: Icon, label }) {
    return (
        <div className="onboardingMetric">
            <Icon className="onboardingMetricIcon" />
            <p className="onboardingMetricLabel">{label}</p>
        </div>
    );
}

function Field({ label, value, error, onChange, type = 'text' }) {
    return (
        <label className="onboardingField">
            {label}
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
            {error && <span className="onboardingError">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <label className="onboardingField">
            {label}
            <select value={value} onChange={(e) => onChange(e.target.value)} style={{ textTransform: 'capitalize' }}>
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>{optionLabel}</option>
                ))}
            </select>
        </label>
    );
}
