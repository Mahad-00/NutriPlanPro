import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../componenets/BrandLogo';
import GuestLayout from '../../Layouts/GuestLayout';
import '../../styles/ResetPassword.css';

const API = axios.create({ baseURL: '/api' });

export default function ResetPassword() {
    const location = useLocation();
    const email = location.state?.email || '';
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => { document.title = 'Reset Password'; }, []);

    useEffect(() => {
        if (!email) navigate('/forgot-password');
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!password) newErrors.password = 'Password is required.';
        if (password !== passwordConfirmation) newErrors.password_confirmation = 'Passwords do not match.';
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
        setProcessing(true);
        try {
            await API.post('/auth/reset-password', {
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            navigate('/login', { state: { status: 'Password reset successfully. Please log in.' } });
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: 'Reset failed. Try again.' });
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

                        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Choose a new password for <strong>{email}</strong>.
                        </p>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="formGroup">
                                <label htmlFor="password">New Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={password}
                                    autoComplete="new-password"
                                    onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                                />
                                {errors.password && <p className="fieldError">{errors.password}</p>}
                            </div>
                            <div className="formGroup">
                                <label htmlFor="password_confirmation">Confirm New Password</label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={passwordConfirmation}
                                    autoComplete="new-password"
                                    onChange={(e) => { setPasswordConfirmation(e.target.value); setErrors({}); }}
                                />
                                {errors.password_confirmation && <p className="fieldError">{errors.password_confirmation}</p>}
                            </div>
                            <div className="authActions" style={{ marginTop: '1.5rem' }}>
                                <Link to="/login" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    Back to login
                                </Link>
                                <button type="submit" className="authSubmitBtn" disabled={processing}>
                                    {processing ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
