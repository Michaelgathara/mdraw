// src/components/ui/NotificationContainer.tsx
'use client';
  
import Notification from './Notification';
import { useNotifications } from '@/lib/utils/useNotifications';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}