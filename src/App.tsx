import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from './shared/firebase';
import { useUIStore } from './shared/store';
import type { UserProfile } from './shared/types';
import { AuthView } from './features/auth/AuthView';
import { WaitingRoomView } from './features/auth/WaitingRoomView';
import { TeamGovernanceModal } from './features/team/TeamGovernanceModal';
import { GlobalSettingsModal } from './features/settings/GlobalSettingsModal';
import { OrderDashboard } from './features/orders/OrderDashboard';
import { UpdaterBanner } from './features/updater/UpdaterBanner';

export function App() {
  const currentUser = useUIStore((s) => s.currentUser);
  const setCurrentUser = useUIStore((s) => s.setCurrentUser);

  const [authLoading, setAuthLoading] = useState(true);
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);

  // Sync authentic Firebase Auth state & Real-Time Profile Listener
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    console.log('[Aura Auth Trace] Initializing Firebase Auth observer...');

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        '[Aura Auth Trace] onAuthStateChanged fired. User:',
        firebaseUser ? `${firebaseUser.email} (${firebaseUser.uid})` : 'null (Unauthenticated)'
      );

      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        const isOwnerEmail = firebaseUser.email?.toLowerCase().includes('shahrukh') ?? false;

        // Ensure user doc exists in Firestore; if not or if network stalls, use immediate fallback
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await Promise.race([
            getDoc(userDocRef),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
          ]);

          if (!snap || !snap.exists()) {
            console.log('[Aura Auth Trace] User doc not found or timed out, generating synthesized fallback profile');
            const initialRole = isOwnerEmail ? 'owner' : 'unassigned';
            const initialStatus = initialRole === 'owner' ? 'active' : 'pending_approval';
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Team Member',
              role: initialRole,
              status: initialStatus,
              initials: (firebaseUser.displayName || firebaseUser.email || 'TM').slice(0, 2).toUpperCase(),
              createdAt: Date.now(),
            };
            // Fire-and-forget background creation
            setDoc(userDocRef, fallbackProfile, { merge: true }).catch(console.warn);
            setCurrentUser(fallbackProfile);
          } else {
            const data = snap.data() as UserProfile;
            // Prevent non-shahrukh accounts from accidentally persisting owner role
            if (!isOwnerEmail && data.role === 'owner') {
              console.warn(`[Aura Desk] Reverting non-owner account ${data.email} to unassigned`);
              const corrected: UserProfile = {
                ...data,
                role: 'unassigned',
                status: 'pending_approval',
              };
              setDoc(userDocRef, { role: 'unassigned', status: 'pending_approval' }, { merge: true }).catch(console.warn);
              setCurrentUser(corrected);
            } else {
              setCurrentUser(data);
            }
          }
        } catch (e) {
          console.warn('[Aura Auth Trace] Profile initialization fallback:', e);
          const initialRole = isOwnerEmail ? 'owner' : 'unassigned';
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Team Member',
            role: initialRole,
            status: initialRole === 'owner' ? 'active' : 'pending_approval',
            initials: (firebaseUser.displayName || firebaseUser.email || 'TM').slice(0, 2).toUpperCase(),
            createdAt: Date.now(),
          });
        }

        // Real-time listener for current user document updates (e.g. role promotions)
        unsubUserDoc = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              if (!isOwnerEmail && data.role === 'owner') {
                setCurrentUser({ ...data, role: 'unassigned', status: 'pending_approval' });
              } else {
                setCurrentUser(data);
              }
            }
          },
          (err) => {
            console.error('[Aura Desk] User profile listener error:', err);
          }
        );
      } else {
        setCurrentUser(null);
      }

      // Conclude initial auth verification and reveal UI without jumping
      setAuthLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, [setCurrentUser]);

  // Sync authentic Team Directory directly from Firestore
  useEffect(() => {
    const unsubTeam = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => list.push(d.data() as UserProfile));
        setTeamUsers(list);
      },
      (e) => {
        console.warn('Team snapshot error:', e);
      }
    );
    return () => unsubTeam();
  }, []);

  // 1. Initial Authentication Check -> Prevent Login Screen Flash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-6 select-none">
        <div className="w-12 h-12 rounded-2xl bg-[#1C1D21] flex items-center justify-center text-white font-mono text-base font-bold shadow-xl mb-4 animate-pulse">
          AD
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B7280] font-medium">
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#1C1D21] rounded-full animate-spin" />
          <span>Restoring secure agency workspace...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Show clean Auth View
  if (!currentUser) {
    return <AuthView />;
  }

  // 3. Unassigned or pending approval -> Locked to Waiting Room View
  if (currentUser.role === 'unassigned' || currentUser.status === 'pending_approval') {
    return <WaitingRoomView />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1C1D21] flex flex-col font-sans select-none overflow-hidden">
      {/* Background Auto-Updater notification banner */}
      <UpdaterBanner />

      {/* Main Workspace with clean, minimal layout and zero visual bloat */}
      <main className="flex-1 flex overflow-hidden">
        <OrderDashboard teamUsers={teamUsers} />
      </main>

      {/* Team Governance Modal */}
      <TeamGovernanceModal />

      {/* Global Workspace Settings Modal */}
      <GlobalSettingsModal />
    </div>
  );
}

export default App;
