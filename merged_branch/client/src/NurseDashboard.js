import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './styles.css';

const API = 'http://localhost:3000/api';

const TYPE_STYLES = {
    'medical-emergency': { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', label: 'High Priority' },
    'time-sensitive':    { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', label: 'Medium Priority' },
    'non-emergency':     { bg: '#f0f9ff', border: '#7dd3fc', badge: '#0369a1', label: 'Low Priority' },
};

const STATUS_STYLES = {
    'pending':     { color: '#6b7280', label: 'Pending' },
    'in-progress': { color: '#d97706', label: 'In Progress' },
    'completed':   { color: '#16a34a', label: 'Completed' },
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

function NurseDashboard({ currentNurse, onLogout }) {
    const [tasks, setTasks]               = useState([]);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter]     = useState('all');
    const [sortBy, setSortBy]             = useState('time');

    const fetchTasks = () => {
        axios.get(`${API}/tasks`)
            .then(res => setTasks(res.data))
            .catch(() => {});
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleStatusChange = async (task, newStatus) => {
        try {
            if (newStatus === 'completed') {
                await axios.patch(`${API}/tasks/${task._id}/complete`);
            } else {
                await axios.patch(`${API}/tasks/${task._id}`, { status: newStatus });
            }
            fetchTasks();
        } catch { alert('Error updating status.'); }
    };

    const handlePriorityChange = async (task, newType) => {
        try {
            await axios.patch(`${API}/tasks/${task._id}`, { type: newType });
            fetchTasks();
        } catch { alert('Error updating priority.'); }
    };

    const priorityRank = (type) => {
        if (type === 'medical-emergency') return 1;
        if (type === 'time-sensitive')    return 2;
        return 3;
    };

    let filtered = [...tasks];
    if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(t =>
            t.room?.toLowerCase().includes(q) ||
            t.title?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q)
        );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    if (typeFilter   !== 'all') filtered = filtered.filter(t => t.type   === typeFilter);
    if (sortBy === 'priority') {
        filtered.sort((a, b) => priorityRank(a.type) - priorityRank(b.type));
    } else {
        filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    }

    const myCount        = tasks.filter(t => currentNurse && String(t.assignedTo) === String(currentNurse._id)).length;
    const pendingCount   = tasks.filter(t => t.status === 'pending').length;
    const progressCount  = tasks.filter(t => t.status === 'in-progress').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    const stats = [
        { label: 'My Tasks',    value: myCount,        color: '#b20cb2' },
        { label: 'Pending',     value: pendingCount,   color: '#6b7280' },
        { label: 'In Progress', value: progressCount,  color: '#d97706' },
        { label: 'Completed',   value: completedCount, color: '#16a34a' },
    ];

    return (
        <>
            <Navbar role="nurse" currentNurse={currentNurse} onLogout={onLogout} />
            <div className="page">

                {/* Header */}
                <div className="card">
                    <h1 className="page-title">Nurse Dashboard</h1>
                    <p className="page-subtitle">
                        {currentNurse ? `${currentNurse.name} — ${currentNurse.role}` : 'No nurse selected'}
                    </p>
                </div>

                {/* Stats */}
                <div className="stat-grid">
                    {stats.map(s => (
                        <div key={s.label} className="card--compact">
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search + Sort */}
                <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search by room, title, or description..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="filter-label">Sort:</span>
                        <button className={`filter-btn${sortBy === 'time' ? ' active' : ''}`} onClick={() => setSortBy('time')}>
                            Newest First
                        </button>
                        <button className={`filter-btn${sortBy === 'priority' ? ' active' : ''}`} onClick={() => setSortBy('priority')}>
                            By Priority
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="filter-bar">
                    <span className="filter-label">Status:</span>
                    {['all', 'pending', 'in-progress', 'completed'].map(s => (
                        <button key={s} className={`filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                            {s === 'all' ? 'All' : STATUS_STYLES[s]?.label || s}
                        </button>
                    ))}
                    <span className="filter-label filter-label--spaced">Priority:</span>
                    {['all', 'medical-emergency', 'time-sensitive', 'non-emergency'].map(t => (
                        <button key={t} className={`filter-btn${typeFilter === t ? ' active' : ''}`} onClick={() => setTypeFilter(t)}>
                            {t === 'all' ? 'All' : TYPE_STYLES[t].label}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                {filtered.length === 0 ? (
                    <div className="card empty-state">No tasks match your filters.</div>
                ) : (
                    filtered.map(task => {
                        const tStyle   = TYPE_STYLES[task.type]     || TYPE_STYLES['non-emergency'];
                        const sStyle   = STATUS_STYLES[task.status] || STATUS_STYLES['pending'];
                        const isMyTask = currentNurse && String(task.assignedTo) === String(currentNurse._id);

                        return (
                            <div key={task._id} className="task-card" style={{
                                background:  tStyle.bg,
                                borderColor: isMyTask ? '#b20cb2' : tStyle.border,
                            }}>
                                {isMyTask && (
                                    <div className="task-card__ribbon" style={{ background: '#b20cb2' }}>MY TASK</div>
                                )}

                                <div className="task-card__header">
                                    <div className="task-card__title-row">
                                        <span className="task-card__title">{task.title}</span>
                                        <span className="task-card__badge" style={{ background: tStyle.badge }}>{tStyle.label}</span>
                                        <span style={{ fontSize: '0.78rem', color: sStyle.color, fontWeight: 'bold' }}>{sStyle.label}</span>
                                    </div>
                                    <span className="task-card__age">{timeAgo(task.submittedAt)}</span>
                                </div>

                                {task.description && (
                                    <p className="task-card__description">{task.description}</p>
                                )}

                                <div className="task-card__meta">
                                    {task.room        && <span>🚪 {task.room}</span>}
                                    {task.completedAt && <span>✓ Completed {timeAgo(task.completedAt)}</span>}
                                </div>

                                <div className="task-card__status-row">
                                    <span className="task-card__status-label">Status:</span>
                                    <select
                                        className="task-card__status-select"
                                        value={task.status}
                                        onChange={e => handleStatusChange(task, e.target.value)}
                                        style={{ color: sStyle.color }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>

                                    <span className="task-card__status-label" style={{ marginLeft: '1rem' }}>Priority:</span>
                                    <select
                                        className="task-card__status-select"
                                        value={task.type}
                                        onChange={e => handlePriorityChange(task, e.target.value)}
                                    >
                                        <option value="non-emergency">Low</option>
                                        <option value="time-sensitive">Medium</option>
                                        <option value="medical-emergency">High</option>
                                    </select>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}

export default NurseDashboard;