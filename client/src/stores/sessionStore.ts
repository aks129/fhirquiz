import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'student' | 'instructor' | 'admin'
  fhir_points: number
  created_at: string
}

interface SessionState {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  isInstructor: boolean
  isDemoMode: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setDemoMode: (isDemo: boolean) => void
  clear: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isInstructor: false,
  isDemoMode: false,
  
  setUser: (user) => {
    set({ user })
    if (!user) {
      get().clear()
    }
  },
  
  setProfile: (profile) => {
    set({ 
      profile,
      isAdmin: profile?.role === 'admin',
      isInstructor: profile?.role === 'instructor' || profile?.role === 'admin'
    })
  },

  setDemoMode: (isDemo) => {
    set({ isDemoMode: isDemo })
  },
  
  clear: () => set({ 
    user: null, 
    profile: null, 
    isAdmin: false, 
    isInstructor: false,
    isDemoMode: false
  })
}))