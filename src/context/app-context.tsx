
"use client";

import type { PersonalizedContentOutput } from '@/ai/flows/personalized-content';
import type { MentalHealthAssessmentOutput } from '@/ai/flows/mental-health-assessment';
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, type User as FirebaseUser, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc, collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { DailyPlannerOutput } from '@/ai/flows/daily-planner-flow';
import { avatarUrl as getAvatarFor } from '@/lib/images';
import type { PlanId, Plan } from '@/lib/plans';
import { PLANS } from '@/lib/plans';
import {
  resolvePlan,
  usageWeekKey,
  type BillingState,
  type OrgBillingState,
  type SubscriptionStatus,
} from '@/lib/entitlements';

export interface Mood {
  mood: 'Happy' | 'Calm' | 'Okay' | 'Anxious' | 'Sad';
  date: string;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  leaderUid: string;
  createdAt: any;
  plan?: PlanId | null;
  subscriptionStatus?: SubscriptionStatus;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  seatsPurchased?: number;
  seatsUsed?: number;
  currentPeriodEnd?: string | null;
}

export interface User {
  uid: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  isAnonymous: boolean;
  isLeader: boolean;
  organizationId?: string;
  organizationName?: string;
  plan?: PlanId | null;
  subscriptionStatus?: SubscriptionStatus;
  stripeCustomerId?: string | null;
  currentPeriodEnd?: string | null;
}

export type AchievementKey = 'firstGoal' | 'assessmentComplete' | 'firstJournal' | 'contentGenerated' | 'fiveGoalsDone' | 'moodWeek' | 'firstResource' | 'tenGoalsDone' | 'worryJarUse' | 'moodMonth';

