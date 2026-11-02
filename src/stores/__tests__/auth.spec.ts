import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/config/supabase'
import { i18n, setLocale } from '@/i18n'
import AuthMenu from '@/components/AuthMenu.vue'
import App from '@/App.vue'
import { canUseLocalEmailAuth, useAuthStore } from '../auth'

vi.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

const sessionFixture = {
  access_token: 'access-token',
  expires_at: 2_000_000_000,
  expires_in: 3600,
  refresh_token: 'refresh-token',
  token_type: 'bearer',
  user: {
    app_metadata: { provider: 'google', providers: ['google'] },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    email: 'ada@example.com',
    id: 'user-id',
    user_metadata: {
      full_name: 'Ada Lovelace',
      avatar_url: 'https://example.com/avatar.png',
    },
  },
} satisfies Session

const unsubscribe = vi.fn()

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setLocale('en')
    vi.clearAllMocks()

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionFixture },
      error: null,
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: 'test-subscription',
          callback: () => {},
          unsubscribe,
        },
      },
    })
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/' },
      error: null,
    })
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: sessionFixture.user, session: sessionFixture },
      error: null,
    })
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: sessionFixture.user, session: sessionFixture },
      error: null,
    })
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
  })

  it('enables local email auth only for localhost during development', () => {
    expect(canUseLocalEmailAuth(true, 'http://127.0.0.1:54321')).toBe(true)
    expect(canUseLocalEmailAuth(true, 'http://localhost:54321')).toBe(true)
    expect(canUseLocalEmailAuth(false, 'http://127.0.0.1:54321')).toBe(false)
    expect(canUseLocalEmailAuth(true, 'https://example.supabase.co')).toBe(false)
  })

  it('restores the current session and subscribes to auth changes', async () => {
    const authStore = useAuthStore()

    await authStore.initialize()

    expect(authStore.user?.email).toBe('ada@example.com')
    expect(authStore.isLoading).toBe(false)
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledOnce()
  })

  it('starts Google OAuth with the app base URL as the callback', async () => {
    const authStore = useAuthStore()

    await authStore.signInWithGoogle()

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
      },
    })
  })

  it('clears the current session after logout', async () => {
    const authStore = useAuthStore()
    authStore.session = sessionFixture

    await authStore.signOut()

    expect(authStore.session).toBeNull()
    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
  })

  it('shows initials when the signed-in user has no avatar', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const authStore = useAuthStore()
    authStore.session = {
      ...sessionFixture,
      user: {
        ...sessionFixture.user,
        user_metadata: { full_name: 'Ada Lovelace' },
      },
    }

    const wrapper = mount(AuthMenu, {
      global: {
        plugins: [pinia, i18n],
      },
    })

    expect(wrapper.get('.profile-avatar').text()).toBe('AL')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('wa-dropdown-item').text()).toContain('Logout')
  })

  it('falls back to initials when the profile image cannot load', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const authStore = useAuthStore()
    authStore.session = sessionFixture

    const wrapper = mount(AuthMenu, {
      global: {
        plugins: [pinia, i18n],
      },
    })

    await wrapper.get('img').trigger('error')

    expect(wrapper.get('.profile-avatar').text()).toBe('AL')
  })

  it('moves from the signed-out header state to the profile without duplicating auth controls', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const authStore = useAuthStore()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia, i18n],
        stubs: ['RouterLink', 'RouterView', 'SupaBaseStatus', 'LanguageSwitcher', 'ThemeToggle', 'AppTitle'],
      },
    })

    expect(wrapper.get('.app-header').classes()).toContain('app-header--signed-out')
    expect(wrapper.find('.auth-menu__google').exists()).toBe(false)
    expect(wrapper.find('.app-header__actions .auth-menu').exists()).toBe(false)

    authStore.isLoading = false
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.app-header__auth').classes()).toContain('auth-menu--signed-out')
    expect(wrapper.get('.app-header__auth wa-button').text()).toContain('Sign in')

    authStore.session = sessionFixture
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.app-header').classes()).not.toContain('app-header--signed-out')
    expect(wrapper.find('.auth-menu__google').exists()).toBe(false)
    expect(wrapper.find('.app-header__auth .profile-avatar').exists()).toBe(true)
    expect(wrapper.findAll('.app-header__auth')).toHaveLength(1)
  })
})
