import { useState } from "react";

export const useLocalStorageFallback = () => {
  const [storageAvailable] = useState(() => {
    try {
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  });

  /**
   * Get all storage keys
   */
  const getAllKeys = (): string[] => {
    if (!storageAvailable) return [];

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) {
        keys.push(key);
      }
    }
    return keys;
  };

  /**
   * Get an item from localStorage
   */
  const getItems = (key: string): any => {
    if (!storageAvailable) return null;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting items for key "${key}":`, error);
      return null;
    }
  };

  /**
   * Set an item in localStorage
   */
  const setItems = (key: string, value: any): void => {
    if (!storageAvailable) return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Handle quota exceeded or other storage errors
      console.error(`Error setting items for key "${key}":`, error);
      
      // If it's a QuotaExceededError, try to clear some space
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        clearOldestItems(key, value);
      }
    }
  };

  /**
   * Remove an item from localStorage
   */
  const removeItem = (key: string): void => {
    if (!storageAvailable) return;
    localStorage.removeItem(key);
  };

  /**
   * Clear all items from localStorage
   */
  const clearAll = (): void => {
    if (!storageAvailable) return;
    localStorage.clear();
  };

  /**
   * Get storage usage information
   */
  const getStorageInfo = () => {
    if (!storageAvailable) {
      return {
        totalSize: 0,
        limit: 0,
        usage: 0,
        items: {}
      };
    }

    const items: Record<string, { key: string; size: number }> = {};
    let totalSize = 0;

    // Estimate size of each item
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) {
        const value = localStorage.getItem(key) || "";
        const size = new Blob([key, value]).size;
        items[key] = { key, size };
        totalSize += size;
      }
    }

    // Estimate the storage limit (5MB for most browsers)
    const estimatedLimit = 5 * 1024 * 1024;
    const usage = (totalSize / estimatedLimit) * 100;

    return {
      totalSize,
      limit: estimatedLimit,
      usage,
      items,
    };
  };

  /**
   * If storage is full, clear older/unused items to make space
   */
  const clearOldestItems = (newKey: string, newValue: any): void => {
    if (!storageAvailable) return;

    // Skip if we're trying to store pending actions
    if (newKey === 'pendingActions') return;

    try {
      // Get all keys and their last modified timestamps
      const keys = getAllKeys();
      const keyInfos = keys.map(key => {
        const data = getItems(key);
        const lastModified = data?.lastModified || 0;
        const size = new Blob([key, JSON.stringify(data)]).size;
        return { key, lastModified, size };
      });

      // Sort by last modified (oldest first)
      keyInfos.sort((a, b) => a.lastModified - b.lastModified);

      // Calculate size of new data
      const newDataSize = new Blob([newKey, JSON.stringify(newValue)]).size;
      let freedSpace = 0;
      let keysToRemove: string[] = [];

      // Clear items until we have enough space
      for (const { key, size } of keyInfos) {
        // Skip critical keys
        if (key === 'pendingActions' || key === 'local_user' || key === 'local_users') {
          continue;
        }

        keysToRemove.push(key);
        freedSpace += size;

        // Stop when we've freed enough space
        if (freedSpace >= newDataSize) {
          break;
        }
      }

      // Remove selected keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Try saving again
      if (keysToRemove.length > 0) {
        localStorage.setItem(newKey, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error("Failed to clear space in localStorage:", error);
    }
  };

  /**
   * Store data with timestamp
   */
  const setItemsWithTimestamp = (key: string, value: any): void => {
    setItems(key, {
      ...value,
      lastModified: Date.now()
    });
  };

  /**
   * Append to an array in localStorage
   */
  const appendToArray = (key: string, value: any): void => {
    const currentArray = getItems(key) || [];
    if (!Array.isArray(currentArray)) {
      setItems(key, [value]);
    } else {
      setItems(key, [...currentArray, value]);
    }
  };

  /**
   * Update an item in an array in localStorage
   */
  const updateItemInArray = (key: string, itemId: string, updates: any): boolean => {
    const currentArray = getItems(key) || [];
    if (!Array.isArray(currentArray)) return false;

    const index = currentArray.findIndex((item: any) => item.id === itemId);
    if (index === -1) return false;

    currentArray[index] = { ...currentArray[index], ...updates };
    setItems(key, currentArray);
    return true;
  };

  /**
   * Remove an item from an array in localStorage
   */
  const removeItemFromArray = (key: string, itemId: string): boolean => {
    const currentArray = getItems(key) || [];
    if (!Array.isArray(currentArray)) return false;

    const filteredArray = currentArray.filter((item: any) => item.id !== itemId);
    if (filteredArray.length === currentArray.length) return false;

    setItems(key, filteredArray);
    return true;
  };

  return {
    getAllKeys,
    getItems,
    setItems,
    removeItem,
    clearAll,
    getStorageInfo,
    setItemsWithTimestamp,
    appendToArray,
    updateItemInArray,
    removeItemFromArray,
    isStorageAvailable: storageAvailable,
  };
};