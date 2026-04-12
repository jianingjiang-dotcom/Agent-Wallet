// In-App Notification API — event emitter pattern (like toast.ts)

export interface InAppNotif {
  id: string;
  icon?: any;  // React.ReactNode — kept as any to avoid React import in .ts
  title: string;
  subtitle: string;
  route?: string;
  duration?: number; // ms, default 4000
}

type Listener = (notif: InAppNotif) => void;

const listeners = new Set<Listener>();

export function onInAppNotification(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

let counter = 0;

export function showInAppNotification(notif: Omit<InAppNotif, 'id'> & { id?: string }) {
  const full: InAppNotif = {
    ...notif,
    id: notif.id || `notif-${++counter}-${Date.now()}`,
    duration: notif.duration ?? 4000,
  };
  listeners.forEach(fn => fn(full));
}
