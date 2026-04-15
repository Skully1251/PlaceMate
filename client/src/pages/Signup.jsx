import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from '../config/firebase.js';
import api from '../utils/api.js';

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set display name
      await updateProfile(user, { displayName: name });

      const token = await user.getIdToken();

      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userUid', user.uid);

      // Create user profile in Firestore via backend
      await api.post('/api/auth/signup', {
        uid: user.uid,
        name,
        email: user.email,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('userName', user.displayName || 'Google User');
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userUid', user.uid);

      // Sync with backend
      await api.post('/api/auth/google', {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Google signup error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google signup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 p-4 relative overflow-hidden">
      {/* Back button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors z-20 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        <span>Back to Home</span>
      </Link>

      {/* Background decorations */}
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-blue-300/30 rounded-[50%] blur-[120px]"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-pink-400/30 rounded-[30%] blur-[100px]"></div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 sm:p-12 w-full max-w-md relative z-10 text-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2 drop-shadow-md">Create Account</h2>
          <p className="text-white/70">Join PlaceMate today</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet/50 text-white placeholder-white/30 transition-all shadow-inner"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet/50 text-white placeholder-white/30 transition-all shadow-inner"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet/50 text-white placeholder-white/30 transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-violet hover:bg-violet-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-violet/50 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 flex items-center text-white/40">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-4 text-sm">OR</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        <button 
          onClick={handleGoogleSignup}
          disabled={loading}
          className="mt-6 w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-violet font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;