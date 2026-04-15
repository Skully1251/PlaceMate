import { createUser, getUser } from '../services/firebaseService.js';
import { adminAuth } from '../config/firebase.js';

/**
 * POST /api/auth/signup
 * Body: { name, email, uid }
 * Creates a Firestore user profile after client-side Firebase Auth signup.
 */
export async function signup(req, res) {
  try {
    const { name, email, uid } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required.' });
    }

    const user = await createUser(uid, { name, email });
    res.status(201).json({ message: 'User profile created.', user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user profile.' });
  }
}

/**
 * POST /api/auth/login
 * Body: { uid }
 * Returns Firestore user profile after client-side Firebase Auth login.
 */
export async function login(req, res) {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'uid is required.' });
    }

    let user = await getUser(uid);
    
    if (!user) {
      // Auto-create from Firebase Auth record
      try {
        const authUser = await adminAuth.getUser(uid);
        user = await createUser(uid, {
          name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
        });
        user = { id: uid, ...user };
      } catch {
        return res.status(404).json({ error: 'User not found.' });
      }
    }

    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}

/**
 * POST /api/auth/google
 * Body: { uid, name, email }
 * Creates or retrieves Firestore profile for Google-authenticated users.
 */
export async function googleAuth(req, res) {
  try {
    const { uid, name, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required.' });
    }

    const user = await createUser(uid, { name, email });
    res.json({ user: { id: uid, ...user } });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to process Google authentication.' });
  }
}
