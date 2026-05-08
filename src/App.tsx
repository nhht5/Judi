import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { UserProfile } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubProfileRef = useRef<(() => void) | null>(null);

  const cleanupListeners = () => {
    if (unsubProfileRef.current) {
      unsubProfileRef.current();
      unsubProfileRef.current = null;
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Immediate cleanup of old listeners
      cleanupListeners();
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setLoading(true);
        const userRef = doc(db, 'users', firebaseUser.uid);
        let docSnap;
        
        try {
          docSnap = await getDoc(userRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`, firebaseUser);
          setLoading(false);
          return;
        }

        if (!docSnap.exists()) {
          const urlParams = new URLSearchParams(window.location.search);
          const referredBy = urlParams.get('ref') || null;
          
          const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Pemain',
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${firebaseUser.uid}`,
            chips: 1000, 
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            referredBy: referredBy,
            createdAt: serverTimestamp()
          };
          
          try {
            await setDoc(userRef, newProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`, firebaseUser);
          }
        }

        // Start new real-time listener
        unsubProfileRef.current = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
            setLoading(false);
          }
        }, (error) => {
          // If we get a permission error on snapshot, it's likely during sign out
          // so we check if firebaseUser is still the current user according to this closure
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`, firebaseUser);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      cleanupListeners();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#6366f1]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="font-sans antialiased">
      <AnimatePresence mode="wait">
        {!user || !profile ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Login />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard user={profile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
