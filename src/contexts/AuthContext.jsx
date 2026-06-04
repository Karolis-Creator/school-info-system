// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setUserData(snap.data());
        else setUserData(null);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Mokinio registracija — mokyklos kodas + vardas + el. paštas + slaptažodis
  async function registerStudent(schoolCode, displayName, email, password) {
    const q = query(collection(db, 'schools'), where('accessCode', '==', schoolCode.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Neteisingas mokyklos kodas');
    const school = { id: snap.docs[0].id, ...snap.docs[0].data() };
    if (!school.active) throw new Error('Ši mokykla šiuo metu neaktyvi');

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: displayName.trim() });
    const data = {
      uid: cred.user.uid,
      email: email.trim(),
      displayName: displayName.trim(),
      role: 'student',
      schoolId: school.id,
      schoolName: school.name,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    setUserData(data);
    return cred.user;
  }

  // Mokinio prisijungimas — el. paštas + slaptažodis
  async function loginStudent(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) { await signOut(auth); throw new Error('Paskyra nerasta'); }
    const data = snap.data();
    if (data.role !== 'student') { await signOut(auth); throw new Error('Ši paskyra nėra mokinio paskyra'); }
    setUserData(data);
    return cred.user;
  }

  // Administratorius — el. paštas + slaptažodis
  async function loginAdmin(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) { await signOut(auth); throw new Error('Vartotojas nerastas'); }
    const data = snap.data();
    if (data.role !== 'admin' && data.role !== 'superadmin') {
      await signOut(auth);
      throw new Error('Nėra administratoriaus teisių');
    }
    setUserData(data);
    return { user: cred.user, userData: data };
  }

  // Tik superadmin kuria admin paskyras
  async function registerAdmin(email, password, displayName, schoolId) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName,
      role: 'admin',
      schoolId,
      createdAt: serverTimestamp(),
    });
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
  }

  const isSuperAdmin = userData?.role === 'superadmin';
  const isAdmin = userData?.role === 'admin' || isSuperAdmin;
  const isStudent = userData?.role === 'student';

  return (
    <AuthContext.Provider value={{
      user, userData, loading,
      isSuperAdmin, isAdmin, isStudent,
      schoolId: userData?.schoolId,
      schoolName: userData?.schoolName,
      registerStudent, loginStudent, loginAdmin, registerAdmin, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
