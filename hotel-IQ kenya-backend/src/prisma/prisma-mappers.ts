export function mapRecord(record: any) {
  if (!record) {
    return record;
  }

  const { id, ...rest } = record;
  return {
    ...rest,
    _id: id,
    id,
  };
}

export function mapRecords(records: any[]) {
  return records.map((record) => mapRecord(record));
}

export function stripPassword(record: any) {
  const { password, ...rest } = record;
  return rest;
}