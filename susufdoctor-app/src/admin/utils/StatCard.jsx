export function StatCard({ icon, title, value, color }) {
    const colors = {
        blue: 'bg-[#00B7EB]',
        green: 'bg-[#FFD700]',
        purple: 'bg-[#E91E63]',
        orange: 'bg-purple-800'
    };

    return (
        <div className={`${colors[color]} border rounded-xl p-6 shadow-lg hover:shadow-xl transition`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-white mb-1">{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">{icon}</div>
            </div>
        </div>
    );
}