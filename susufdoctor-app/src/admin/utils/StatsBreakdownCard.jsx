import { Users, Activity } from 'lucide-react';

export function StatsBreakdownCard({ stats }) {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-blue-500 mb-4">Radiologists & Admins</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-linear-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-300">
                    <div>
                        <p className="text-xs text-blue-700 font-semibold">Total Radiologists</p>
                        <p className="text-2xl font-bold text-blue-900">{stats?.total_radiologists || 0}</p>
                    </div>
                    <Users size={32} className="text-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-linear-to-r from-green-50 to-green-100 rounded-lg border border-green-300">
                    <div>
                        <p className="text-xs text-green-700 font-semibold">Active Radiologists</p>
                        <p className="text-2xl font-bold text-green-900">{stats?.active_radiologists || 0}</p>
                    </div>
                    <Activity size={32} className="text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-linear-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-300">
                    <div>
                        <p className="text-xs text-purple-700 font-semibold">Total Admins</p>
                        <p className="text-2xl font-bold text-purple-900">{stats?.total_admins || 0}</p>
                    </div>
                    <Users size={32} className="text-purple-600" />
                </div>
            </div>
        </div>
    );
}