import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session, Subscription } from '@supabase/supabase-js'
import { supabase } from '@/config/supabase'

export function canUseLocalEmailAuth(isDevelopment: boolean, supabaseUrl: string): boolean {
  return isDevelopment && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(supabaseUrl)
}

export const isLocalDevelopmentAuthEnabled = canUseLocalEmailAuth(
  import.meta.env.DEV,
  import.meta.env.VITE_SUPABASE_URL ?? '',
)

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const user = computed(() => session.value?.user ?? null)
  const isLoading = ref(true)
  const isSigningIn = ref(false)
  const isSigningOut = ref(false)
  const error = ref<string | null>(null)

  let initialized = false
  let authSubscription: Subscription | null = null

  function setError(cause: unknown): void {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }

  async function initialize(): Promise<void> {
    if (initialized) {
      return
    }

    initialized = true
    let receivedAuthEvent = false
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true
      session.value = nextSession
      error.value = null
      isLoading.value = false
    })
    authSubscription = data.subscription

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        error.value = sessionError.message
      } else if (!receivedAuthEvent) {
        session.value = sessionData.session
      }
    } catch (cause) {
      setError(cause)
    } finally {
      isLoading.value = false
    }
  }

  async function signInWithGoogle(): Promise<void> {
    error.value = null
    isSigningIn.value = true

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
        },
      })

      if (signInError) {
        error.value = signInError.message
      }
    } catch (cause) {
      setError(cause)
    } finally {
      isSigningIn.value = false
    }
  }

  async function signInWithPassword(email: string, password: string): Promise<void> {
    if (!isLocalDevelopmentAuthEnabled) {
      error.value = 'Email and password sign-in is only available with local Supabase in development.'
      return
    }

    error.value = null
    isSigningIn.value = true
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        error.value = signInError.message
      } else {
        session.value = data.session
      }
    } catch (cause) {
      setError(cause)
    } finally {
      isSigningIn.value = false
    }
  }

  async function signUpWithPassword(email: string, password: string): Promise<boolean> {
    if (!isLocalDevelopmentAuthEnabled) {
      error.value = 'Email and password sign-up is only available with local Supabase in development.'
      return false
    }

    error.value = null
    isSigningIn.value = true
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        error.value = signUpError.message
        return false
      }

      session.value = data.session
      return data.session !== null
    } catch (cause) {
      setError(cause)
      return false
    } finally {
      isSigningIn.value = false
    }
  }

  async function signOut(): Promise<void> {
    error.value = null
    isSigningOut.value = true

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        error.value = signOutError.message
      } else {
        session.value = null
      }
    } catch (cause) {
      setError(cause)
    } finally {
      isSigningOut.value = false
    }
  }

  onScopeDispose(() => {
    authSubscription?.unsubscribe()
  })

  return {
    error,
    initialize,
    isLoading,
    isSigningIn,
    isSigningOut,
    session,
    signInWithPassword,
    signInWithGoogle,
    signUpWithPassword,
    signOut,
    user,
  }
})
