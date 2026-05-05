import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './styles.css';

const API = 'http://localhost:3000/api';

const STATUS_COLOR = {
    empty:   { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', label: 'EMPTY' },
    partial: { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', label: 'PARTIAL' },
    full:    { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', label: 'FULL' },
};

const emptyBed = { patientName: '', patientId: '', admittedDate: '', notes: '' };

function BedForm({ label, bed, onChange }) {
    const fields = [
        { key: 'patientName',  label: 'Patient Name', type: 'text', placeholder: 'Leave blank if empty' },
        { key: 'patientId',    label: 'Patient ID',   type: 'text', placeholder: 'Optional' },
        { key: 'admittedDate', label: 'Admitted',     type: 'date', placeholder: '' },
        { key: 'notes',        label: 'Notes',        type: 'text', placeholder: 'Optional' },
    ];
    return (
        <div className="bed-form">
            <div className="bed-form__title">🛏️ {label}</div>
            {fields.map(field => (
                <div key={field.key}>
                    <label className="bed-form__label">{field.label}</label>
                    <input
                        type={field.type}
                        value={bed[field.key] || ''}
                        placeholder={field.placeholder}
                        onChange={e => onChange({ ...bed, [field.key]: e.target.value })}
                        className="bed-form__input"
                    />
                </div>
            ))}
        </div>
    );
}

function AdminRooms({ onLogout }) {
    const [rooms, setRooms]               = useState([]);
    const [floorFilter, setFloorFilter]   = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editRoom, setEditRoom]         = useState(null);
    const [bedA, setBedA]                 = useState(emptyBed);
    const [bedB, setBedB]                 = useState(emptyBed);
    const [saving, setSaving]             = useState(false);
    const [seeding, setSeeding]           = useState(false);
    const [feedback, setFeedback]         = useState('');

    const flash = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3500); };

    const fetchRooms = () => {
        const params = {};
        if (floorFilter  !== 'all') params.floor  = floorFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
        axios.get(`${API}/rooms`, { params })
            .then(res => setRooms(res.data))
            .catch(() => alert('Error fetching rooms.'));
    };

    useEffect(() => { fetchRooms(); }, [floorFilter, statusFilter]);

    const handleSeedRooms = async () => {
        setSeeding(true);
        try {
            const res = await axios.post(`${API}/rooms/seed`);
            flash(res.data.message);
            fetchRooms();
        } catch { flash('Error seeding rooms.'); }
        setSeeding(false);
    };

    const openEdit = (room) => {
        setEditRoom(room);
        setBedA(room.bedA && room.bedA.patientName !== undefined
            ? { ...room.bedA, admittedDate: room.bedA.admittedDate ? room.bedA.admittedDate.slice(0, 10) : '' }
            : { ...emptyBed });
        setBedB(room.bedB && room.bedB.patientName !== undefined
            ? { ...room.bedB, admittedDate: room.bedB.admittedDate ? room.bedB.admittedDate.slice(0, 10) : '' }
            : { ...emptyBed });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                bedA: { ...bedA, admittedDate: bedA.admittedDate ? new Date(bedA.admittedDate) : null },
                bedB: { ...bedB, admittedDate: bedB.admittedDate ? new Date(bedB.admittedDate) : null },
            };
            await axios.patch(`${API}/rooms/${editRoom._id}`, payload);
            flash(`Room ${editRoom.roomNumber} updated!`);
            setEditRoom(null);
            fetchRooms();
        } catch { flash('Error saving room.'); }
        setSaving(false);
    };

    const handleClearRoom = async (room) => {
        if (!window.confirm(`Clear all patients from room ${room.roomNumber}?`)) return;
        try {
            await axios.patch(`${API}/rooms/${room._id}`, { bedA: emptyBed, bedB: emptyBed });
            flash(`Room ${room.roomNumber} cleared.`);
            fetchRooms();
        } catch { flash('Error clearing room.'); }
    };

    const floors  = [...new Set(rooms.map(r => r.floor))].sort();
    const full    = rooms.filter(r => r.status === 'full').length;
    const partial = rooms.filter(r => r.status === 'partial').length;
    const empty   = rooms.filter(r => r.status === 'empty').length;

    const stats = [
        { label: 'Total Rooms', value: rooms.length,       color: '#b20cb2' },
        { label: 'Full',        value: full,                color: '#dc2626' },
        { label: 'Partial',     value: partial,             color: '#d97706' },
        { label: 'Empty',       value: empty,               color: '#16a34a' },
        { label: 'Patients',    value: full * 2 + partial,  color: '#0369a1' },
        { label: 'Open Beds',   value: empty * 2 + partial, color: '#6b7280' },
    ];

    return (
        <>
            <Navbar role="admin" onLogout={ onLogout } />
            <div className="page">
                <div className="card card--header">
                    <div>
                        <h1 className="page-title">Room Status</h1>
                        <p className="page-subtitle">
                            {rooms.length} rooms · {full} full · {partial} partial · {empty} empty
                        </p>
                    </div>
                    <button className="btn btn--primary" onClick={handleSeedRooms} disabled={seeding}>
                        {seeding ? 'Seeding…' : 'Seed Default Rooms'}
                    </button>
                </div>

                {feedback && <div className="feedback">{feedback}</div>}

                <div className="stat-grid">
                    {stats.map(s => (
                        <div key={s.label} className="card--compact">
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="filter-bar">
                    <span className="filter-label">Floor:</span>
                    {['all', '1', '2', '3'].map(f => (
                        <button key={f} className={`filter-btn${floorFilter === f ? ' active' : ''}`} onClick={() => setFloorFilter(f)}>
                            {f === 'all' ? 'All Floors' : `Floor ${f}`}
                        </button>
                    ))}
                    <span className="filter-label filter-label--spaced">Status:</span>
                    {['all', 'full', 'partial', 'empty'].map(s => (
                        <button key={s} className={`filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {rooms.length === 0 ? (
                    <div className="card empty-state">
                        No rooms found. Click "Seed Default Rooms" to get started.
                    </div>
                ) : (
                    floors.map(floor => (
                        <div key={floor} style={{ marginBottom: '2rem' }}>
                            <h2 className="section-heading">Floor {floor}</h2>
                            <div className="room-grid">
                                {rooms.filter(r => r.floor === floor).map(room => {
                                    const colors = STATUS_COLOR[room.status] || STATUS_COLOR.empty;
                                    const aName  = room.bedA && room.bedA.patientName;
                                    const bName  = room.bedB && room.bedB.patientName;
                                    return (
                                        <div key={room._id} className="room-card"
                                            style={{ background: colors.bg, borderColor: colors.border }}>
                                            <div className="room-card__header">
                                                <span className="room-card__number">Room {room.roomNumber}</span>
                                                <span className="room-card__badge" style={{ background: colors.badge }}>
                                                    {colors.label}
                                                </span>
                                            </div>
                                            <div className="room-card__bed">
                                                <span className="room-card__bed-label">Bed A — </span>
                                                {aName ? <span>{aName}</span> : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Empty</span>}
                                            </div>
                                            <div className="room-card__bed room-card__bed--last">
                                                <span className="room-card__bed-label">Bed B — </span>
                                                {bName ? <span>{bName}</span> : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Empty</span>}
                                            </div>
                                            <div className="room-card__actions">
                                                <button className="btn btn--primary btn--bed" onClick={() => openEdit(room)}>
                                                    Edit Beds
                                                </button>
                                                {room.status !== 'empty' && (
                                                    <button className="btn btn--danger btn--bed" onClick={() => handleClearRoom(room)}>
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {editRoom && (
                <div className="modal-overlay">
                    <div className="modal modal--wide">
                        <h2 className="modal-title">Room {editRoom.roomNumber} — Edit Beds</h2>
                        <BedForm label="Bed A" bed={bedA} onChange={setBedA} />
                        <BedForm label="Bed B" bed={bedB} onChange={setBedB} />
                        <div className="modal-actions">
                            <button className="btn btn--primary btn--full" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button className="btn btn--secondary btn--full" onClick={() => setEditRoom(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminRooms;
