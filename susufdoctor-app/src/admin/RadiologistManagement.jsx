import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import RadiologistList from './utils/RadiologistList';
import RadiologistDetail from './utils/RadiologistDetail';
import PatientDetail from './utils/PatientDetail';
import { API_URL } from '../utils/constant';

export default function RadiologistManagement() {
    const [radiologists, setRadiologists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [selectedRadiologist, setSelectedRadiologist] = useState(null);
    const [radiologistPatients, setRadiologistPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [patientsLoading, setPatientsLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchRadiologists();
    }, []);

    const fetchRadiologists = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setRadiologists(data.data || []);
                setError('');
            } else {
                setError(`Failed to fetch radiologists: ${res.status}`);
                toast.error('Failed to fetch radiologists');
            }
        } catch (error) {
            const errorMsg = `Error fetching radiologists: ${error.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchRadiologistPatients = async (radiologist) => {
        setPatientsLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            
            const res = await fetch(`${API_URL}/patients/admin/radiologist/${radiologist.user_id}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setRadiologistPatients(data.data || []);
                setError('');
            } else {
                setError(`Failed to fetch patients: ${res.status}`);
                toast.error('Failed to fetch patients');
            }
        } catch (error) {
            const errorMsg = `Error fetching patients: ${error.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setPatientsLoading(false);
        }
    };

    const fetchPatientDetails = async (patientId) => {
        try {
            const token = localStorage.getItem('admin_token');
            
            const res = await fetch(`${API_URL}/patients/${patientId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setPatientDetails(data.data);
                setError('');
            } else {
                setError(`Failed to fetch patient details: ${res.status}`);
                toast.error('Failed to fetch patient details');
            }
        } catch (error) {
            const errorMsg = `Error fetching patient details: ${error.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const deleteRadiologist = async (userId) => {
        try {
            setDeleting(true);
            const token = localStorage.getItem('admin_token');
            
            const loadingToast = toast.loading('Deleting radiologist...');
            
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                
                toast.dismiss(loadingToast);
                toast.success(`${data.data?.full_name || 'Radiologist'} deleted successfully`);
                
                await fetchRadiologists();
                
                if (viewMode === 'detail') {
                    handleBackToList();
                }
            } else if (res.status === 403) {
                toast.dismiss(loadingToast);
                toast.error('Cannot delete superuser accounts');
            } else if (res.status === 400) {
                toast.dismiss(loadingToast);
                toast.error('Cannot delete your own account');
            } else {
                const errorData = await res.json();
                toast.dismiss(loadingToast);
                toast.error(errorData.detail || `Failed to delete radiologist: ${res.status}`);
            }
        } catch (error) {
            toast.dismiss();
            toast.error(`Error deleting radiologist: ${error.message}`);
            console.error('Delete error:', error);
        } finally {
            setDeleting(false);
        }
    };

    const viewRadiologistDetail = (radiologist) => {
        setSelectedRadiologist(radiologist);
        setViewMode('detail');
        fetchRadiologistPatients(radiologist);
    };

    const viewPatientDetail = (patient) => {
        setSelectedPatient(patient);
        setViewMode('patient');
        fetchPatientDetails(patient.patient_id);
    };

    const toggleRadiologistStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (res.ok) {
                toast.success(currentStatus ? 'Radiologist deactivated' : 'Radiologist activated');
                fetchRadiologists();
            } else {
                toast.error('Failed to update radiologist status');
            }
        } catch (error) {
            toast.error(`Error updating radiologist: ${error.message}`);
            console.error('Error updating radiologist:', error);
        }
    };

    const makeAdmin = async (userId) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_admin: true })
            });

            if (res.ok) {
                toast.success('Radiologist promoted to admin');
                fetchRadiologists();
            } else {
                toast.error('Failed to promote radiologist');
            }
        } catch (error) {
            toast.error(`Error making admin: ${error.message}`);
            console.error('Error making admin:', error);
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedRadiologist(null);
        setSelectedPatient(null);
        setPatientDetails(null);
    };

    const handleBackToDetail = () => {
        setViewMode('detail');
        setSelectedPatient(null);
        setPatientDetails(null);
    };

    switch (viewMode) {
        case 'detail':
            return (
                <RadiologistDetail
                    radiologist={selectedRadiologist}
                    patients={radiologistPatients}
                    patientsLoading={patientsLoading}
                    error={error}
                    onBack={handleBackToList}
                    onViewPatient={viewPatientDetail}
                    onToggleStatus={toggleRadiologistStatus}
                    onMakeAdmin={makeAdmin}
                    onDeleteRadiologist={deleteRadiologist}
                />
            );
        
        case 'patient':
            return (
                <PatientDetail
                    patient={selectedPatient}
                    patientDetails={patientDetails}
                    onBack={handleBackToDetail}
                />
            );
        
        default:
            return (
                <RadiologistList
                    radiologists={radiologists}
                    loading={loading}
                    error={error}
                    onViewDetail={viewRadiologistDetail}
                    onDeleteRadiologist={deleteRadiologist}
                />
            );
    }
}