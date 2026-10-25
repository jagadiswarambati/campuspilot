"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { StudentProfile, CampusRole } from "@/types";

interface ProfileContextType {
  profile: StudentProfile | null;
  loading: boolean;
  role: CampusRole;
  onboardingCompleted: boolean;
  refreshProfile: () => Promise<void>;
  updateRole: (newRole: CampusRole, completeOnboarding?: boolean) => Promise<boolean>;
  resetOnboarding: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateRole = async (
    newRole: CampusRole,
    completeOnboarding: boolean = true
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          onboardingCompleted: completeOnboarding,
        }),
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update role", err);
      return false;
    }
  };

  const resetOnboarding = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingCompleted: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to reset onboarding", err);
    }
  };

  const role: CampusRole = profile?.role || "Student";
  const onboardingCompleted = profile?.onboardingCompleted ?? false;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        role,
        onboardingCompleted,
        refreshProfile: fetchProfile,
        updateRole,
        resetOnboarding,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
