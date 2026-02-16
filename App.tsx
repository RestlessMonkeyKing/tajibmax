import React, { useState, useEffect } from 'react';
import { User, Theme, Chat } from './types';
import { auth, db, rtdb } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, set, onDisconnect, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// Helper to get theme styles
const getThemeStyles = (theme: Theme) => {
  switch (theme) {
    case 'dark': return 'bg-gray-900 text-white';
    case 'liquid': return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white';
    case 'sunset': return 'bg-gradient-to-br from-orange-100 via-amber-100 to-rose-100 text-gray-900';
    case 'forest': return 'bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 text-white';
    default: return 'bg-gray-50 text-gray-900'; // light
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [usersCache, setUsersCache] = useState<User[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

  // Auth & Presence Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. Firestore User Profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        const userData: User = {
          id: user.uid,
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || undefined,
          email: user.email || undefined,
          isOnline: true,
          theme: 'light',
          ...userSnap.data()
        };

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            email: userData.email,
            createdAt: serverTimestamp(),
            theme: 'light',
            isOnline: true
          });
        } else {
           // Update online status
           await updateDoc(userRef, { isOnline: true });
           if (userData.theme) setTheme(userData.theme as Theme);
        }

        setCurrentUser(userData);

        // 2. Realtime Database Presence
        const statusRef = ref(rtdb, `status/${user.uid}`);
        onDisconnect(statusRef).set({ state: 'offline', last_changed: rtdbTimestamp() });
        set(statusRef, { state: 'online', last_changed: rtdbTimestamp() });

      } else {
        setCurrentUser(null);
        setSelectedChat(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch all users for cache (Simplified for this context)
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'users');
    getDocs(q).then(snap => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setUsersCache(users);
    });
  }, [currentUser]);

  const handleSelectChat = async (chat: Chat, otherUser?: User) => {
    if (chat.id === 'new') {
      // Find existing or create new
      const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser!.id));
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const data = d.data();
        return !data.isGroup && data.members.includes(otherUser!.id);
      });

      if (existing) {
        setSelectedChat({ 
          id: existing.id, ...existing.data(), 
          displayName: otherUser?.displayName,
          photoURL: otherUser?.photoURL,
          isOnline: otherUser?.isOnline 
        } as Chat);
      } else {
        // Create
        const newDoc = await addDoc(collection(db, 'chats'), {
          members: [currentUser!.id, otherUser!.id],
          isGroup: false,
          createdAt: serverTimestamp(),
          lastMessage: { text: 'Chat created', timestamp: serverTimestamp(), type: 'system' }
        });
        setSelectedChat({ 
          id: newDoc.id, 
          members: [currentUser!.id, otherUser!.id],
          displayName: otherUser?.displayName,
          photoURL: otherUser?.photoURL,
          isOnline: otherUser?.isOnline
        });
      }
    } else {
      setSelectedChat(chat);
    }
    setIsMobileSidebarOpen(false);
  };

  const handleChangeTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.id), { theme: newTheme });
    }
  };

  const handleCreateGroup = async () => {
    const name = prompt("Enter Group Name:");
    if (!name || !currentUser) return;
    // Simple implementation: just create a group with yourself for now
    // A real modal would allow selecting members
    await addDoc(collection(db, 'chats'), {
      isGroup: true,
      groupName: name,
      members: [currentUser.id],
      createdBy: currentUser.id,
      lastMessage: { text: 'Group created', timestamp: serverTimestamp(), type: 'system' }
    });
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-100"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!currentUser) return <Login />;

  const themeClass = getThemeStyles(theme);
  const isDark = theme !== 'light' && theme !== 'sunset';

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${themeClass} ${isDark ? 'dark' : ''}`}>
      {/* Background Decor for Glassmorphism */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="flex h-full max-w-[1600px] mx-auto relative shadow-2xl md:my-4 md:rounded-3xl md:overflow-hidden md:border border-white/10">
        
        <Sidebar 
          currentUser={currentUser} 
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChat?.id}
          onCreateGroup={handleCreateGroup}
          usersCache={usersCache}
          isMobileOpen={isMobileSidebarOpen}
          closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />

        <main className={`flex-1 relative h-full transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-10 scale-95 opacity-50 md:translate-x-0 md:scale-100 md:opacity-100' : ''}`}>
          <ChatArea 
            chat={selectedChat} 
            currentUser={currentUser} 
            onBack={() => setIsMobileSidebarOpen(true)}
          />
        </main>

        {/* Floating Theme Selector */}
        <div className="absolute bottom-6 left-6 z-50 group">
          <button className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
            <i className="fas fa-palette"></i>
          </button>
          <div className="absolute bottom-14 left-0 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity flex flex-col gap-2 min-w-[120px]">
            {(['light', 'dark', 'liquid', 'sunset', 'forest'] as Theme[]).map(t => (
              <button 
                key={t}
                onClick={() => handleChangeTheme(t)}
                className="text-left px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 capitalize text-sm text-gray-700 dark:text-gray-200"
              >
                {t}
              </button>
            ))}
            <hr className="border-gray-200 dark:border-gray-700"/>
            <button 
              onClick={() => signOut(auth)}
              className="text-left px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-500 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;