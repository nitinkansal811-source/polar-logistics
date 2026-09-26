import Dexie, { Table } from 'dexie';

export interface PendingAction {
  id: string;
  action_type: 'inventory_checkout' | 'inventory_checkin' | 'incident_report' | 'task_update';
  payload: any;
  timestamp: string;
  synced: boolean;
}

export interface OfflineInventory {
  id: string;
  item_name: string;
  station_id: string;
  current_stock: number;
  unit: string;
  last_updated: string;
}

export class PolarFieldDatabase extends Dexie {
  pendingActions!: Table<PendingAction, string>;
  offlineInventory!: Table<OfflineInventory, string>;

  constructor() {
    super('PolarFieldOfflineDB');
    this.version(1).stores({
      pendingActions: 'id, action_type, timestamp, synced',
      offlineInventory: 'id, item_name, station_id'
    });
  }
}

export const db = new PolarFieldDatabase();

export const queueOfflineAction = async (
  action_type: PendingAction['action_type'],
  payload: any
): Promise<PendingAction> => {
  const action: PendingAction = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action_type,
    payload,
    timestamp: new Date().toISOString(),
    synced: false
  };

  await db.pendingActions.add(action);
  return action;
};

export const getPendingActions = async (): Promise<PendingAction[]> => {
  return await db.pendingActions.where('synced').equals(0).toArray();
};

export const getPendingCount = async (): Promise<number> => {
  return await db.pendingActions.where('synced').equals(0).count();
};

export const markActionsSynced = async (ids: string[]): Promise<void> => {
  await db.pendingActions.bulkDelete(ids);
};
