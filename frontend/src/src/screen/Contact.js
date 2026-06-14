import { useEffect, useState } from 'react';
import axios from 'axios';
import PublicLayout from '../Layouts/PublicLayout';
import '../styles/Contact.css';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function Contact() {
    const [data, setData] = useState({ name: '', email: '', subject: '', message: '' });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => { document.title = 'Contact'; }, []);

    const handleChange = (field) => (e) => {
        setData((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!data.name.trim()) newErrors.name = 'Name is required.';
        if (!data.email.trim()) newErrors.email = 'Email is required.';
        if (!data.subject.trim()) newErrors.subject = 'Subject is required.';
        if (!data.message.trim()) newErrors.message = 'Message is required.';

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            return;
        }

        setProcessing(true);
        try {
            await API.post('/contact', data);
            setSubmitted(true);
            setData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: 'Failed to send. Try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const fields = ['name', 'email', 'subject'];

    return (
        <PublicLayout>
            <section className="contactPage">
                <div className="contactInner">
                <div>
                    <h1 className="contactTitle">Contact NutriPlan Pro</h1>
                    <p className="contactDesc">Questions about nutrition workflows, SaaS setup, or product planning can start here.</p>
                </div>
                {submitted ? (
                    <div className="contactForm" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f766e' }}>Message sent!</p>
                        <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.5rem' }}>We'll get back to you soon.</p>
                        <button className="submitBtn" style={{ marginTop: '1rem' }} onClick={() => setSubmitted(false)}>
                            Send another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="contactForm">
                        {errors.general && <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{errors.general}</div>}
                        {fields.map((field) => (
                            <label key={field} className="formField">
                                {field}
                                <input
                                    value={data[field]}
                                    onChange={handleChange(field)}
                                />
                                {errors[field] && <span className="formError">{errors[field]}</span>}
                            </label>
                        ))}
                        <label className="formField">
                            Message
                            <textarea
                                value={data.message}
                                onChange={handleChange('message')}
                                rows={6}
                            />
                            {errors.message && <span className="formError">{errors.message}</span>}
                        </label>
                        <button type="submit" disabled={processing} className="submitBtn">
                            {processing ? 'Sending...' : 'Send message'}
                        </button>
                    </form>
                )}
                </div>
            </section>
        </PublicLayout>
    );
}
