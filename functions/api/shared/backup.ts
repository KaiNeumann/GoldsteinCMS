import { BACKUP_PREFIX, MAX_BACKUPS } from "../storage/backupConstants";

export function createBackupFiles(currentContent: unknown, existingFiles: string[], timestamp: string): { extraFiles: Record<string, string>; deleteFiles: string[] } {
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const backupName = `${BACKUP_PREFIX}${safeTimestamp}.json`;
  const backups = existingFiles.filter((name) => name.startsWith(BACKUP_PREFIX) && name.endsWith(".json")).sort().reverse();
  const deleteFiles = backups.slice(Math.max(0, MAX_BACKUPS - 1));

  return {
    extraFiles: {
      [backupName]: JSON.stringify(currentContent, null, 2),
    },
    deleteFiles,
  };
}
