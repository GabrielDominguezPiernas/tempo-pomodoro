let permissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    permissionGranted = permission === 'granted';
    return permissionGranted;
  } catch {
    return false;
  }
}

async function showViaServiceWorker(title: string, body: string): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'pomodoro',
        silent: true, // Ya reproducimos nuestro propio sonido
      } as NotificationOptions);
      return true;
    }
  } catch {
    // Fallback a notificación normal
  }
  return false;
}

export async function showNotification(title: string, body: string): Promise<void> {
  if (!permissionGranted || !('Notification' in window)) {
    return;
  }

  // Intentar primero via Service Worker (mejor para móvil/PWA)
  const swSuccess = await showViaServiceWorker(title, body);
  if (swSuccess) {
    return;
  }

  // Fallback a notificación directa
  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      silent: true, // Ya reproducimos nuestro propio sonido
    });
  } catch {
    // Las notificaciones pueden fallar en algunos contextos
  }
}