export interface Achievement {
  id: AchievementKey;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface Interaction {
    id: string;
    type: 'Journal' | 'Worry Jar' | 'Assessment' | 'Planner';
    title: string;
    content: string;
    timestamp: string;
    data: any;
}

interface UserData {
    moods: Mood[];
    goals: Goal[];
    assessmentResult: MentalHealthAssessmentOutput | null;
    assessmentTimestamp: string | null;
    personalizedContent: PersonalizedContentOutput | null;
    achievements: Achievement[];
    interactions: Interaction[];
    dailyPlan?: DailyPlannerOutput | null;
    dailyPlanTimestamp?: string | null;
    name?: string;
    email?: string;
    avatar?: string;
    isLeader?: boolean;
    organizationId?: string;
    organizationName?: string;
    plan?: PlanId | null;
    subscriptionStatus?: SubscriptionStatus;
    stripeCustomerId?: string | null;
    subscriptionId?: string | null;
    currentPeriodEnd?: string | null;
}


interface AppContextType {
  moods: Mood[];
  setMoods: (moods: Mood[]) => void;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  assessmentResult: MentalHealthAssessmentOutput | null;
  assessmentTimestamp: string | null;
  setAssessmentResult: (result: MentalHealthAssessmentOutput | null) => void;
  personalizedContent: PersonalizedContentOutput | null;
  setPersonalizedContent: (content: PersonalizedContentOutput | null) => void;
  user: User | null;
  organization: Organization | null;
  signup: (name: string, email: string, password: string, isLeader?: boolean, organizationCode?: string, organizationName?: string, sector?: string) => Promise<FirebaseUser>;
  login: (email: string, password: string, isLeader?: boolean) => Promise<FirebaseUser>;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  loading: boolean;
  achievements: Achievement[];
  addAchievement: (key: AchievementKey) => void;
  interactions: Interaction[];
  addInteraction: (interaction: Interaction) => void;
  unlockedAchievement: Achievement | null;
  clearUnlockedAchievement: () => void;
  dailyPlan: DailyPlannerOutput | null;
  setDailyPlan: (plan: DailyPlannerOutput | null) => void;
  /** The plan the user effectively has right now (org coverage wins). */
  plan: Plan;
  /** Metered AI actions used in the current ISO week. */
  weeklyUsage: number;
  /** Opens the upgrade dialog; `reason` explains what was blocked. */
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;
  upgradeReason: string | null;
  upgradeOpen: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);



const initialAchievements: Achievement[] = [
    { id: 'firstGoal', name: 'Goal Setter', description: 'You set your first wellness goal!', unlocked: false },
    { id: 'assessmentComplete', name: 'Self-Explorer', description: 'You completed your first assessment.', unlocked: false },
    { id: 'firstJournal', name: 'Reflective Mind', description: 'You wrote your first journal entry.', unlocked: false },
    { id: 'worryJarUse', name: 'Worry Whittler', description: 'You used the Worry Jar for the first time.', unlocked: false },
    { id: 'contentGenerated', name: 'Pathfinder', description: 'You generated your first personalized content plan.', unlocked: false },
    { id: 'fiveGoalsDone', name: 'Goal Getter', description: 'Completed 5 personal goals. Amazing!', unlocked: false },
    { id: 'tenGoalsDone', name: 'Goal Master', description: 'Completed 10 personal goals. Incredible!', unlocked: false },
    { id: 'moodWeek', name: 'Mood Mapper', description: 'Logged your mood for 7 days in a row.', unlocked: false },
    { id: 'moodMonth', name: 'Mood Marathoner', description: 'Logged your mood for 30 days. That is commitment!', unlocked: false },
    { id: 'firstResource', name: 'Support Seeker', description: 'Viewed the local resources directory.', unlocked: false },
];

const initialData: UserData = {
    plan: 'free',
    subscriptionStatus: null,
    moods: [],
    goals: [],
    assessmentResult: null,
    assessmentTimestamp: null,
    personalizedContent: null,
    achievements: initialAchievements,
    interactions: [],
    dailyPlan: null,
    dailyPlanTimestamp: null,
};




export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [userData, setUserData] = useState<UserData>(initialData);
  
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  const openUpgrade = useCallback((reason?: string) => {
    setUpgradeReason(reason ?? null);
    setUpgradeOpen(true);
  }, []);
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  useEffect(() => {
    // Firestore listeners have to be torn down by hand.
    //
    // The previous version returned a cleanup function from inside the
    // onAuthStateChanged callback, but that callback's return value is ignored
    // (it is not a useEffect). So the user and organization listeners were
    // never unsubscribed: they accumulated on every auth change and kept
    // running after sign-out against a signed-out client, which surfaced as
    // "FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state".
    let unsubUser: (() => void) | null = null;
    let unsubOrg: (() => void) | null = null;
    let currentUid: string | null = null;
    const stopSnapshots = () => {
      unsubUser?.();
      unsubUser = null;
      unsubOrg?.();
      unsubOrg = null;
    };

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      stopSnapshots();

      if (firebaseUser) {
        // A previous sign-out leaves `loading` false. Without restoring it a
        // fresh sign-in would expose the baseline user (isLeader: false) as
        // settled, and the organization dashboard would bounce a real leader
        // back to its login page before Firestore had answered.
        if (currentUid !== firebaseUser.uid) {
          currentUid = firebaseUser.uid;
          setLoading(true);
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Identity is settled the moment auth resolves; Firestore only enriches
        // it. Previously `user` was assigned solely inside `docSnap.exists()`
        // while `loading` was cleared unconditionally, so a snapshot arriving
        // before the document existed left the app signed in with a null user
        // and the app layout redirected straight back to /login.
        //
        // `loading` deliberately stays true until the snapshot settles, so
        // consumers that branch on `isLeader` do not act on the baseline.
        setUser((prev) =>
          prev && prev.uid === firebaseUser.uid
            ? prev
            : {
                uid: firebaseUser.uid,
                name:
                  firebaseUser.displayName ||
                  (firebaseUser.isAnonymous ? 'Guest' : 'User'),
                email: firebaseUser.email,
                avatar: firebaseUser.photoURL ?? null,
                isAnonymous: firebaseUser.isAnonymous,
                isLeader: false,
                plan: 'free',
                subscriptionStatus: null,
              }
        );

        unsubUser = onSnapshot(userDocRef, (docSnap) => {
             if (docSnap.exists()) {
                const data = docSnap.data() as UserData;
                
                if (data.dailyPlanTimestamp) {
                    const planDate = new Date(data.dailyPlanTimestamp);
                    const now = new Date();
                    const diffHours = (now.getTime() - planDate.getTime()) / (1000 * 60 * 60);
                    if (diffHours > 24) {
                        data.dailyPlan = null;
                        data.dailyPlanTimestamp = null;
                    }
                }
                setUserData(data);

                 const currentUser: User = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || (firebaseUser.isAnonymous ? "Guest" : data.name || "User"),
                    email: firebaseUser.email,
                    avatar: firebaseUser.photoURL || data.avatar || null,
                    isAnonymous: firebaseUser.isAnonymous,
                    isLeader: data.isLeader || false,
                    organizationId: data.organizationId,
                    organizationName: data.organizationName,
                    plan: data.plan ?? 'free',
                    subscriptionStatus: data.subscriptionStatus ?? null,
                    stripeCustomerId: data.stripeCustomerId ?? null,
                    currentPeriodEnd: data.currentPeriodEnd ?? null,
                };
                setUser(currentUser);

                if (currentUser.isLeader && currentUser.organizationId) {
                   // This callback fires on every user-document change, so the
                   // previous organization listener must go before a new one
                   // is attached or they stack up indefinitely.
                   unsubOrg?.();
                   const orgDocRef = doc(db, 'organizations', currentUser.organizationId);
                   unsubOrg = onSnapshot(orgDocRef, (orgSnap) => {
                       if (orgSnap.exists()) {
                           setOrganization({ id: orgSnap.id, ...orgSnap.data() } as Organization);
                       }
                   });
                } else {
                    unsubOrg?.();
                    unsubOrg = null;
                    setOrganization(null);
                }
            }
             setLoading(false);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            setLoading(false);
        });

      } else {
        currentUid = null;
        setUser(null);
        setOrganization(null);
        setUserData(initialData);
        setLoading(false);
      }
    });

