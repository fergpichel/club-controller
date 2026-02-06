<template>
  <q-page class="members-page">
    <div class="page-header">
      <div class="row items-center justify-between">
        <div class="row items-center">
          <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
          <div class="q-ml-sm"><h1>Miembros del Club</h1></div>
        </div>
        <q-btn
          v-if="authStore.canInviteUsers"
          color="primary"
          text-color="white"
          icon="person_add"
          label="Invitar"
          @click="showInviteDialog = true"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Pending Invitations -->
      <div v-if="authStore.invitations.length > 0" class="q-mb-lg">
        <h2 class="section-title q-mb-sm">Invitaciones pendientes</h2>
        <q-list separator bordered class="rounded-borders">
          <q-item v-for="inv in authStore.invitations" :key="inv.id">
            <q-item-section avatar>
              <q-avatar color="amber-2" text-color="amber-10" icon="mail" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ inv.email }}</q-item-label>
              <q-item-label caption>
                Rol: {{ roleLabel(inv.role) }} · Invitado por {{ inv.invitedByName }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                icon="close"
                color="negative"
                size="sm"
                @click="cancelInvitation(inv.id)"
              >
                <q-tooltip>Cancelar invitación</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Current Members -->
      <h2 class="section-title q-mb-sm">Miembros activos</h2>
      <q-list separator bordered class="rounded-borders">
        <q-item v-for="member in authStore.clubMembers" :key="member.uid">
          <q-item-section avatar>
            <q-avatar :color="member.uid === authStore.user?.uid ? 'primary' : 'grey-4'" text-color="white">
              {{ (member.displayName || 'U').charAt(0).toUpperCase() }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ member.displayName }}
              <q-badge v-if="member.uid === authStore.user?.uid" color="primary" class="q-ml-sm" label="Tú" />
            </q-item-label>
            <q-item-label caption>{{ member.email }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-select
              v-if="authStore.isAdmin && member.uid !== authStore.user?.uid"
              :model-value="member.role"
              :options="roleOptions"
              dense
              outlined
              emit-value
              map-options
              options-dense
              style="min-width: 140px"
              @update:model-value="(val: string) => changeRole(member.uid, val as UserRole)"
            />
            <q-badge v-else :color="roleBadgeColor(member.role)" :label="roleLabel(member.role)" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Invite Dialog -->
    <q-dialog v-model="showInviteDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Invitar miembro</div>
          <p class="text-caption text-grey q-mb-none">
            Se creará una invitación para que el usuario pueda registrarse en el club
          </p>
        </q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="sendInvitation">
            <q-input
              v-model="inviteForm.email"
              type="email"
              label="Email del invitado"
              outlined
              :rules="[val => !!val || 'Email requerido', val => isValidEmail(val) || 'Email inválido']"
            >
              <template #prepend><q-icon name="email" /></template>
            </q-input>
            <q-select
              v-model="inviteForm.role"
              :options="roleOptions"
              label="Rol"
              outlined
              emit-value
              map-options
            >
              <template #prepend><q-icon name="badge" /></template>
            </q-select>
            <div class="role-description">
              <q-icon name="info" size="16px" class="q-mr-xs" />
              {{ roleDescription(inviteForm.role) }}
            </div>
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn
            label="Enviar invitación"
            color="primary"
            icon="send"
            :loading="inviting"
            @click="sendInvitation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import type { UserRole } from 'src/types'
import { ROLE_LABELS } from 'src/types'

const $q = useQuasar()
const authStore = useAuthStore()

const showInviteDialog = ref(false)
const inviting = ref(false)
const inviteForm = ref({
  email: '',
  role: 'employee' as UserRole
})

const roleOptions = [
  { label: 'Directivo', value: 'manager' },
  { label: 'Interventor', value: 'controller' },
  { label: 'Coordinador', value: 'editor' },
  { label: 'Colaborador', value: 'employee' },
  { label: 'Observador', value: 'viewer' }
]

function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role
}

function roleBadgeColor(role: UserRole): string {
  const colors: Record<string, string> = {
    admin: 'red-5',
    manager: 'blue-7',
    controller: 'teal-7',
    editor: 'purple-5',
    employee: 'grey-7',
    viewer: 'grey-5'
  }
  return colors[role] || 'grey-5'
}

function roleDescription(role: UserRole): string {
  const descriptions: Record<string, string> = {
    manager: 'Acceso total excepto cierres. Gestiona settings y categorías.',
    controller: 'Acceso total excepto settings. Puede hacer cierres mensuales.',
    editor: 'Puede crear y ver transacciones. Datos sensibles anonimizados.',
    employee: 'Solo puede crear transacciones y ver las suyas propias.',
    viewer: 'Solo lectura. Datos sensibles anonimizados.'
  }
  return descriptions[role] || ''
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function sendInvitation() {
  if (!inviteForm.value.email || !isValidEmail(inviteForm.value.email)) return

  inviting.value = true
  try {
    await authStore.createInvitation(inviteForm.value.email, inviteForm.value.role)
    $q.notify({
      type: 'positive',
      message: `Invitación enviada a ${inviteForm.value.email}`,
      caption: `Rol: ${roleLabel(inviteForm.value.role)}`
    })
    showInviteDialog.value = false
    inviteForm.value = { email: '', role: 'employee' }
  } catch (e: unknown) {
    const err = e as Error
    $q.notify({ type: 'negative', message: err.message || 'Error al crear la invitación' })
  } finally {
    inviting.value = false
  }
}

async function cancelInvitation(id: string) {
  $q.dialog({
    title: 'Cancelar invitación',
    message: '¿Cancelar esta invitación?',
    cancel: true
  }).onOk(async () => {
    await authStore.cancelInvitation(id)
    $q.notify({ type: 'positive', message: 'Invitación cancelada' })
  })
}

async function changeRole(uid: string, newRole: UserRole) {
  const success = await authStore.updateMemberRole(uid, newRole)
  if (success) {
    $q.notify({ type: 'positive', message: 'Rol actualizado' })
  } else {
    $q.notify({ type: 'negative', message: 'Error al actualizar el rol' })
  }
}

onMounted(async () => {
  await Promise.all([
    authStore.fetchClubMembers(),
    authStore.fetchInvitations()
  ])
})
</script>

<style lang="scss" scoped>
.members-page {
  background: var(--color-background);
}

.page-content {
  max-width: 700px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.role-description {
  display: flex;
  align-items: flex-start;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
}
</style>
