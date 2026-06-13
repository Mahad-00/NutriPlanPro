import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../componenets/BrandLogo';
import GuestLayout from '../../Layouts/GuestLayout';
import '../../styles/ForgotPassword.css';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { document.title = 'Forgot Password'; }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Email is required.';
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
        setProcessing(true);
        try {
            await API.post('/auth/forgot-password', { email: email.trim() });
            setSent(true);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: 'Failed to send code. Try again.' });
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
                        {errors.general && <div className="authStatus" style={{ color: '#ef4444', background: '#fef2f2', borderColor: '#fecaca' }}>{errors.general}</div>}

                        {sent ? (
                            <div style={{ textAlign: 'center' }}>
                                <div className="authStatus" style={{ color: '#0f766e', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                    Code sent! Check your inbox.
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#475569', margin: '1rem 0', lineHeight: '1.5' }}>
                                    If you don't see the email, check your <strong>spam folder</strong> and mark it as "Not Spam".
                                </p>
                                <button onClick={() => navigate('/verify-reset-code', { state: { email } })}
                                    className="authSubmitBtn" style={{ width: '100%' }}>
                                    Enter Code
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate>
                                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                    Forgot your password? No problem. Just let us know your email
                                    address and we will send you a 6-digit code to reset it.
                                </p>
                                <div className="formGroup">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={email}
                                        autoComplete="email"
                                        onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                                    />
                                    {errors.email && (
                                        <p className="fieldError">{errors.email}</p>
                                    )}
                                </div>
                                <div className="authActions" style={{ marginTop: '1.5rem' }}>
                                    <Link to="/login" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        Back to login
                                    </Link>
                                    <button type="submit" className="authSubmitBtn" disabled={processing}>
                                        {processing ? 'Sending...' : 'Send Reset Code'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
