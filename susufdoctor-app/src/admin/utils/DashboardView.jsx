import { Activity, FileText, Database, Plus, Users } from 'lucide-react';
import { StatCard } from './StatCard';
import { StatsBreakdownCard } from './StatsBreakdownCard';
import { HealthItem } from './HealthItem';
import { ErrorAlert } from '../../utils/ErrorAlert';
import { useNavigate } from 'react-router-dom'

export function DashboardView({ stats, health, onAddRadiologist, error, onDismissError }) {
    const navigate = useNavigate('/');

    return (
        <div className="bg-[#DFFBFA]">
            <div className="p-8">
                {error && <ErrorAlert error={error} onDismiss={onDismissError} />}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard icon={<Activity size={24} />} title="This Week Reports" value={stats?.reports_this_week || 0} color="purple" />
                    <StatCard icon={<FileText size={24} />} title="Total Reports" value={stats?.total_reports || 0} color="green" />
                    <StatCard icon={<Database size={24} />} title="Total Patients" value={stats?.total_patients || 0} color="blue" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-blue-500 mb-4">System Status</h3>
                        <div className="space-y-3">
                            <HealthItem label="Database" status={health?.database} />
                            <HealthItem label="API Server" status={health?.api} />
                            <HealthItem label="Storage" status="operational" />
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            Last checked: {health?.last_check ? new Date(health.last_check).toLocaleString() : 'N/A'}
                        </p>
                    </div>

                    <StatsBreakdownCard stats={stats} />
                </div>

                <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button 
                            onClick={onAddRadiologist}
                            className="px-4 py-3 bg-green-600 cursor-pointer text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 group">
                            <Plus size={20} className="group-hover:scale-110 transition" />
                            Add New Radiologist
                        </button>
                        <button 
                            onClick={()=>navigate('/admin/users')}
                            className="px-4 py-3 bg-blue-500 text-white cursor-pointer rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 group">
                            <Users size={20} className="group-hover:scale-110 transition" />
                            View Radiologists
                        </button>

                        <button 
                            onClick={()=>navigate('/admin/reports')}
                            className="px-4 py-3 bg-gray-200 text-gray-900 cursor-pointer rounded-lg hover:bg-gray-300 transition font-medium flex items-center justify-center gap-2 group">
                            <FileText size={20} className="group-hover:scale-110 transition" />
                            View Reports
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}