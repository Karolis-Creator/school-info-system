// src/hooks/useFirestore.js
import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Real-time collection listener scoped to a school
export function useCollection(collectionName, schoolId, orderField = 'createdAt') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !collectionName) return;
    const q = query(
      collection(db, collectionName),
      where('schoolId', '==', schoolId),
      orderBy(orderField, 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [collectionName, schoolId, orderField]);

  return { data, loading };
}

// CRUD helpers
export function useFirestoreCRUD(collectionName, schoolId) {
  async function add(data) {
    return addDoc(collection(db, collectionName), {
      ...data,
      schoolId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function update(id, data) {
    return updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async function remove(id) {
    return deleteDoc(doc(db, collectionName, id));
  }

  return { add, update, remove };
}
