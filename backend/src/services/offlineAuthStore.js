import bcrypt from 'bcryptjs';

/**
 * In-memory authentication fallback used ONLY when MongoDB is offline.
 *
 * The backend must never crash without Mongo (README §9), and every data route
 * is auth-protected — so login/register/protect need an offline path too.
 * Accounts created here live in process memory: they survive until the server
 * restarts and are clearly logged as offline/demo accounts.
 *
 * When MongoDB is available, the User model is always preferred; this store is
 * only consulted as a fallback.
 */

const usersByEmail = new Map(); // email (lowercased) -> record
const usersById = new Map(); // id -> public profile
let counter = 0;

const toPublicUser = (record) => ({
  id: record.id,
  name: record.name,
  email: record.email,
  role: record.role,
  phone: record.phone,
  location: record.location
});

export const offlineAuthStore = {
  findByEmail: (email) => {
    if (!email) return null;
    return usersByEmail.get(String(email).toLowerCase()) || null;
  },

  findById: (id) => {
    if (!id) return null;
    return usersById.get(String(id)) || null;
  },

  create: async ({ name, email, password, phone = '', role = 'farmer', location = '' }) => {
    const normalizedEmail = String(email).toLowerCase();
    if (usersByEmail.has(normalizedEmail)) {
      const err = new Error('An account with this email already exists');
      err.code = 'OFFLINE_DUPLICATE_EMAIL';
      throw err;
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    counter += 1;
    const record = {
      id: `offline-${counter}-${Date.now().toString(36)}`,
      name,
      email: normalizedEmail,
      role,
      phone,
      location,
      passwordHash
    };
    usersByEmail.set(normalizedEmail, record);
    usersById.set(record.id, record);
    console.warn(
      `[Auth][OFFLINE] Created in-memory account ${normalizedEmail} (MongoDB offline — this account is not persisted and disappears on restart).`
    );
    return toPublicUser(record);
  },

  matchPassword: async (email, enteredPassword) => {
    const record = offlineAuthStore.findByEmail(email);
    if (!record) return false;
    return bcrypt.compare(enteredPassword, record.passwordHash);
  },

  /** Public profile without the password hash, or null. */
  toPublicUser: (recordOrProfile) => {
    if (!recordOrProfile) return null;
    if (recordOrProfile.passwordHash) return toPublicUser(recordOrProfile);
    return recordOrProfile;
  }
};
