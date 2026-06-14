import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../styles/Admin.css';
import { MessageSquare, Mail, Send, X, RefreshCw } from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
function headers() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminContactMessages() {
    const [messages, setMessages] = useState([]);
    const [replyTarget, setReplyTarget] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [replyError, setReplyError] = useState('');

    const loadMessages = () => {
        API.get('/contact', { headers: headers() })
            .then(r => setMessages(r.data.entries || []))
            .catch(() => setMessages([]));
    };

    useEffect(() => {
        document.title = 'Contact Messages';
        loadMessages();
    }, []);

    const markRead = (id) => {
        API.patch(`/admin/contact-messages/${id}/read`, {}, { headers: headers() })
            .then(() => loadMessages())
            .catch(() => {});
    };

    const openReply = (msg) => {
        setReplyTarget(msg);
        setReplyText('');
        setReplyError('');
    };

    const sendReply = () => {
        if (!replyText.trim()) { setReplyError('Reply text is required.'); return; }
        setSending(true);
        setReplyError('');
        API.post(`/admin/contact-messages/${replyTarget.id}/reply`, { reply: replyText }, { headers: headers() })
            .then(() => { setReplyTarget(null); setReplyText(''); loadMessages(); })
            .catch(err => setReplyError(err.response?.data?.error || 'Failed to send reply.'))
            .finally(() => setSending(false));
    };

    return (
        <AdminLayout>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mail size={24} color="#0f766e" />
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0 }}>Contact Messages</h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.125rem' }}>{messages.length} message{messages.length !== 1 ? 's' : ''} received</p>
                </div>
                <button onClick={loadMessages}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#0f766e'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#0f766e'; }}
                    style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 600, color: '#0f766e', background: 'transparent', border: '1px solid #0f766e', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {messages.map(m => (
                    <div key={m.id} style={{
                        background: '#fff', borderRadius: '0.75rem',
                        border: `1px solid ${m.is_read ? '#e2e8f0' : '#0f766e'}`,
                        borderLeft: m.is_read ? '1px solid #e2e8f0' : '4px solid #0f766e',
                        padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                        transition: 'box-shadow 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                                    background: m.is_read ? '#f1f5f9' : 'linear-gradient(135deg, #0f766e, #14b8a6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: m.is_read ? '#94a3b8' : '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                                }}>{m.name?.charAt(0).toUpperCase() || '?'}</div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 600, color: '#020617', fontSize: '0.9375rem' }}>{m.name}</span>
                                        {!m.is_read && (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 600,
                                                color: '#0f766e', background: '#f0fdf4',
                                                padding: '0.125rem 0.5rem', borderRadius: '999px'
                                            }}>Unread</span>
                                        )}
                                    </div>
                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{m.email}</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{m.created_at?.slice(0, 10)}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', margin: '0 0 0.5rem', paddingLeft: '3rem' }}>{m.subject}</p>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.6, paddingLeft: '3rem' }}>{m.message}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', paddingLeft: '3rem' }}>
                            {!m.is_read && (
                                <button onClick={() => markRead(m.id)}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    style={{
                                        fontSize: '0.8rem', fontWeight: 600, color: '#0f766e',
                                        background: 'transparent', border: '1px solid #0f766e',
                                        borderRadius: '0.375rem', padding: '0.375rem 0.75rem', cursor: 'pointer',
                                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.375rem'
                                    }}><MessageSquare size={14} /> Mark as read</button>
                            )}
                            <button onClick={() => openReply(m)}
                                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                style={{
                                    fontSize: '0.8rem', fontWeight: 600, color: '#0ea5e9',
                                    background: 'transparent', border: '1px solid #0ea5e9',
                                    borderRadius: '0.375rem', padding: '0.375rem 0.75rem', cursor: 'pointer',
                                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.375rem'
                                }}><Send size={14} /> Reply</button>
                        </div>
                    </div>
                ))}
                {!messages.length && (
                    <div style={{
                        textAlign: 'center', padding: '3rem', color: '#94a3b8',
                        background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0'
                    }}>
                        <MessageSquare size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                        <p style={{ fontSize: '0.9375rem', margin: 0 }}>No messages yet</p>
                    </div>
                )}
            </div>

            {replyTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
                }} onClick={() => !sending && setReplyTarget(null)}>
                    <div style={{
                        background: '#fff', borderRadius: '0.75rem', padding: '1.5rem',
                        width: 'min(90vw, 32rem)', maxHeight: '90vh', overflow: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#020617', margin: 0 }}>
                                    Reply to {replyTarget.name}
                                </h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.125rem 0 0' }}>
                                    {replyTarget.email} &middot; Re: {replyTarget.subject}
                                </p>
                            </div>
                            <button onClick={() => setReplyTarget(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{
                            background: '#f8fafc', borderRadius: '0.5rem', padding: '0.875rem',
                            fontSize: '0.875rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.6,
                            borderLeft: '3px solid #e2e8f0'
                        }}>
                            <strong style={{ color: '#020617' }}>Original message:</strong><br />
                            {replyTarget.message}
                        </div>
                        <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                            rows={6}
                            style={{
                                width: '100%', padding: '0.75rem', fontSize: '0.875rem',
                                border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                                fontFamily: 'inherit', transition: 'border-color 0.15s',
                                lineHeight: 1.5
                            }}
                            onFocus={e => e.target.style.borderColor = '#0f766e'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                        {replyError && (
                            <p style={{ fontSize: '0.8rem', color: '#b91c1c', margin: '0.5rem 0 0' }}>{replyError}</p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button onClick={() => setReplyTarget(null)} disabled={sending} style={{
                                fontSize: '0.875rem', fontWeight: 600, color: '#64748b',
                                background: '#f1f5f9', border: 'none', borderRadius: '0.5rem',
                                padding: '0.5rem 1rem', cursor: sending ? 'not-allowed' : 'pointer'
                            }}>Cancel</button>
                            <button onClick={sendReply} disabled={sending} style={{
                                fontSize: '0.875rem', fontWeight: 600, color: '#fff',
                                background: sending ? '#94a3b8' : '#0f766e', border: 'none',
                                borderRadius: '0.5rem', padding: '0.5rem 1.25rem',
                                cursor: sending ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.375rem'
                            }}><Send size={16} /> {sending ? 'Sending...' : 'Send Reply'}</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}