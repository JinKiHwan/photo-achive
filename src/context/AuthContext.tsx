"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { membershipEnabled } from "@/lib/community-config";
import { acceptMembership } from "@/lib/membership";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | { email: string } | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  loginWithGoogle: async () => {},
});

const LOCAL_ADMIN_KEY = "photo_archive_admin_logged_in";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | { email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      if (isFirebaseConfigured) {
        queueMicrotask(() => { setUser(null); setLoading(false); });
        return;
      }
      // Local fallback auth check
      const localLoggedIn = localStorage.getItem(LOCAL_ADMIN_KEY) === "true";
      queueMicrotask(() => {
        setUser(localLoggedIn ? { email: "admin@archive.photo" } : null);
        setLoading(false);
      });
    }
  }, []);

  const login = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      if (credential.user.uid !== process.env.NEXT_PUBLIC_ADMIN_UID) {
        await firebaseSignOut(auth);
        throw new Error("관리자 계정만 로그인할 수 있습니다.");
      }
    } else {
      if (isFirebaseConfigured) throw new Error("Firebase 연결 설정을 확인해 주세요.");
      // Local demo login check
      if (email && pass) {
        localStorage.setItem(LOCAL_ADMIN_KEY, "true");
        setUser({ email });
      } else {
        throw new Error("이메일과 비밀번호를 입력해 주세요.");
      }
    }
  };

  const loginWithGoogle = async () => {
    if (!membershipEnabled || !auth || !db) throw new Error("회원 서비스 오픈을 준비하고 있습니다.");
    const settings = await getDoc(doc(db, "config", "community"));
    if (!settings.exists() || settings.data().enabled !== true) throw new Error("현재 신규 회원 서비스를 준비 중입니다.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    await acceptMembership(result.user);
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem(LOCAL_ADMIN_KEY);
      setUser(null);
    }
  };

  const isAdmin = isFirebaseConfigured
    ? Boolean(user && "uid" in user && user.uid === process.env.NEXT_PUBLIC_ADMIN_UID)
    : Boolean(user);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
