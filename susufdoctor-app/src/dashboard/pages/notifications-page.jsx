import { NotificationsCenter } from '../components/notifications-center';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications & Alerts</h1>
        <p className="text-muted-foreground">
          Stay informed about critical findings, system updates, and important alerts
        </p>
      </div>
      
      <NotificationsCenter />
    </div>
  );
}