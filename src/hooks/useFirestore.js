import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useCollection(collectionName, schoolId, orderField = 'createdAt') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !collectionName) {
      setLoading(false);
      return;
    }
    
    // JOKIO orderBy Firestore pusėje!!!
    const q = query(collection(db, collectionName), where('schoolId', '==', schoolId));
    
    const unsub = onSnapshot(q, snap => {
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Rūšiavimas JavaScript pusėje
      if (orderField) {
        results = results.sort((a, b) => {
          let valA = a[orderField];
          let valB = b[orderField];
          
          if (orderField === 'date') {
            return new Date(valB) - new Date(valA);
          }
          if (orderField === 'createdAt') {
            valA = valA?.toDate ? valA.toDate() : new Date(valA);
            valB = valB?.toDate ? valB.toDate() : new Date(valB);
            return valB - valA;
          }
          
          if (valA > valB) return -1;
          if (valA < valB) return 1;
          return 0;
        });
      }
      
      setData(results);
      setLoading(false);
    }, error => {
      console.error(`Klaida ${collectionName}:`, error);
      setLoading(false);
    });
    
    return unsub;
  }, [collectionName, schoolId, orderField]);

  return { data, loading };
}

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
