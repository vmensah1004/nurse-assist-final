import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import './styles.css';

const API = 'http://localhost:3000/api';

function AdminDashboard({ onLogout }) {
    const [summary, setSummary]     = useState({ pending: 0, inProgress: 0, completed: 0, totalNurses: 0 });
    const [roomStats, setRoomStats] = useState({ total: 0, full: 0, partial: 0, empty: 0 });
    const [taskStats, setTaskStats] = useState({ highlighted: 0, outstanding: 0 });

    useEffect(() => {
        // Their existing summary endpoint — pending, inProgress, completed, totalNurses
        axios.get(`${API}/admin/summary`)
            .then(res => setSummary(res.data))
            .catch(() => {});

        // Room stats
        axios.get(`${API}/rooms`)
            .then(res => {
                const rooms   = res.data;
                const full    = rooms.filter(r => r.status === 'full').length;
                const partial = rooms.filter(r => r.status === 'partial').length;
                const empty   = rooms.filter(r => r.status === 'empty').length;
                setRoomStats({ total: rooms.length, full, partial, empty });
            })
            .catch(() => {});

        // Flagged / outstanding task counts
        axios.get(`${API}/tasks`)
            .then(res => {
                const tasks = res.data;
                setTaskStats({
                    highlighted: tasks.filter(t => t.highlighted).length,
                    outstanding: tasks.filter(t => t.status === 'outstanding').length,
                });
            })
            .catch(() => {});
    }, []);

    const navCard = (to, icon, title, subtitle, accent) => (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <div className="card card--nav" style={{ borderLeftColor: accent }}>
                <div className="nav-card__icon">{icon}</div>
                <div>
                    <div className="nav-card__title" style={{ color: accent }}>{title}</div>
                    <div className="nav-card__subtitle">{subtitle}</div>
                </div>
            </div>
        </Link>
    );

    const stats = [
        { label: 'Active Nurses',  value: summary.totalNurses,   color: '#b20cb2' },
        { label: 'Pending Tasks',  value: summary.pending,        color: '#d97706' },
        { label: 'In Progress',    value: summary.inProgress,     color: '#0369a1' },
        { label: 'Completed',      value: summary.completed,      color: '#16a34a' },
        { label: 'Total Rooms',    value: roomStats.total,        color: '#b20cb2' },
        { label: 'Full',           value: roomStats.full,         color: '#dc2626' },
        { label: 'Partial',        value: roomStats.partial,      color: '#d97706' },
        { label: 'Empty',          value: roomStats.empty,        color: '#16a34a' },
        { label: 'Flagged Tasks',  value: taskStats.highlighted,  color: '#f59e0b' },
        { label: 'Outstanding',    value: taskStats.outstanding,  color: '#dc2626' },
    ];

    return (
        <>
            <Navbar role="admin" onLogout={ onLogout } />
            <div className="page--narrow">

                {/* Header */}
                <div className="card">
                    <h1 className="page-title" style={{ fontSize: '1.8rem' }}>Admin Dashboard</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9rem' }}>
                        Monitor room occupancy, track outstanding tasks, and coordinate staff.
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

                {/* Nav Cards */}
                <h2 className="section-heading">Quick Access</h2>
                <div className="nav-card-grid">
                    {navCard('/admin/rooms', '🛏️', 'Room Status',     'View occupancy, assign & discharge patients',      '#b20cb2')}
                    {navCard('/admin/tasks', '📋', 'Task Management', 'Flag outstanding tasks, ping staff, create tasks', '#d97706')}
                </div>

                {/* Alert */}
                {(taskStats.highlighted > 0 || taskStats.outstanding > 0) && (
                    <div className="alert">
                        <h3 className="alert__title">⚠️ Attention Required</h3>
                        <ul className="alert__list">
                            {taskStats.highlighted > 0 && (
                                <li>{taskStats.highlighted} task{taskStats.highlighted > 1 ? 's are' : ' is'} flagged and needs attention.</li>
                            )}
                            {taskStats.outstanding > 0 && (
                                <li>{taskStats.outstanding} task{taskStats.outstanding > 1 ? 's are' : ' is'} marked as outstanding.</li>
                            )}
                        </ul>
                        <Link to="/admin/tasks" className="alert__link">View Tasks →</Link>
                    </div>
                )}
            </div>
        </>
    );
}

export default AdminDashboard;
