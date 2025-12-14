export interface ILockedUser {
  email: string;
  name: string;
  lastLocked: number;
}

const LOCKED_USER_KEY = "cmho_locked_user";

/**
 * Store user information when locking the screen
 */
export const setLockedUser = (email: string, name: string): void => {
  const lockedUser: ILockedUser = {
    email,
    name,
    lastLocked: Date.now(),
  };
  localStorage.setItem(LOCKED_USER_KEY, JSON.stringify(lockedUser));
};

/**
 * Get locked user information
 */
export const getLockedUser = (): ILockedUser | null => {
  try {
    const data = localStorage.getItem(LOCKED_USER_KEY);
    if (!data) return null;
    return JSON.parse(data) as ILockedUser;
  } catch (error) {
    console.error("Failed to parse locked user data:", error);
    return null;
  }
};

/**
 * Clear locked user information
 */
export const clearLockedUser = (): void => {
  localStorage.removeItem(LOCKED_USER_KEY);
};

/**
 * Check if there is a locked user session
 */
export const hasLockedUser = (): boolean => {
  return localStorage.getItem(LOCKED_USER_KEY) !== null;
};

