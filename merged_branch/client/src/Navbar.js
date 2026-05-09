import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles.css';

function Navbar({ role, currentNurse, currentPatient, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    const navLink = (label, path) => {
        const active = location.pathname === path;
        return (
            <button onClick={() => navigate(path)} className={`navbar__link${active ? ' active' : ''}`}>
                {label}
            </button>
        );
    };

    const renderLinks = () => {
        if (role === 'admin')   return <>{navLink('Dashboard', '/admin')}{navLink('Rooms', '/admin/rooms')}{navLink('Tasks', '/admin/tasks')}{navLink('Workload', '/admin/workload')}</>;
        if (role === 'nurse')   return <>{navLink('Task Pool', '/nurse/pool')}{navLink('Dashboard', '/nurse/dashboard')}</>;
        if (role === 'patient') return <>{navLink('My Requests', '/patient')}</>;
        return null;
    };

    const renderLabel = () => {
        if (role === 'nurse'   && currentNurse)   return `${currentNurse.name} — ${currentNurse.role}`;
        if (role === 'patient' && currentPatient) return `${currentPatient.name} · Room ${currentPatient.room}`;
        if (role === 'admin')                     return 'Admin';
        return '';
    };

    const handleLogoClick = () => {
        if (role === 'admin')   navigate('/admin');
        if (role === 'nurse')   navigate('/nurse/pool');
        if (role === 'patient') navigate('/patient');
    };

    return (
        <nav className="navbar">
            <div className="navbar__logo" onClick={handleLogoClick}>🏥 NurseAssist</div>
            <div className="navbar__links">{renderLinks()}</div>
            <div className="navbar__right">
                <span className="navbar__role">{renderLabel()}</span>
                {onLogout && (
                    <button className="navbar__signout" onClick={onLogout}> Sign Out</button>
                )}
            </div>
        </nav>
    );
}

export default Navbar;