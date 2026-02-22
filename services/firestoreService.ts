import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { ChatSession } from '../types';

export const FirestoreService = {
  // Collection reference
  sessionsRef: collection(db, 'sessions'),

  async saveSession(userId: string, session: ChatSession) {
    if (!userId) return;
    const docRef = doc(db, 'sessions', session.id);
    await setDoc(docRef, {
      ...session,
      userId,
      updatedAt: Date.now()
    }, { merge: true });
  },

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    if (!userId) return [];
    const q = query(
      this.sessionsRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ChatSession);
  },

  async deleteSession(sessionId: string) {
    const docRef = doc(db, 'sessions', sessionId);
    await deleteDoc(docRef);
  },

  async updateSessionTitle(sessionId: string, title: string) {
    const docRef = doc(db, 'sessions', sessionId);
    await updateDoc(docRef, { title, updatedAt: Date.now() });
  }
};