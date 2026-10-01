/**
 * Utility for managing user-scoped recent rooms in localStorage.
 * Scoping by the user's email ensures that different accounts or new users
 * never see each other's recent rooms.
 */

export const getRecentRoomsStorageKey = (user) => {
  if (!user) return null;
  const email = user.email?.trim().toLowerCase();
  if (email) {
    return `synccanvas_recent_rooms_${email}`;
  }
  const id = user.id || user._id;
  if (id) {
    return `synccanvas_recent_rooms_id_${id}`;
  }
  return null;
};

export const getLocalRecentRooms = (user) => {
  const key = getRecentRoomsStorageKey(user);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read user recent rooms:", e);
    return [];
  }
};

export const setLocalRecentRooms = (user, rooms) => {
  const key = getRecentRoomsStorageKey(user);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(rooms.slice(0, 20)));
  } catch (e) {
    console.error("Failed to save user recent rooms:", e);
  }
};