    return () => {
      stopSnapshots();
      unsubscribe();
    };
  }, []);
  
  const updateUserData = useCallback((data: Partial<UserData>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    setDoc(userDocRef, data, { merge: true }).catch((err) => {
        console.error('[ventaya] failed to persist user data:', err);
    });
  }, [user]);

  const setGoals = (goals: Goal[]) => updateUserData({ goals });
  const setMoods = (moods: Mood[]) => {
      const today = new Date().toISOString().split('T')[0];
      const otherMoods = userData.moods.filter(m => m.date !== today);
      updateUserData({ moods: [...otherMoods, ...moods] });
  };

  const setAssessmentResult = (assessmentResult: MentalHealthAssessmentOutput | null) => {
    if (assessmentResult) {
         updateUserData({ 
            assessmentResult, 
            assessmentTimestamp: new Date().toISOString(),
            personalizedContent: null
        });
    } else {
        updateUserData({ assessmentResult: null, assessmentTimestamp: null });
    }
  };

  const setPersonalizedContent = (personalizedContent: PersonalizedContentOutput | null) => updateUserData({ personalizedContent });

  const setDailyPlan = (dailyPlan: DailyPlannerOutput | null) => {
    if (dailyPlan) {
        updateUserData({ dailyPlan, dailyPlanTimestamp: new Date().toISOString() });
    } else {
        updateUserData({ dailyPlan: null, dailyPlanTimestamp: null });
    }
  };

  const addAchievement = useCallback((key: AchievementKey) => {
    if (!user) return;

    const achievement = userData.achievements.find(a => a.id === key);
    if (achievement && !achievement.unlocked) {
        setUnlockedAchievement({ ...achievement, unlocked: true });
        const updatedAchievements = userData.achievements.map(a => 
            a.id === key ? { ...a, unlocked: true } : a
        );
        updateUserData({ achievements: updatedAchievements });
    }
  }, [user, userData.achievements, updateUserData]);

  const addInteraction = useCallback((interaction: Interaction) => {
    if (!user) return;
    const updatedInteractions = [interaction, ...userData.interactions];
    updateUserData({ interactions: updatedInteractions });
  }, [user, userData.interactions, updateUserData]);


  const signup = async (name: string, email: string, password: string, isLeader = false, organizationCode?: string, organizationName?: string, sector?: string): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user: firebaseUser } = userCredential;

    const avatarUrl = getAvatarFor(firebaseUser.uid);
    await updateProfile(firebaseUser, { displayName: name, photoURL: avatarUrl });
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDataToSet: UserData = {
        ...initialData,
        name: name,
        email: email,
        avatar: avatarUrl,
        isLeader,
    };

    if (isLeader && organizationName && sector) {
        const orgsRef = collection(db, 'organizations');
        const newOrgRef = await addDoc(orgsRef, {
            name: organizationName,
            sector,
            leaderUid: firebaseUser.uid,
            createdAt: serverTimestamp(),
        });
        userDataToSet.organizationId = newOrgRef.id;
        userDataToSet.organizationName = organizationName;
        await setDoc(doc(db, 'users', firebaseUser.uid), { organizationId: newOrgRef.id }, { merge: true });
    } else if (organizationCode) {
        const orgQuery = query(collection(db, 'organizations'), where('__name__', '==', organizationCode), limit(1));
        const orgSnapshot = await getDocs(orgQuery);
        if (orgSnapshot.empty) {
            await firebaseUser.delete();
            throw new Error('ORGANIZATION_CODE_INVALID');
        }
        const orgDoc = orgSnapshot.docs[0];
        userDataToSet.organizationId = orgDoc.id;
        userDataToSet.organizationName = orgDoc.data().name;
    }

    await setDoc(userDocRef, userDataToSet);
    return firebaseUser;
  };

  const login = async (email: string, password: string, isLeader = false): Promise<FirebaseUser> => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      let userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
          // User exists in Auth but not Firestore. Create their document.
          console.log(`User document not found for ${userCredential.user.uid}, creating one...`);
          const userDataToSet: UserData = {
              ...initialData,
              name: userCredential.user.displayName ?? undefined,
              email: userCredential.user.email ?? undefined,
              avatar: userCredential.user.photoURL ?? undefined,
              isLeader: false, // Default to false, leader check happens next
          };
          await setDoc(userDocRef, userDataToSet);
          userDoc = await getDoc(userDocRef); // Re-fetch the document
      }

      const userData = userDoc.data();
      if (isLeader && !userData?.isLeader) {
          await signOut(auth);
          throw new Error("NOT_A_LEADER");
      }

      return userCredential.user;
  };

  const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, 'users', result.user.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        ...initialData,
        name: result.user.displayName ?? undefined,
        email: result.user.email ?? undefined,
        avatar: result.user.photoURL ?? getAvatarFor(result.user.uid),
        isLeader: false,
      });
    }
  };
  
  const loginAnonymously = async(): Promise<FirebaseUser> => {
      const userCredential = await signInAnonymously(auth);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        ...initialData,
        name: 'Guest',
        avatar: getAvatarFor(userCredential.user.uid),
      });
      return userCredential.user;
  }

  const logout = async () => {
    await signOut(auth);
  };

  const clearUnlockedAchievement = () => {
    setUnlockedAchievement(null);
  };

  // The plan actually in force: an active org seat outranks a personal sub.
  const plan: Plan = useMemo(
    () => resolvePlan(
      user ? { plan: user.plan, subscriptionStatus: user.subscriptionStatus } : null,
      organization
        ? { plan: organization.plan, subscriptionStatus: organization.subscriptionStatus }
        : null
    ),
    [user, organization]
  );

  // Live weekly usage, so the meter updates the moment a session is spent.
  useEffect(() => {
    if (!user) {
      setWeeklyUsage(0);
      return;
    }
    const ref = doc(db, 'usage', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => setWeeklyUsage(snap.exists() ? (snap.data()?.[usageWeekKey()] ?? 0) : 0),
      () => setWeeklyUsage(0)
    );
    return () => unsub();
  }, [user]);

  const value: AppContextType = useMemo(() => ({
    user,
    organization,
    loading,
    goals: userData.goals,
    moods: userData.moods,
    assessmentResult: userData.assessmentResult,
    assessmentTimestamp: userData.assessmentTimestamp,
    personalizedContent: userData.personalizedContent,
    achievements: userData.achievements,
    interactions: userData.interactions,
    dailyPlan: userData.dailyPlan || null,
    setGoals,
    setMoods,
    setAssessmentResult,
    setPersonalizedContent,
    setDailyPlan,
    signup,
    login,
    loginWithGoogle,
    loginAnonymously,
    logout,
    addAchievement,
    addInteraction,
    unlockedAchievement,
    clearUnlockedAchievement,
    plan,
    weeklyUsage,
    openUpgrade,
    closeUpgrade,
    upgradeReason,
    upgradeOpen,
  }), [
    user, organization, loading, userData, addAchievement, addInteraction,
    unlockedAchievement, updateUserData, plan, weeklyUsage, openUpgrade,
    closeUpgrade, upgradeReason, upgradeOpen,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};


    