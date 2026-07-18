import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, setDoc } from 'firebase/firestore';

const loadDotEnv = () => {
  const envPath = new URL('../.env', import.meta.url);
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex < 0) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadDotEnv();

const env = process.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID
};

const missing = Object.entries(firebaseConfig).filter(([_, value]) => !value);
if (missing.length > 0) {
  console.error('Faltan variables de entorno de Firebase. Por favor configura:');
  missing.forEach(([key]) => console.error(`  - ${key}`));
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const main = async () => {
  console.log('Iniciando migración de accessIds...');
  const eventosSnap = await getDocs(collection(db, 'eventos'));
  console.log(`Eventos encontrados: ${eventosSnap.size}`);

  let totalWritten = 0;
  let totalSkipped = 0;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const eventoDoc of eventosSnap.docs) {
    const evento = eventoDoc.data();
    const eventId = eventoDoc.id;

    const processId = async (id, type) => {
      if (!id || typeof id !== 'string') return;
      const accessIdRef = doc(db, 'accessIds', id);
      batch.set(accessIdRef, { eventoId: eventId, type });
      batchCount += 1;
      totalWritten += 1;
      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    };

    if (Array.isArray(evento.admins)) {
      for (const admin of evento.admins) {
        await processId(admin?.id, 'admin');
      }
    }

    if (evento.supervisor && typeof evento.supervisor.usuario === 'string') {
      await processId(evento.supervisor.usuario, 'supervisor');
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Migración completada. accessIds escritos: ${totalWritten}`);
};

main().catch((error) => {
  console.error('Error durante la migración:', error);
  process.exit(1);
});
