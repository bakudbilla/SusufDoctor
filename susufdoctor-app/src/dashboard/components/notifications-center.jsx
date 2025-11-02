import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Activity,
  CheckCircle2,
  X,
  Eye
} from 'lucide-react';

const mockNotifications = [
  {
    id: 'N-001',
    type: 'urgent',
    title: 'Critical Finding Detected',
    message: 'AI detected potential pneumothorax in chest X-ray. Immediate review required.',
    patientId: 'P-2024-001',
    scanId: 'S-2024-089',
    timestamp: '2024-10-02T14:30:00Z',
    isRead: false,
    priority: 'high',
    actionRequired: true
  },
  {
    id: 'N-002',
    type: 'warning',
    title: 'Low AI Confidence',
    message: 'Brain MRI analysis completed with 67% confidence. Manual review recommended.',
    patientId: 'P-2024-002',
    scanId: 'S-2024-087',
    timestamp: '2024-10-02T13:15:00Z',
    isRead: false,
    priority: 'medium',
    actionRequired: true
  },
  {
    id: 'N-003',
    type: 'warning',
    title: 'Pending Report Overdue',
    message: 'Report for abdominal CT scan has been pending for 24+ hours.',
    patientId: 'P-2024-003',
    scanId: 'S-2024-085',
    timestamp: '2024-10-02T12:00:00Z',
    isRead: true,
    priority: 'medium',
    actionRequired: true
  },
  {
    id: 'N-004',
    type: 'info',
    title: 'Model Update Available',
    message: 'New AI model version 2.1.4 available with improved accuracy for chest X-rays.',
    timestamp: '2024-10-02T10:30:00Z',
    isRead: false,
    priority: 'low',
    actionRequired: false
  },
  {
    id: 'N-005',
    type: 'success',
    title: 'RLHF Training Complete',
    message: 'Model retraining completed successfully. Accuracy improved by 2.3%.',
    timestamp: '2024-10-02T09:00:00Z',
    isRead: true,
    priority: 'low',
    actionRequired: false
  },
  {
    id: 'N-006',
    type: 'urgent',
    title: 'Mass Lesion Detected',
    message: 'Possible malignant mass identified in lung CT. Urgent radiologist assessment needed.',
    patientId: 'P-2024-004',
    scanId: 'S-2024-091',
    timestamp: '2024-10-02T08:45:00Z',
    isRead: false,
    priority: 'high',
    actionRequired: true
  }
];

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'urgent':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20';
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20';
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    return (
      <Badge variant={variants[priority]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      return date.toLocaleDateString();
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMins}m ago`;
    }
  };

  const filterNotifications = (filter) => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'urgent':
        return notifications.filter(n => n.type === 'urgent');
      case 'action':
        return notifications.filter(n => n.actionRequired);
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.type === 'urgent' && !n.isRead).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications Center</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} unread</Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            </div>
          </div>
          <CardDescription>
            System alerts, critical findings, and important updates
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">
                <div className="flex items-center space-x-1">
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="urgent">
                <div className="flex items-center space-x-1">
                  <span>Urgent</span>
                  {urgentCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">
                      {urgentCount}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="action">Action Required</TabsTrigger>
            </TabsList>

            {['all', 'unread', 'urgent', 'action'].map((filter) => (
              <TabsContent key={filter} value={filter} className="space-y-3">
                {filterNotifications(filter).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications in this category</p>
                  </div>
                ) : (
                  filterNotifications(filter).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${getTypeColor(notification.type)} ${
                        !notification.isRead ? 'border-l-4' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{notification.title}</h4>
                              {getPriorityBadge(notification.priority)}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {notification.patientId && (
                                <span>Patient: {notification.patientId}</span>
                              )}
                              {notification.scanId && (
                                <span>Scan: {notification.scanId}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-4">
                          {notification.actionRequired && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
