export function HealthItem({ label, status }) {
    const isHealthy = status === 'healthy' || status === 'operational';
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-medium text-gray-700">{label}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {status || 'Unknown'}
            </span>
        </div>
    );
}