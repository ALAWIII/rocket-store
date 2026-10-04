export async function waitStorageForAllDeletions(
  ids: string[],
  checkExistsFn: (id: string) => Promise<boolean>,
  intervalMs = 700,
) {
  const pendingIds = new Set(ids);

  while (pendingIds.size > 0) {
    const checks = Array.from(pendingIds).map(async (id) => {
      try {
        const exists = await checkExistsFn(id);
        if (!exists) {
          pendingIds.delete(id); // Successfully deleted, remove from polling
        }
      } catch {
        // Ignore transient network errors, retry next second
      }
    });

    await Promise.all(checks);

    if (pendingIds.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}
