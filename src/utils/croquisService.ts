import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Documentación: Creamos una interfaz exacta de lo que ImageKit nos responde 
// para evitar el uso de 'any' y mantener TypeScript sin errores.
interface ImageKitResponse {
  url: string;
  fileId: string;
  name: string;
}

export const guardarCroquis = async (
  eventoId: string, 
  adminId: string | null, 
  file: File | null
): Promise<void> => {
  let url: string | null = null;

  // 1. Proceso de subida a ImageKit
  if (file) {
    const privateKey = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("Falta la llave privada de ImageKit en las variables de entorno.");
    }

    // Preparamos los datos del archivo para enviarlos
    const formData = new FormData();
    formData.append('file', file);
    
    // Creamos un nombre único para evitar que las imágenes se sobreescriban
    const fileName = adminId ? `croquis_admin_${adminId}_${Date.now()}` : `croquis_general_${Date.now()}`;
    formData.append('fileName', fileName);

    // ImageKit requiere autenticación básica (Basic Auth) usando la Private Key.
    // La función btoa() convierte nuestra llave al formato Base64 que pide la web.
    const headers = new Headers();
    headers.append('Authorization', `Basic ${btoa(privateKey + ':')}`);

    // Hacemos la petición (POST) a la API oficial de ImageKit
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error de red al intentar subir la imagen a ImageKit.");
    }

    // Convertimos la respuesta y la tipamos con nuestra interfaz
    const data = (await response.json()) as ImageKitResponse;
    
    // ImageKit nos devuelve la URL pública en la propiedad 'url'
    url = data.url; 
  }

  // 2. Guardamos la URL en nuestra base de datos (Firestore)
  const docRef = doc(db, 'eventos', eventoId);
  
  if (adminId) {
    const snap = await getDoc(docRef);
    // Tipamos el objeto para asegurarnos de que TypeScript sepa qué estructura tiene
    const croquisPorAdmin = (snap.data()?.croquisPorAdmin || {}) as Record<string, string | null>;
    
    await updateDoc(docRef, {
      croquisPorAdmin: { ...croquisPorAdmin, [adminId]: url }
    });
  } else {
    // Si no hay adminId, guardamos el croquis general
    await updateDoc(docRef, { croquisUrl: url });
  }
};