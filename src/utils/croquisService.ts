import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

export const guardarCroquis = async (eventoId: string, adminId: string | null, file: File | null) => {
  let url = null;
  
  // 1. Subir imagen a Firebase Storage
  if (file) {
    const path = adminId 
      ? `croquis/${eventoId}/admin_${adminId}_${Date.now()}`
      : `croquis/${eventoId}/general_${Date.now()}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    url = await getDownloadURL(storageRef);
  }

  // 2. Actualizar base de datos
  const docRef = doc(db, 'eventos', eventoId);
  if (adminId) {
    const snap = await getDoc(docRef);
    const croquisPorAdmin = snap.data()?.croquisPorAdmin || {};
    await updateDoc(docRef, {
      croquisPorAdmin: { ...croquisPorAdmin, [adminId]: url }
    });
  } else {
    await updateDoc(docRef, { croquisUrl: url });
  }
};