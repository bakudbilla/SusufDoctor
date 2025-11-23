export function LoadingSpinner({ message = 'Loading...', messageColor = 'text-gray-600'  }) {
    return (
        <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={`font-semibold ${messageColor}`}>{message}</p>
        </div>
    );
}