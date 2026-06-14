import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../componenets/BrandLogo';
import GuestLayout from '../../Layouts/GuestLayout';
import '../../styles/ForgotPassword.css';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function VerifyResetCode() {
    const location = useLocation();
    const email = location.state?.email || '';
    const navigate = useNavigate();

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => { document.title = 'Verify Reset Code'; }, []);

    useEffect(() => {
        if (!email) navigate('/forgot-password');
    }, [email, navigate]);

    const handleDigit = (idx, value) => {
        if (value && !/^\d$/.test(value)) return;
        const newCode = [...code];
        newCode[idx] = value;
        setCode(newCode);
        setErrors({});
        if (value && idx < 5) {
            const next = document.getElementById(`code-${idx + 1}`);
            if (next) next.focus();
        }
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) {
            const prev = document.getElementById(`code-${idx - 1}`);
            if (prev) prev.focus();
        }
    };

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
        a + '*'.repeat(Math.min(b.length, 6)) + c
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setErrors({ code: 'Enter all 6 digits.' });
            return;
        }
        setProcessing(true);
        try {
            await API.post('/auth/verify-reset-code', { email, code: fullCode });
            navigate('/reset-password', { state: { email } });
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ code: 'Verification failed. Try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleResend = async () => {
        setProcessing(true);
        try {
            await API.post('/auth/forgot-password', { email });
            setErrors({});
            setCode(['', '', '', '', '', '']);
            document.getElementById('code-0')?.focus();
        } catch {
            setErrors({ code: 'Failed to resend. Try again.' });
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
                        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                            Enter the 6-digit code sent to
                        </p>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#020617', marginBottom: '1.5rem' }}>
                            {maskedEmail}
                        </p>

                        {errors.code && <div className="authStatus" style={{ color: '#ef4444', background: '#fef2f2', borderColor: '#fecaca', marginBottom: '1rem' }}>{errors.code}</div>}

                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', textAlign: 'center' }}>
                            Didn't receive it? Check your <strong>spam folder</strong>.
                        </p>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="formGroup">
                                <label>Code</label>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                                    {code.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            id={`code-${idx}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            autoFocus={idx === 0}
                                            onChange={(e) => handleDigit(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            style={{
                                                width: '3rem',
                                                height: '3.5rem',
                                                textAlign: 'center',
                                                fontSize: '1.5rem',
                                                fontWeight: 700,
                                                borderRadius: '0.5rem',
                                                border: errors.code ? '2px solid #ef4444' : '1px solid #e2e8f0',
                                                outline: 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="authActions" style={{ marginTop: '1.5rem', flexDirection: 'column', gap: '0.75rem' }}>
                                <button type="submit" className="authSubmitBtn" disabled={processing} style={{ width: '100%' }}>
                                    {processing ? 'Verifying...' : 'Verify Code'}
                                </button>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <button type="button" onClick={handleResend} disabled={processing}
                                        style={{ fontSize: '0.875rem', color: '#0f766e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                        Resend code
                                    </button>
                                    <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                        Change email
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
