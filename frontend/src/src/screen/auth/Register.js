import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../componenets/BrandLogo';
import GuestLayout from '../../Layouts/GuestLayout';
import '../../styles/Auth.css';

const API = axios.create({ baseURL: '/api' });

export default function Register() {
    const [data, setData] = useState({
        name: '', email: '', password: '', password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const navigate = useNavigate();
    useEffect(() => { document.title = 'Register'; }, []);

    const handleChange = (field) => (e) => {
        setData((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!data.name.trim()) errs.name = 'Name is required.';
        else if (data.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
        if (!data.email.trim()) errs.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
            errs.email = 'Please enter a valid email address.';
        if (!data.password) errs.password = 'Password is required.';
        else {
            if (data.password.length < 8) errs.password = 'Password must be at least 8 characters.';
            else if (!/[A-Z]/.test(data.password))
                errs.password = 'Password must contain an uppercase letter.';
            else if (!/[a-z]/.test(data.password))
                errs.password = 'Password must contain a lowercase letter.';
            else if (!/\d/.test(data.password))
                errs.password = 'Password must contain a number.';
        }
        if (data.password !== data.password_confirmation)
            errs.password_confirmation = 'Passwords do not match.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const clientErrors = validate();
        if (Object.keys(clientErrors).length) { setErrors(clientErrors); return; }
        setProcessing(true);
        try {
            const res = await API.post('/auth/register', {
                name: data.name.trim(),
                email: data.email.trim(),
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/onboarding');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: 'Registration failed. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const fields = [
        { key: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
        { key: 'email', label: 'Email', type: 'email', autoComplete: 'username' },
        { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
        { key: 'password_confirmation', label: 'Confirm Password', type: 'password', autoComplete: 'new-password' },
    ];

    return (
        <GuestLayout>
            <div className="authPage">
                <div className="authInner">
                    <div className="authHero">
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <BrandLogo />
                        </Link>
                        <h2 className="authHeroHeadline">
                            Plan smarter. Eat better. Track with confidence.
                        </h2>
                        <p className="authHeroDesc">
                            A premium nutrition workspace for meal plans, macros, exercise,
                            grocery lists, and steady health progress.
                        </p>
                        <div className="authHeroTags">
                            <span className="authHeroTag">Macro clarity</span>
                            <span className="authHeroTag">Meal planning</span>
                            <span className="authHeroTag">Progress habits</span>
                        </div>
                    </div>
                    <div className="authCard">
                        {errors.general && <div className="authStatus" style={{ color: '#ef4444', background: '#fef2f2', borderColor: '#fecaca' }}>{errors.general}</div>}
                        <form onSubmit={handleSubmit} noValidate>
                            {fields.map(({ key, label, type, autoComplete }) => (
                                <div className="formGroup" key={key}>
                                    <label htmlFor={key}>{label}</label>
                                    <input
                                        id={key} type={type} name={key}
                                        value={data[key]} autoComplete={autoComplete}
                                        onChange={handleChange(key)}
                                    />
                                    {errors[key] && <p className="fieldError">{errors[key]}</p>}
                                </div>
                            ))}
                            <div className="authActions" style={{ marginTop: '1.5rem' }}>
                                <Link to="/login" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                                    Already registered?
                                </Link>
                                <button type="submit" className="authSubmitBtn" disabled={processing}>
                                    {processing ? 'Registering...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
