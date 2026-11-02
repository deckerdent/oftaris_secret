<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { isLocalDevelopmentAuthEnabled, useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { error, isLoading, isSigningIn, isSigningOut, user } = storeToRefs(authStore)
const { t } = useI18n()
const avatarFailed = ref(false)
const localAuthFormOpen = ref(false)
const isCreatingLocalAccount = ref(false)
const localEmail = ref('')
const localPassword = ref('')
const localAuthMessage = ref('')

function getUserMetadataString(...keys: string[]): string | null {
  for (const key of keys) {
    const value = user.value?.user_metadata[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

const avatarUrl = computed(() => {
  const value = getUserMetadataString('avatar_url', 'picture')
  return value?.startsWith('https://') ? value : null
})

const displayName = computed(
  () => getUserMetadataString('full_name', 'name') ?? user.value?.email ?? '',
)
const profileLabel = computed(() => displayName.value || t('auth.profile'))
const initials = computed(() => {
  const words = displayName.value.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.charAt(0) ?? '?'
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? '') : ''
  return `${first}${last}`.toUpperCase()
})

watch(avatarUrl, () => {
  avatarFailed.value = false
})

function signIn(): Promise<void> {
  return authStore.signInWithGoogle()
}

function signOut(): Promise<void> {
  return authStore.signOut()
}

function toggleLocalAuthMode(): void {
  isCreatingLocalAccount.value = !isCreatingLocalAccount.value
  localAuthMessage.value = ''
  authStore.error = null
}

async function submitLocalAuth(): Promise<void> {
  localAuthMessage.value = ''
  if (isCreatingLocalAccount.value) {
    const signedIn = await authStore.signUpWithPassword(localEmail.value, localPassword.value)
    if (!authStore.error && !signedIn) {
      localAuthMessage.value = t('auth.localConfirmation')
    }
    if (signedIn) {
      localPassword.value = ''
    }
    return
  }

  await authStore.signInWithPassword(localEmail.value, localPassword.value)
  if (!authStore.error) {
    localPassword.value = ''
  }
}
</script>

<template>
  <div class="auth-menu">
    <wa-dropdown v-if="user" placement="bottom-end">
      <wa-button
        slot="trigger"
        appearance="plain"
        size="s"
        :aria-label="profileLabel"
        :disabled="isSigningOut"
      >
        <span class="profile-avatar">
          <img
            v-if="avatarUrl && !avatarFailed"
            :src="avatarUrl"
            :alt="t('auth.profilePhotoAlt')"
            @error="avatarFailed = true"
          />
          <span v-else aria-hidden="true">{{ initials }}</span>
        </span>
      </wa-button>
      <wa-dropdown-item value="logout" @click="signOut">
        {{ t('auth.logout') }}
      </wa-dropdown-item>
    </wa-dropdown>
    <wa-button
      v-else-if="!isLocalDevelopmentAuthEnabled"
      variant="brand"
      appearance="accent"
      :disabled="isLoading || isSigningIn"
      @click="signIn"
    >
      {{ t(isSigningIn ? 'auth.signingIn' : 'auth.signInWithGoogle') }}
    </wa-button>
    <div v-else class="local-auth">
      <wa-button
        variant="brand"
        appearance="accent"
        :disabled="isLoading || isSigningIn"
        @click="localAuthFormOpen = !localAuthFormOpen"
      >
        {{ t('auth.localTestAccount') }}
      </wa-button>
      <form v-if="localAuthFormOpen" class="local-auth__form" @submit.prevent="submitLocalAuth">
        <label>
          {{ t('auth.email') }}
          <input v-model="localEmail" type="email" autocomplete="email" required />
        </label>
        <label>
          {{ t('auth.password') }}
          <input
            v-model="localPassword"
            :autocomplete="isCreatingLocalAccount ? 'new-password' : 'current-password'"
            type="password"
            minlength="6"
            required
          />
        </label>
        <button class="local-auth__submit" type="submit" :disabled="isSigningIn">
          {{
            isSigningIn
              ? t('auth.signingIn')
              : t(isCreatingLocalAccount ? 'auth.createLocalAccount' : 'auth.localSignIn')
          }}
        </button>
        <button class="local-auth__toggle" type="button" @click="toggleLocalAuthMode">
          {{
            t(
              isCreatingLocalAccount
                ? 'auth.useExistingLocalAccount'
                : 'auth.createLocalAccount',
            )
          }}
        </button>
        <p v-if="localAuthMessage" class="local-auth__message" role="status">
          {{ localAuthMessage }}
        </p>
      </form>
    </div>

    <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.auth-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.profile-avatar {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: var(--wa-color-brand-fill-normal);
  color: var(--wa-color-brand-on-normal);
  font-size: var(--wa-font-size-s);
  font-weight: var(--wa-font-weight-bold);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-error {
  margin: 0;
  color: var(--wa-color-danger-on-normal);
  font-size: var(--wa-font-size-s);
}

.local-auth {
  position: relative;
}

.local-auth__form {
  position: absolute;
  z-index: 1;
  inset-block-start: calc(100% + 0.5rem);
  inset-inline-end: 0;
  display: grid;
  width: min(18rem, calc(100vw - 2rem));
  gap: 0.65rem;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  background: var(--wa-color-surface-default);
  padding: 1rem;
  box-shadow: var(--wa-shadow-m);
}

.local-auth__form label {
  display: grid;
  gap: 0.25rem;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
}

.local-auth__form input {
  width: 100%;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-m);
  color: var(--wa-color-text-normal);
  background: var(--wa-color-surface-default);
  font: inherit;
  padding: 0.5rem;
}

.local-auth__form input:focus-visible {
  outline: var(--wa-focus-ring);
  outline-offset: var(--wa-focus-ring-offset);
}

.local-auth__submit,
.local-auth__toggle {
  border: 0;
  border-radius: var(--wa-border-radius-m);
  font: inherit;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.local-auth__submit {
  color: var(--wa-color-brand-on-loud);
  background: var(--wa-color-brand-fill-loud);
}

.local-auth__toggle {
  color: var(--wa-color-brand-on-normal);
  background: transparent;
}

.local-auth__submit:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.local-auth__message {
  margin: 0;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
}
</style>
