import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './styles.css';

//const API = 'http://localhost:3000/api';
import API from './config';

const TYPE_STYLES = {
    'medical-emergency': { badge: '#dc2626', label: 'High' },
    'time-sensitive':    { badge: '#d97706', label: 'Med'  },
    'non-emergency':     { badge: '#0369a1', label: 'Low'  },
};

function AdminWorkload({ onLogout }) {
    const [workload, setWorkload]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchWorkload = () => {
        setLoading(true);
        axios.get(`${API}/admin/workload`)
            .then(res => { setWorkload(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchWorkload();
        const interval = setInterval(fetchWorkload, 30000);
        return () => clearInterval(interval);
    }, []);

    const filtered   = roleFilter === 'all' ? workload : workload.filter(w => w.nurseRole === roleFilter);
    const totalBusy  = workload.filter(w => w.taskCount > 0).length;
    const totalIdle  = workload.filter(w => w.taskCount === 0).length;
    const totalTasks = workload.reduce((sum, w) => sum + w.taskCount, 0);

    return (
        <>
            <Navbar role="admin" onLogout={onLogout} />
            <div className="page">

                {/* Header */}
                <div className="card card--header">
                    <div>
                        <h1 className="page-title">Staff Workload</h1>
                        <p className="page-subtitle">
                            {workload.length} staff · {totalBusy} busy · {totalIdle} idle · {totalTasks} active tasks
                        </p>
                    </div>
                    <button className="btn btn--secondary" onClick={fetchWorkload}>↻ Refresh</button>
                </div>

                {/* Stats */}
                <div className="stat-grid">
                    {[
                        { label: 'Total Staff',  value: workload.length, color: '#b20cb2' },
                        { label: 'Busy',         value: totalBusy,       color: '#dc2626' },
                        { label: 'Idle',         value: totalIdle,       color: '#16a34a' },
                        { label: 'Active Tasks', value: totalTasks,      color: '#d97706' },
                    ].map(s => (
                        <div key={s.label} className="card--compact">
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Role filter */}
                <div className="filter-bar">
                    <span className="filter-label">Role:</span>
                    {['all', 'RN', 'NA'].map(r => (
                        <button key={r} className={`filter-btn${roleFilter === r ? ' active' : ''}`} onClick={() => setRoleFilter(r)}>
                            {r === 'all' ? 'All Staff' : r === 'RN' ? 'Nurses (RN)' : 'Nursing Assistants (NA)'}
                        </button>
                    ))}
                </div>

                {/* Staff cards */}
                {loading ? (
                    <div className="card empty-state">Loading workload data...</div>
                ) : filtered.length === 0 ? (
                    <div className="card empty-state">No staff found.</div>
                ) : (
                    filtered.map(staff => {
                        const isBusy    = staff.taskCount > 0;
                        const roleBadge = staff.nurseRole === 'RN' ? 'staff-card__role-badge--rn' : 'staff-card__role-badge--na';

                        return (
                            <div key={staff._id} className="card staff-card">
                                <div className="staff-card__header">
                                    <div className="staff-card__identity">
                                        <div className={`staff-card__dot ${isBusy ? 'staff-card__dot--busy' : 'staff-card__dot--idle'}`} />
                                        <div>
                                            <span className="staff-card__name">{staff.nurseName}</span>
                                            <span className={`staff-card__role-badge ${roleBadge}`}>{staff.nurseRole}</span>
                                        </div>
                                    </div>
                                    <span className={`staff-card__status ${isBusy ? 'staff-card__status--busy' : 'staff-card__status--idle'}`}>
                                        {isBusy ? `${staff.taskCount} task${staff.taskCount > 1 ? 's' : ''}` : 'Idle'}
                                    </span>
                                </div>

                                {isBusy ? (
                                    <div className="staff-card__tasks">
                                        {staff.activeTasks.map(task => {
                                            const tStyle = TYPE_STYLES[task.type] || TYPE_STYLES['non-emergency'];
                                            return (
                                                <div key={task.taskId} className="staff-task-row">
                                                    <span className="staff-task-row__badge" style={{ background: tStyle.badge }}>
                                                        {tStyle.label}
                                                    </span>
                                                    <span className="staff-task-row__title">{task.title}</span>
                                                    <span className="room-label">🚪 {task.room}</span>
                                                    <span className="staff-task-row__age">
                                                        {task.submittedAt ? `${Math.floor((Date.now() - new Date(task.submittedAt)) / 60000)}m ago` : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="page-subtitle" style={{ fontStyle: 'italic' }}>
                                        No active tasks — available for assignment
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}

export default AdminWorkload;