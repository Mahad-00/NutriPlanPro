import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../componenets/BrandLogo';
import GuestLayout from '../../Layouts/GuestLayout';
import '../../styles/ConfirmPassword.css';

export default function ConfirmPassword() {
    const [data, setData] = useState({ password: '' });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => { document.title = 'Confirm Password'; }, []);

    const handleChange = (field) => (e) => {
        setData((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!data.password) newErrors.password = 'Password is required.';
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
        setProcessing(true);
        setTimeout(() => setProcessing(false), 1000);
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
                        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            This is a secure area of the application. Please confirm your
                            password before continuing.
                        </p>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="formGroup">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={handleChange('password')}
                                />
                                {errors.password && (
                                    <p className="fieldError">{errors.password}</p>
                                )}
                            </div>
                            <div className="authActions" style={{ marginTop: '1.5rem' }}>
                                <Link to="/login" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    Back to login
                                </Link>
                                <button type="submit" className="authSubmitBtn" disabled={processing}>
                                    {processing ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
