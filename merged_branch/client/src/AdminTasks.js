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

//statuses: pending, in-progress, completed + our outstanding
const STATUS_STYLES = {
    'pending':     { color: '#6b7280', label: 'Pending' },
    'in-progress': { color: '#d97706', label: 'In Progress' },
    'completed':   { color: '#16a34a', label: 'Completed' },
    'outstanding': { color: '#dc2626', label: 'Outstanding' },
};

function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const blankTask = {
    title: '', description: '', room: '',
    type: 'non-emergency', assignedTo: '', assignedRole: 'nurse'
};

function AdminTasks({ onLogout }) {
    const [tasks, setTasks]                         = useState([]);
    const [rooms, setRooms]                         = useState([]);
    const [statusFilter, setStatusFilter]           = useState('all');
    const [typeFilter, setTypeFilter]               = useState('all');
    const [showHighlighted, setShowHighlighted]     = useState(false);
    const [pingFeedback, setPingFeedback]           = useState({});
    const [newTask, setNewTask]                     = useState({ ...blankTask });
    const [selectedRoom, setSelectedRoom]           = useState(null);
    const [availablePatients, setAvailablePatients] = useState([]);
    const [showCreate, setShowCreate]               = useState(false);
    const [creating, setCreating]                   = useState(false);

    const fetchTasks = () => {
        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter   !== 'all') params.type   = typeFilter;
        if (showHighlighted) params.highlighted   = 'true';
        axios.get(`${API}/tasks`, { params })
            .then(res => setTasks(res.data))
            .catch(() => alert('Error fetching tasks.'));
    };

    const fetchRooms = () => {
        axios.get(`${API}/rooms`)
            .then(res => setRooms(res.data))
            .catch(() => {});
    };

    useEffect(() => { fetchTasks(); }, [statusFilter, typeFilter, showHighlighted]);
    useEffect(() => { fetchRooms(); }, []);

    const handleRoomSelect = (roomNumber) => {
        const room = rooms.find(r => r.roomNumber === roomNumber);
        setSelectedRoom(room || null);
        const patients = [];
        if (room) {
            if (room.bedA && room.bedA.patientName) patients.push({ name: room.bedA.patientName, bed: 'A' });
            if (room.bedB && room.bedB.patientName) patients.push({ name: room.bedB.patientName, bed: 'B' });
        }
        setAvailablePatients(patients);
        const autoPatient = patients.length === 1 ? patients[0].name : '';
        setNewTask(prev => ({ ...prev, room: roomNumber, patientName: autoPatient }));
    };

    const handleHighlight = async (task) => {
        try {
            await axios.patch(`${API}/tasks/${task._id}/highlight`);
            fetchTasks();
        } catch { alert('Error flagging task.'); }
    };

    const handlePing = async (task) => {
        try {
            const res = await axios.patch(`${API}/tasks/${task._id}/ping`);
            setPingFeedback(prev => ({ ...prev, [task._id]: res.data.message }));
            setTimeout(() => setPingFeedback(prev => { const n = { ...prev }; delete n[task._id]; return n; }), 4000);
            fetchTasks();
        } catch { alert('Error pinging task.'); }
    };

    const handleStatusChange = async (task, newStatus) => {
        try {
            await axios.patch(`${API}/tasks/${task._id}`, { status: newStatus });
            fetchTasks();
        } catch { alert('Error updating status.'); }
    };

    const handleCreate = async () => {
        if (!newTask.title.trim()) return alert('Task title is required.');
        if (!newTask.room.trim())  return alert('Room is required.');
        setCreating(true);
        try {
            await axios.post(`${API}/tasks`, newTask);
            setShowCreate(false);
            setNewTask({ ...blankTask });
            setSelectedRoom(null);
            setAvailablePatients([]);
            fetchTasks();
        } catch { alert('Error creating task.'); }
        setCreating(false);
    };

    const handleCloseCreate = () => {
        setShowCreate(false);
        setNewTask({ ...blankTask });
        setSelectedRoom(null);
        setAvailablePatients([]);
    };

    const highlighted = tasks.filter(t => t.highlighted).length;
    const outstanding = tasks.filter(t => t.status === 'outstanding' || t.status === 'pending').length;

    return (
        <>
            <Navbar role="admin" onLogout={ onLogout } />
            <div className="page">

                <div className="card card--header">
                    <div>
                        <h1 className="page-title">Task Management</h1>
                        <p className="page-subtitle">
                            {tasks.length} tasks · {highlighted} flagged · {outstanding} needing attention
                        </p>
                    </div>
                    <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
                        + Create Task
                    </button>
                </div>

                {/* Stats */}
                <div className="stat-grid">
                    {Object.entries(STATUS_STYLES).map(([status, style]) => (
                        <div key={status} className="card--compact">
                            <div className="stat-value" style={{ color: style.color }}>
                                {tasks.filter(t => t.status === status).length}
                            </div>
                            <div className="stat-label">{style.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="filter-bar">
                    <span className="filter-label">Status:</span>
                    {['all', 'pending', 'in-progress', 'outstanding', 'completed'].map(s => (
                        <button key={s} className={`filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                            {s === 'all' ? 'All' : STATUS_STYLES[s]?.label || s}
                        </button>
                    ))}
                    <span className="filter-label filter-label--spaced">Priority:</span>
                    {['all', 'medical-emergency', 'time-sensitive', 'non-emergency'].map(t => (
                        <button key={t} className={`filter-btn${typeFilter === t ? ' active' : ''}`} onClick={() => setTypeFilter(t)}>
                            {t === 'all' ? 'All' : TYPE_STYLES[t]?.label || t}
                        </button>
                    ))}
                    <button
                        className={`filter-btn filter-label--spaced btn--warn${showHighlighted ? ' active' : ''}`}
                        onClick={() => setShowHighlighted(p => !p)}
                    >
                        ⚑ Flagged Only
                    </button>
                </div>

                {/* Task List */}
                {tasks.length === 0 ? (
                    <div className="card empty-state">No tasks match the current filters.</div>
                ) : (
                    tasks.map(task => {
                        const tStyle = TYPE_STYLES[task.type]     || TYPE_STYLES['non-emergency'];
                        const sStyle = STATUS_STYLES[task.status] || STATUS_STYLES['pending'];
                        return (
                            <div key={task._id}
                                className={`task-card${task.highlighted ? ' task-card--flagged' : ''}`}
                                style={{ background: tStyle.bg, borderColor: task.highlighted ? '#f59e0b' : tStyle.border }}>

                                {task.highlighted && (
                                    <div className="task-card__ribbon">⚑ FLAGGED</div>
                                )}

                                <div className="task-card__header">
                                    <div className="task-card__title-row">
                                        <span className="task-card__title">{task.title}</span>
                                        <span className="task-card__badge" style={{ background: tStyle.badge }}>
                                            {tStyle.label}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: sStyle.color, fontWeight: 'bold' }}>
                                            {sStyle.label}
                                        </span>
                                    </div>
                                    <span className="task-card__age">Submitted {timeAgo(task.submittedAt)}</span>
                                </div>

                                {task.description && (
                                    <p className="task-card__description">{task.description}</p>
                                )}
                                /* shows up on the task card (use emojicombos.com)*/
                                <div className="task-card__meta">
                                    {task.room        && <span>🚪 {task.room}</span>}
                                    {task.patientName && <span>👤 {task.patientName}</span>}
                                    {task.assignedTo  && <span>🏥 {task.assignedRole === 'nurse' ? 'Nurse' : 'NA'} assigned</span>}
                                    {task.pingedAt    && <span>📣 Pinged {timeAgo(task.pingedAt)}</span>}
                                    {task.completedAt && <span>✓ Completed {timeAgo(task.completedAt)}</span>}
                                    {task.completedAt && task.submittedAt && (
                                        <span>🕓 Resolved in {Math.round((new Date(task.completedAt) - 
                                            new Date(task.submittedAt)) / 60000)} min</span>)}
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
                                        <option value="outstanding">Outstanding</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div className="task-card__actions">
                                    <button
                                        className={`btn btn--warn btn--small${task.highlighted ? ' active' : ''}`}
                                        onClick={() => handleHighlight(task)}
                                    >
                                        {task.highlighted ? '⚑ Unflag' : '⚑ Flag'}
                                    </button>
                                    <button className="btn btn--blue btn--small" onClick={() => handlePing(task)}>
                                        📣 Ping {task.assignedTo ? 'Assigned Staff' : 'All Staff'}
                                    </button>
                                </div>

                                {pingFeedback[task._id] && (
                                    <div className="task-card__ping-toast">
                                        ✓ {pingFeedback[task._id]}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Task Modal */}
            {showCreate && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 className="modal-title">Create Task</h2>

                        <label className="form-label">Title *</label>
                        <input className="form-input" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Change IV bag" />

                        <label className="form-label">Description</label>
                        <textarea className="form-input" style={{ resize: 'vertical' }} rows={3} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Details about the request…" />

                        <label className="form-label">Room *</label>
                        <select className="form-input" value={newTask.room} onChange={e => handleRoomSelect(e.target.value)}>
                            <option value="">-- Select a Room --</option>
                            {rooms.map(r => {
                                const aName = r.bedA && r.bedA.patientName;
                                const bName = r.bedB && r.bedB.patientName;
                                const occupants = [aName && `Bed A: ${aName}`, bName && `Bed B: ${bName}`].filter(Boolean).join(', ');
                                return (
                                    <option key={r._id} value={r.roomNumber}>
                                        Room {r.roomNumber} ({r.status === 'empty' ? 'Empty' : occupants})
                                    </option>
                                );
                            })}
                        </select>

                        {selectedRoom && availablePatients.length > 0 && (
                            <>
                                <label className="form-label">Patient</label>
                                <select className="form-input" value={newTask.patientName} onChange={e => setNewTask({ ...newTask, patientName: e.target.value })}>
                                    <option value="">-- Select a Patient --</option>
                                    {availablePatients.map(p => (
                                        <option key={p.bed} value={p.name}>{p.name} (Bed {p.bed})</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {selectedRoom && availablePatients.length === 0 && (
                            <div className="form-input" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                No patients in this room
                            </div>
                        )}

                        <label className="form-label">Priority</label>
                        <select className="form-input" value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}>
                            <option value="non-emergency">Non-Emergency (Low)</option>
                            <option value="time-sensitive">Time-Sensitive (Medium)</option>
                            <option value="medical-emergency">Medical Emergency (High)</option>
                        </select>

                        <div className="form-row">
                            <div>
                                <label className="form-label">Assign To Role</label>
                                <select className="form-input" value={newTask.assignedRole} onChange={e => setNewTask({ ...newTask, assignedRole: e.target.value })}>
                                    <option value="nurse">Nurse (RN)</option>
                                    <option value="nursing_assistant">Nursing Assistant (NA)</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn--primary btn--full" onClick={handleCreate} disabled={creating}>
                                {creating ? 'Creating…' : 'Create Task'}
                            </button>
                            <button className="btn btn--secondary btn--full" onClick={handleCloseCreate}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminTasks;
