import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './styles.css';

//const API = 'http://localhost:3000/api';
import API from './config';

const TYPE_STYLES = {
    'medical-emergency': { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', label: 'High Priority' },
    'time-sensitive':    { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', label: 'Medium Priority' },
    'non-emergency':     { bg: '#f0f9ff', border: '#7dd3fc', badge: '#0369a1', label: 'Low Priority' },
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

function NursePool({ currentNurse, onLogout }) {
    const [pending, setPending]       = useState([]);
    const [myTasks, setMyTasks]       = useState([]);
    const [typeFilter, setTypeFilter] = useState('all');
    const [accepted, setAccepted]     = useState({});
    const [declined, setDeclined]     = useState({});
    const [view, setView]             = useState('pool');
    const [completed, setCompleted]   = useState([]);

    const fetchPending = () => {
        axios.get(`${API}/tasks?status=pending`)
            .then(res => setPending(res.data))
            .catch(() => {});
    };

    const fetchMyTasks = () => {
        axios.get(`${API}/tasks?status=in-progress`)
            .then(res => {
                const mine = res.data.filter(t =>
                    currentNurse && String(t.assignedTo) === String(currentNurse._id)
                );
                setMyTasks(mine);
            })
            .catch(() => {});
    };

    const fetchCompleted = () => {
        axios.get(`${API}/tasks?status=completed`)
            .then(res => setCompleted(res.data))
            .catch(() => {});
    };

    useEffect(() => {
        fetchPending();
        fetchMyTasks();
        const interval = setInterval(fetchPending, 20000);
        return () => clearInterval(interval);
    }, [currentNurse]);

    const handleAccept = async (task) => {
        if (!currentNurse) return alert('No nurse selected.');
        try {
            await axios.patch(`${API}/tasks/${task._id}/assign`, { nurseId: currentNurse._id });
        } catch { /* continue with optimistic update */ }
        setAccepted(prev => ({ ...prev, [task._id]: true }));
        setPending(prev => prev.filter(t => t._id !== task._id));
        setMyTasks(prev => [...prev, { ...task, acceptedAt: new Date().toISOString() }]);
    };

    const handleDecline = (taskId) => {
        setDeclined(prev => ({ ...prev, [taskId]: true }));
    };

    const handleComplete = async (task) => {
        try {
            await axios.patch(`${API}/tasks/${task._id}/complete`);
            setMyTasks(prev => prev.filter(t => t._id !== task._id));
            fetchCompleted();
        } catch { alert('Error completing task.'); }
    };

    const visiblePending = typeFilter === 'all'
        ? pending
        : pending.filter(t => t.type === typeFilter);

    return (
        <>
            <Navbar role="nurse" currentNurse={currentNurse} onLogout={onLogout} />
            <div className="page">

                {/* Header */}
                <div className="card card--header">
                    <div>
                        <h1 className="page-title">Task Pool</h1>
                        <p className="page-subtitle">
                            {currentNurse ? `${currentNurse.name} — ${currentNurse.role}` : 'No nurse selected'}
                            {' · '}{pending.length} pending · {myTasks.length} in progress
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`filter-btn${view === 'pool' ? ' active' : ''}`} onClick={() => setView('pool')}>
                            Pool ({pending.length})
                        </button>
                        <button className={`filter-btn${view === 'mine' ? ' active' : ''}`} onClick={() => { setView('mine'); fetchMyTasks(); }}>
                            My Tasks ({myTasks.length})
                        </button>
                        <button className={`filter-btn${view === 'completed' ? ' active' : ''}`} onClick={() => { setView('completed'); fetchCompleted(); }}>
                            Completed
                        </button>
                    </div>
                </div>

                {/* Pool View */}
                {view === 'pool' && (
                    <>
                        <div className="filter-bar">
                            <span className="filter-label">Priority:</span>
                            {['all', 'medical-emergency', 'time-sensitive', 'non-emergency'].map(t => (
                                <button key={t} className={`filter-btn${typeFilter === t ? ' active' : ''}`} onClick={() => setTypeFilter(t)}>
                                    {t === 'all' ? 'All' : TYPE_STYLES[t].label}
                                </button>
                            ))}
                        </div>

                        {visiblePending.length === 0 ? (
                            <div className="card empty-state">No tasks in the pool.</div>
                        ) : (
                            visiblePending.map(task => {
                                const tStyle    = TYPE_STYLES[task.type] || TYPE_STYLES['non-emergency'];
                                const isDeclined = declined[task._id];
                                const isAccepted = accepted[task._id];
                                return (
                                    <div key={task._id} className="task-card" style={{
                                        background:  isDeclined ? '#f9f9f9' : tStyle.bg,
                                        borderColor: isDeclined ? '#e5e0d8' : tStyle.border,
                                        opacity:     isDeclined ? 0.5 : 1
                                    }}>
                                        <div className="task-card__header">
                                            <div className="task-card__title-row">
                                                <span className="task-card__badge" style={{ background: tStyle.badge }}>{tStyle.label}</span>
                                                <span style={{ fontSize: '0.82rem', color: '#6b6560' }}>🚪 {task.room}</span>
                                            </div>
                                            <span className="task-card__age">{timeAgo(task.submittedAt)}</span>
                                        </div>

                                        <h3 className="task-card__title" style={{ fontWeight: 'normal', marginBottom: '0.4rem' }}>{task.title}</h3>
                                        <p className="task-card__description">{task.description}</p>

                                        <div className="task-card__actions" style={{ marginTop: '0.75rem' }}>
                                            {isDeclined ? (
                                                <span style={{ fontSize: '0.82rem', color: '#dc2626' }}>Declined</span>
                                            ) : isAccepted ? (
                                                <span style={{ fontSize: '0.82rem', color: '#16a34a', background: '#f0fdf4', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>
                                                    ✓ Accepted — assigned to you
                                                </span>
                                            ) : (
                                                <>
                                                    <button className="btn btn--secondary btn--small" onClick={() => handleDecline(task._id)}>Decline</button>
                                                    <button className="btn btn--small" style={{ background: '#eef6f1', color: '#1a5c3a', border: '1px solid #a8c5b5' }} onClick={() => handleAccept(task)}>Accept</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}

                {/* My Tasks View */}
                {view === 'mine' && (
                    myTasks.length === 0 ? (
                        <div className="card empty-state">You have no tasks in progress.</div>
                    ) : (
                        myTasks.map(task => {
                            const tStyle = TYPE_STYLES[task.type] || TYPE_STYLES['non-emergency'];
                            return (
                                <div key={task._id} className="task-card" style={{ background: tStyle.bg, borderColor: tStyle.border }}>
                                    <div className="task-card__header">
                                        <div className="task-card__title-row">
                                            <span className="task-card__badge" style={{ background: tStyle.badge }}>{tStyle.label}</span>
                                            <span style={{ fontSize: '0.82rem', color: '#6b6560' }}>🚪 {task.room}</span>
                                        </div>
                                        <span className="task-card__age">Accepted {timeAgo(task.acceptedAt || task.submittedAt)}</span>
                                    </div>
                                    <h3 className="task-card__title" style={{ fontWeight: 'normal', marginBottom: '0.4rem' }}>{task.title}</h3>
                                    <p className="task-card__description">{task.description}</p>
                                    <div className="task-card__actions" style={{ marginTop: '0.75rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.78rem', background: '#eef6f1', color: '#1a5c3a', borderRadius: '6px', padding: '0.2rem 0.65rem' }}>
                                            In Progress
                                        </span>
                                        <button className="btn btn--primary btn--small" onClick={() => handleComplete(task)}>
                                            Mark Complete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}

                {/* Completed View */}
                {view === 'completed' && (
                    completed.length === 0 ? (
                        <div className="card empty-state">No completed tasks yet.</div>
                    ) : (
                        completed.map(task => {
                            const tStyle = TYPE_STYLES[task.type] || TYPE_STYLES['non-emergency'];
                            return (
                                <div key={task._id} className="task-card" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                                    <div className="task-card__header">
                                        <div className="task-card__title-row">
                                            <span className="task-card__badge" style={{ background: tStyle.badge }}>{tStyle.label}</span>
                                            <span style={{ fontSize: '0.82rem', color: '#6b6560' }}>🚪 {task.room}</span>
                                            <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#16a34a', borderRadius: '6px', padding: '0.15rem 0.55rem' }}>✓ Completed</span>
                                        </div>
                                        <span className="task-card__age">{timeAgo(task.completedAt)}</span>
                                    </div>
                                    <h3 className="task-card__title" style={{ fontWeight: 'normal', marginBottom: '0.4rem' }}>{task.title}</h3>
                                    <p className="task-card__description">{task.description}</p>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </>
    );
}

export default NursePool;