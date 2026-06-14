import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../componenets/BrandLogo';
import GuestLayout from '../../Layouts/GuestLayout';
import '../../styles/Auth.css';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function Login({ status, canResetPassword = true }) {
    const [data, setData] = useState({ email: '', password: '', remember: false });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const navigate = useNavigate();
    useEffect(() => { document.title = 'Log in'; }, []);

    const handleChange = (field) => (e) => {
        const value = field === 'remember' ? e.target.checked : e.target.value;
        setData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!data.email.trim()) errs.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
            errs.email = 'Please enter a valid email address.';
        if (!data.password) errs.password = 'Password is required.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const clientErrors = validate();
        if (Object.keys(clientErrors).length) { setErrors(clientErrors); return; }
        setProcessing(true);
        try {
            const res = await API.post('/auth/login', {
                email: data.email.trim(),
                password: data.password,
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate(res.data.user?.is_admin ? '/admin' : '/dashboard');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: 'Login failed. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

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
                        {status && <div className="authStatus">{status}</div>}
                        {errors.general && <div className="authStatus" style={{ color: '#ef4444', background: '#fef2f2', borderColor: '#fecaca' }}>{errors.general}</div>}
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="formGroup">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email" type="email" name="email"
                                    value={data.email} autoComplete="username"
                                    onChange={handleChange('email')}
                                />
                                {errors.email && <p className="fieldError">{errors.email}</p>}
                            </div>
                            <div className="formGroup">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password" type="password" name="password"
                                    value={data.password} autoComplete="current-password"
                                    onChange={handleChange('password')}
                                />
                                {errors.password && <p className="fieldError">{errors.password}</p>}
                            </div>
                            <div className="checkboxRow">
                                <input
                                    id="remember" type="checkbox" name="remember"
                                    checked={data.remember}
                                    onChange={handleChange('remember')}
                                />
                                <label htmlFor="remember">Remember me</label>
                            </div>
                            <div className="authActions">
                                {canResetPassword && (
                                    <Link to="/forgot-password">Forgot your password?</Link>
                                )}
                                <button type="submit" className="authSubmitBtn" disabled={processing}>
                                    {processing ? 'Logging in...' : 'Log in'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
