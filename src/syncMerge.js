const getNow = () => new Date().toISOString();

// Generate a collision-resistant ID for new records.
export function createSyncId(prefix = 'item') {
  const id = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${id}`;
}

// Add sync timestamps to a record.
// Existing creation time is preserved.
export function stampSyncRecord(record, now = getNow()) {
  return {
    ...record,
    _sync: {
      createdAt: record?._sync?.createdAt ?? now,
      updatedAt: now,
    },
  };
}

// Add an ID and sync metadata to a record.
export function prepareSyncRecord(record, prefix = 'item') {
  const withId = {
    ...record,
    id: record?.id ?? createSyncId(prefix),
  };

  if (withId._sync?.createdAt && withId._sync?.updatedAt) {
    return withId;
  }

  return stampSyncRecord(withId);
}

// Merge two deletion-marker lists.
// The latest deletion timestamp is retained for each ID.
export function mergeTombstones(local = [], remote = []) {
  const merged = new Map();

  for (const marker of [...remote, ...local]) {
    if (!marker?.id || !marker?.deletedAt) continue;

    const previous = merged.get(marker.id);

    if (
      !previous ||
      new Date(marker.deletedAt).getTime() >
        new Date(previous.deletedAt).getTime()
    ) {
      merged.set(marker.id, marker);
    }
  }

  return [...merged.values()];
}

// Merge records by ID using their latest sync update timestamp.
// Local data wins when timestamps are equal.
export function mergeSyncRecords(local = [], remote = [], tombstones = []) {
  const merged = new Map();

  for (const record of remote) {
    if (record?.id) merged.set(record.id, record);
  }

  for (const record of local) {
    if (!record?.id) continue;

    const previous = merged.get(record.id);

    const localTime = new Date(
      record?._sync?.updatedAt ?? 0
    ).getTime();

    const remoteTime = new Date(
      previous?._sync?.updatedAt ?? 0
    ).getTime();

    if (!previous || localTime >= remoteTime) {
      merged.set(record.id, record);
    }
  }

  const deletedIds = new Set(
    tombstones
      .filter((item) => item?.id && item?.deletedAt)
      .filter((item) => {
        const record = merged.get(item.id);
        if (!record) return true;

        const deletedTime = new Date(item.deletedAt).getTime();
        const updatedTime = new Date(
          record?._sync?.updatedAt ?? 0
        ).getTime();

        return deletedTime >= updatedTime;
      })
      .map((item) => item.id)
  );

  return [...merged.values()].filter(
    (record) => !deletedIds.has(record.id)
  );
}
