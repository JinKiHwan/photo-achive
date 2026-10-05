import { listAll, deleteObject, type StorageReference } from "firebase/storage";

export async function removeStorageTree(folder: StorageReference): Promise<void> {
  const listing = await listAll(folder);
  for (const child of listing.prefixes) await removeStorageTree(child);
  for (const item of listing.items) {
    try { await deleteObject(item); }
    catch (error) { if ((error as { code?: string }).code !== "storage/object-not-found") throw error; }
  }
}

