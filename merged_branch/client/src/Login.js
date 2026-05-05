import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';

const API = 'http://localhost:3000/api';

// Hardcoded patient accounts for the prototype
// In a real app these would be in the database
const PATIENT_ACCOUNTS = [
    { username: 'patient1', password: 'pass123', name: 'John Smith',      room: '101' },
    { username: 'patient2', password: 'pass123', name: 'Mary Johnson',    room: '102' },
    { username: 'patient3', password: 'pass123', name: 'David Brown',     room: '201' },
    { username: 'patient4', password: 'pass123', name: 'Sarah Davis',     room: '202' },
    { username: 'patient5', password: 'pass123', name: 'Michael Wilson',  room: '301' },
];

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole]         = useState('nurse');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter your username and password.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (role === 'nurse') {
                // Check against nurses collection in MongoDB
                const res = await axios.get(`${API}/nurses?all=true`);
                const nurses = res.data;

                // Match by name prefix as username 
                const match = nurses.find(n =>
                    n.name.toLowerCase().startsWith(username.toLowerCase()) ||
                    n.name.toLowerCase().replace(/\s/g, '') === username.toLowerCase()
                );

                if (!match) {
                    setError('Nurse not found. Try your first name (example: "dylan").');
                    setLoading(false);
                    return;
                }

                // Simple password check — in a real app this would be hashed
                if (password !== 'nurse123') {
                    setError('Incorrect password.');
                    setLoading(false);
                    return;
                }

                onLogin({ role: 'nurse', user: match });

            } else if (role === 'admin') {
                // Simple hardcoded admin credentials for prototype
                if (username === 'admin' && password === 'admin123') {
                    onLogin({ role: 'admin', user: { name: 'Admin', role: 'Admin' } });
                } else {
                    setError('Invalid admin credentials.');
                }

            } else if (role === 'patient') {
                const match = PATIENT_ACCOUNTS.find(p =>
                    p.username === username.toLowerCase() && p.password === password
                );
                if (!match) {
                    setError('Invalid patient credentials.');
                    setLoading(false);
                    return;
                }
                onLogin({ role: 'patient', user: { name: match.name, room: match.room } });
            }
        } catch {
            setError('Error connecting to server. Make sure the server is running.');
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    const ROLE_INFO = {
        nurse:   { icon: '🏥', label: 'Nurse / NA',  desc: 'Access task pool and dashboard',    hint: 'Username: your first name (example: dylan) · Password: nurse123' },
        admin:   { icon: '📋', label: 'Admin',        desc: 'Manage rooms and oversee tasks',    hint: 'Username: admin · Password: admin123' },
        patient: { icon: '🛏️', label: 'Patient',      desc: 'Submit and track care requests',    hint: 'Username: patient1–5 · Password: pass123' },
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#faf9f7',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Georgia, serif', padding: '2rem'
        }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏥</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#b20cb2', margin: 0 }}>
                    NurseAssist
                </h1>
                <p style={{ color: '#6b6560', fontSize: '0.88rem', margin: '0.35rem 0 0' }}>
                    Hospital Care Coordination
                </p>
            </div>

            {/* Login Card */}
            <div className="card" style={{ width: '100%', maxWidth: '420px' }}>

                {/* Role selector */}
                <label className="form-label">I am a...</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {Object.entries(ROLE_INFO).map(([key, info]) => (
                        <div
                            key={key}
                            onClick={() => { setRole(key); setError(''); }}
                            style={{
                                background:   role === key ? '#fdf4ff' : '#fff',
                                border:       `2px solid ${role === key ? '#b20cb2' : '#d4cfc8'}`,
                                borderRadius: '10px', padding: '0.85rem 0.5rem',
                                textAlign:    'center', cursor: 'pointer'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{info.icon}</div>
                            <div style={{ fontSize: '0.8rem', color: role === key ? '#b20cb2' : '#444', fontWeight: role === key ? 'bold' : 'normal' }}>
                                {info.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Role description */}
                <div style={{
                    background: '#fdf4ff', border: '1px solid #e9d5ff',
                    borderRadius: '8px', padding: '0.65rem 0.9rem',
                    marginBottom: '1.25rem', fontSize: '0.82rem', color: '#6b21a8'
                }}>
                    <strong>{ROLE_INFO[role].label}:</strong> {ROLE_INFO[role].desc}
                    <br />
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        💡 {ROLE_INFO[role].hint}
                    </span>
                </div>

                {/* Username */}
                <label className="form-label">Username</label>
                <input
                    className="form-input"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={role === 'nurse' ? 'example: dylan' : role === 'admin' ? 'admin' : 'example: patient1'}
                    autoFocus
                />

                {/* Password */}
                <label className="form-label">Password</label>
                <input
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Password"
                />

                {/* Error */}
                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fca5a5',
                        borderRadius: '8px', padding: '0.65rem 0.9rem',
                        marginBottom: '0.75rem', fontSize: '0.85rem', color: '#dc2626'
                    }}>
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    className="btn btn--primary btn--full"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </div>

            {/* Demo credentials reminder */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af' }}>
                Demo · All credentials shown above in the login hints
            </div>
        </div>
    );
}

export default Login;
