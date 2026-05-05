import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import AdminRooms from './AdminRooms';
import AdminTasks from './AdminTasks';
import AdminWorkload from './AdminWorkload';
import NursePool from './NursePool';
import NurseDashboard from './NurseDashboard';
import PatientView from './PatientView';
import './styles.css';

function App() {
    const [session, setSession] = useState(null);
    // session shape: { role: 'admin' | 'nurse' | 'patient', user: {...} }

    const handleLogin = (sessionData) => {
        setSession(sessionData);
    };

    const handleLogout = () => {
        setSession(null);
    };

    // Not logged in — show login screen
    if (!session) {
        return <Login onLogin={handleLogin} />;
    }

    const { role, user } = session;

    return (
        <Router>
            <Routes>
                {/* ── Admin routes ── */}
                {role === 'admin' && (
                    <>
                        <Route path="/"             element={<Navigate to="/admin" replace />} />
                        <Route path="/admin"        element={<AdminDashboard onLogout={handleLogout} />} />
                        <Route path="/admin/rooms"  element={<AdminRooms     onLogout={handleLogout} />} />
                        <Route path="/admin/tasks"     element={<AdminTasks    onLogout={handleLogout} />} />
                        <Route path="/admin/workload" element={<AdminWorkload onLogout={handleLogout} />} />
                        <Route path="*"             element={<Navigate to="/admin" replace />} />
                    </>
                )}

                {/* ── Nurse routes ── */}
                {role === 'nurse' && (
                    <>
                        <Route path="/"               element={<Navigate to="/nurse/pool" replace />} />
                        <Route path="/nurse/pool"      element={<NursePool      currentNurse={user} onLogout={handleLogout} />} />
                        <Route path="/nurse/dashboard" element={<NurseDashboard currentNurse={user} onLogout={handleLogout} />} />
                        <Route path="*"               element={<Navigate to="/nurse/pool" replace />} />
                    </>
                )}

                {/* ── Patient routes ── */}
                {role === 'patient' && (
                    <>
                        <Route path="/"        element={<Navigate to="/patient" replace />} />
                        <Route path="/patient" element={<PatientView currentPatient={user} onLogout={handleLogout} />} />
                        <Route path="*"        element={<Navigate to="/patient" replace />} />
                    </>
                )}
            </Routes>
        </Router>
    );
}

export default App;