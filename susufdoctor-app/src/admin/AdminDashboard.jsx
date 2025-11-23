import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../utils/constant';
import { DashboardView } from './utils/DashboardView';
import RadiologistList  from './utils/RadiologistList';
import { RadiologistDetailView } from './utils/RadiologistDetailView';
import { PatientDetailView } from './utils/PatientDetailView';
import AddRadiologistModal  from './utils/AddRadiologistModal';
import { SuccessAlert } from '../utils/ErrorAlert';
import { LoadingSpinner } from '../utils/LoadingSpinner';

export default function AdminDashboard() {
    const [view, setView] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [radiologists, setRadiologists] = useState([]);
    const [selectedRadiologist, setSelectedRadiologist] = useState(null);
    const [radiologistPatients, setRadiologistPatients] = useState([]);
    const [patientDetails, setPatientDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const getAuthToken = useCallback(() => localStorage.getItem('admin_token'), []);

    const handleError = useCallback((message) => {
        setError(message);
        setLoading(false);
    }, []);

    const fetchDashboardData = useCallback(async () => {
        try {
            const token = getAuthToken();
            const [statsRes, healthRes] = await Promise.all([
                fetch(`${API_URL}/admin/dashboard/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/admin/system-health`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats((await statsRes.json()).data);
            if (healthRes.ok) setHealth((await healthRes.json()).data);
            else handleError('Failed to fetch system health');
        } catch (err) {
            handleError('Error fetching dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [getAuthToken, handleError]);

    const fetchRadiologists = useCallback(async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                setRadiologists((await res.json()).data);
                setView('radiologists');
            } else {
                handleError('Failed to fetch radiologists');
            }
        } catch (err) {
            handleError('Error fetching radiologists');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [getAuthToken, handleError]);

    const addRadiologist = useCallback(async (radiologistData) => {
        setSubmitLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(radiologistData)
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('Radiologist added successfully!');
                setShowAddModal(false);
                setTimeout(() => setSuccess(''), 3000);
                if (view === 'radiologists') {
                    await fetchRadiologists();
                }
            } else {
                handleError(data.detail || 'Failed to add radiologist');
            }
        } catch (err) {
            handleError('Error adding radiologist');
            console.error(err);
        } finally {
            setSubmitLoading(false);
        }
    }, [getAuthToken, handleError, view, fetchRadiologists]);

    const fetchRadiologistPatients = useCallback(async (radiologistId) => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/patients`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const allPatients = (await res.json()).data;
                const filtered = allPatients.filter(p => p.radiologist_id === radiologistId);
                setRadiologistPatients(filtered);
                setSelectedRadiologist(radiologists.find(r => r.user_id === radiologistId));
                setView('radiologist-detail');
            } else {
                handleError('Failed to fetch patients');
            }
        } catch (err) {
            handleError('Error fetching patients');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [getAuthToken, radiologists, handleError]);

    const fetchPatientDetails = useCallback(async (patientId) => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/patients/${patientId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                setPatientDetails((await res.json()).data);
                setView('patient-detail');
            } else {
                handleError('Failed to fetch patient details');
            }
        } catch (err) {
            handleError('Error fetching patient details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [getAuthToken, handleError]);

    const handleBack = useCallback(() => {
        const backMap = {
            'patient-detail': 'radiologist-detail',
            'radiologist-detail': 'radiologists',
            'radiologists': 'dashboard'
        };
        setView(backMap[view] || 'dashboard');
    }, [view]);

    useEffect(() => {
        if (view === 'dashboard') {
            fetchDashboardData();
        }
    }, [view, fetchDashboardData]);

    if (loading && view === 'dashboard') {
        return <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner message="Loading dashboard..." />
        </div>;
    }

    switch (view) {
        case 'dashboard':
            return (
                <>
                    {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}
                    <DashboardView 
                        stats={stats} 
                        health={health} 
                        onAddRadiologist={() => setShowAddModal(true)}
                        error={error}
                        onDismissError={() => setError('')}
                    />
                    <AddRadiologistModal 
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSubmit={addRadiologist}
                        loading={submitLoading}
                    />
                </>
            );
        case 'radiologists':
            return (
                <>
                    {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}
                    <RadiologistList
                        radiologists={radiologists} 
                        loading={loading}
                        onBack={handleBack}
                        onSelectRadiologist={fetchRadiologistPatients}
                    />
                </>
            );
        case 'radiologist-detail':
            return (
                <RadiologistDetailView 
                    radiologist={selectedRadiologist}
                    patients={radiologistPatients}
                    loading={loading}
                    onBack={handleBack}
                    onSelectPatient={fetchPatientDetails}
                />
            );
        case 'patient-detail':
            return (
                <PatientDetailView 
                    patient={patientDetails}
                    loading={loading}
                    onBack={handleBack}
                />
            );
        default:
            return null;
    }
}