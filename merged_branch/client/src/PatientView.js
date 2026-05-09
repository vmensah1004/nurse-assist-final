import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './styles.css';

//const API = 'http://localhost:3000/api';
import API from './config';

const URGENCY_OPTIONS = [
    { value: 'non-emergency',     label: 'Non-Emergency',     desc: 'Not urgent, can wait',                       color: '#0369a1', bg: '#f0f9ff', border: '#7dd3fc' },
    { value: 'time-sensitive',    label: 'Time-Sensitive',    desc: 'Needs attention soon',                       color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
    { value: 'medical-emergency', label: 'Medical Emergency', desc: 'Urgent — requires immediate nurse attention', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
];

const COMMON_REQUESTS = [
    'Needs water', 'Bathroom assistance', 'Pain medication request',
    'Needs blanket', 'Help sitting up', 'Adjust bed position',
    'Call family member', 'Feeling dizzy', 'Feeling nauseous', 'IV check',
];

const STATUS_COLOR = {
    'pending':     { color: '#6b7280', label: 'Pending',     bg: '#f9fafb' },
    'in-progress': { color: '#d97706', label: 'In Progress', bg: '#fffbeb' },
    'completed':   { color: '#16a34a', label: 'Completed',   bg: '#f0fdf4' },
};

function PatientView({ currentPatient, onLogout }) {
    const [rooms, setRooms]           = useState([]);
    const [form, setForm]             = useState({
        room: currentPatient?.room || '', bed: '', title: '', description: '', type: 'non-emergency',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted]   = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [view, setView]             = useState('request');

    useEffect(() => {
        axios.get(`${API}/rooms`)
            .then(res => setRooms(res.data))
            .catch(() => {});
    }, []);

    const fetchMyRequests = () => {
        if (!form.room) return;
        axios.get(`${API}/tasks`)
            .then(res => {
                const fullRoom = `Room ${form.room}${form.bed ? ` Bed ${form.bed}` : ''}`;
                const mine = res.data.filter(t =>
                    t.room === fullRoom ||
                    (!form.bed && t.room === `Room ${form.room}`)
                );
                setMyRequests(mine);
            })
            .catch(() => {});
    };

    useEffect(() => {
        if (view === 'history') fetchMyRequests();
    }, [view, form.room]);

    const handleSubmit = async () => {
        if (!form.room.trim())  return alert('Please select your room.');
        if (!form.title.trim()) return alert('Please describe your request.');
        setSubmitting(true);
        try {
            await axios.post(`${API}/tasks`, {
                type:        form.type,
                room:        `Room ${form.room}${form.bed ? ` Bed ${form.bed}` : ''}`,
                bedLabel:    form.bed || '',
                title:       form.title,
                description: form.description,
            });
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setForm(prev => ({ ...prev, bed: '', title: '', description: '', type: 'non-emergency' }));
            }, 3000);
        } catch { alert('Error submitting request.'); }
        setSubmitting(false);
    };

    return (
        <>
            <Navbar role="patient" currentPatient={currentPatient} onLogout={onLogout} />
            <div className="page--narrow">

                {/* Header */}
                <div className="card card--header">
                    <div>
                        <h1 className="page-title">Request Assistance</h1>
                        <p className="page-subtitle">
                            {currentPatient ? `${currentPatient.name} · Room ${currentPatient.room}` : 'Submit a request to your care team'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`filter-btn${view === 'request' ? ' active' : ''}`} onClick={() => setView('request')}>
                            New Request
                        </button>
                        <button className={`filter-btn${view === 'history' ? ' active' : ''}`} onClick={() => setView('history')}>
                            My Requests
                        </button>
                    </div>
                </div>

                {/* Request Form */}
                {view === 'request' && (
                    submitted ? (
                        <div className="card" style={{ textAlign: 'center', background: '#f0fdf4', border: '2px solid #86efac' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✓</div>
                            <h2 style={{ color: '#16a34a', fontWeight: 'normal', fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
                                Request Submitted
                            </h2>
                            <p className="page-subtitle">Your care team has been notified and will be with you shortly.</p>
                        </div>
                    ) : (
                        <div className="card">
                            {/* Room */}
                            <label className="form-label">Your Room *</label>
                            <select className="form-input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>
                                <option value="">-- Select your room --</option>
                                {rooms.length > 0 ? (
                                    rooms.map(r => (
                                        <option key={r._id} value={r.roomNumber}>
                                            Room {r.roomNumber} — Floor {r.floor}
                                        </option>
                                    ))
                                ) : (
                                    ['101','102','103','104','201','202','203','204','301','302','303','304'].map(n => (
                                        <option key={n} value={n}>Room {n}</option>
                                    ))
                                )}
                            </select>

                            {/* Bed */}
                            <label className="form-label">Your Bed *</label>
                            <select className="form-input" value={form.bed} onChange={e => setForm({ ...form, bed: e.target.value })}>
                                <option value="">-- Select your bed --</option>
                                <option value="A">Bed A</option>
                                <option value="B">Bed B</option>
                            </select>

                            {/* Urgency */}
                            <label className="form-label">How urgent is this?</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                {URGENCY_OPTIONS.map(opt => (
                                    <div
                                        key={opt.value}
                                        onClick={() => setForm({ ...form, type: opt.value })}
                                        style={{
                                            background:  form.type === opt.value ? opt.bg    : '#fff',
                                            border:      `2px solid ${form.type === opt.value ? opt.color : '#d4cfc8'}`,
                                            borderRadius: '10px', padding: '0.75rem 1rem', cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: opt.color, marginBottom: '0.2rem' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b6560' }}>{opt.desc}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick select */}
                            <label className="form-label">Common Requests</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {COMMON_REQUESTS.map(req => (
                                    <button
                                        key={req}
                                        onClick={() => setForm({ ...form, title: req })}
                                        className={`filter-btn${form.title === req ? ' active' : ''}`}
                                        style={{ borderRadius: '20px' }}
                                    >
                                        {req}
                                    </button>
                                ))}
                            </div>

                            {/* Title */}
                            <label className="form-label">Request *</label>
                            <input
                                className="form-input"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Describe what you need..."
                            />

                            {/* Description */}
                            <label className="form-label">Additional Details</label>
                            <textarea
                                className="form-input"
                                style={{ resize: 'vertical' }}
                                rows={3}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Any additional information for your care team..."
                            />

                            <button
                                className="btn btn--primary btn--full"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting…' : 'Submit Request'}
                            </button>
                        </div>
                    )
                )}

                {/* My Requests History */}
                {view === 'history' && (
                    !form.room ? (
                        <div className="card empty-state">
                            Select your room on the Request tab to see your request history.
                        </div>
                    ) : myRequests.length === 0 ? (
                        <div className="card empty-state">No requests found for your room.</div>
                    ) : (
                        myRequests.map(task => {
                            const sc = STATUS_COLOR[task.status] || STATUS_COLOR['pending'];
                            return (
                                <div key={task._id} className="card" style={{ background: sc.bg, marginBottom: '1rem', padding: '1.25rem 1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{task.title}</span>
                                        <span style={{ fontSize: '0.78rem', color: sc.color, fontWeight: 'bold', background: '#fff', padding: '0.2rem 0.65rem', borderRadius: '6px', border: `1px solid ${sc.color}` }}>
                                            {sc.label}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="page-subtitle" style={{ marginTop: '0.25rem' }}>{task.description}</p>
                                    )}
                                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.4rem' }}>
                                        Submitted {task.submittedAt ? new Date(task.submittedAt).toLocaleString() : '—'}
                                        {task.completedAt && ` · Completed ${new Date(task.completedAt).toLocaleString()}`}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </>
    );
}

export default PatientView;