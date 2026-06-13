import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../componenets/BrandLogo';
import GuestLayout from '../../Layouts/GuestLayout';
import '../../styles/VerifyEmail.css';

export default function VerifyEmail({ status }) {
    const [processing, setProcessing] = useState(false);
    const [resent, setResent] = useState(false);

    useEffect(() => { document.title = 'Verify Email'; }, []);

    const handleResend = (e) => {
        e.preventDefault();
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setResent(true);
        }, 1000);
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
                        {resent && <div className="authStatus">Verification link resent!</div>}

                        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Thanks for signing up! Before getting started, could you verify
                            your email address by clicking on the link we just emailed to
                            you? If you didn't receive the email, we will gladly send you
                            another.
                        </p>

                        <form onSubmit={handleResend}>
                            <div className="authActions" style={{ marginTop: '1.5rem' }}>
                                <Link to="/login" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    Back to login
                                </Link>
                                <button type="submit" className="authSubmitBtn" disabled={processing}>
                                    {processing ? 'Sending...' : 'Resend Verification Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
