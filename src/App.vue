<script setup>
import { ref, onMounted } from 'vue'
import Dashboard from './components/Dashboard.vue'
import SettingsPanel from './components/SettingsPanel.vue'

const showSettings = ref(false)
const settings = ref({ gamesFolder: '', xeniaDataFolder: '', xeniaPath: '' })

async function loadSettings() {
  settings.value = await window.freedash.getSettings()
}

function handleSettingsSaved(updated) {
  settings.value = updated
  showSettings.value = false
}

onMounted(loadSettings)
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <span class="brand">FREE<span class="brand-accent">DASH</span></span>
      <div class="tabs">
        <span class="tab active">Todos os jogos</span>
        <span class="tab" title="Em breve">Favoritos</span>
        <button class="gear" @click="showSettings = true" aria-label="Configurações">⚙</button>
      </div>
    </header>

    <main class="content">
      <Dashboard v-if="!showSettings" :games-folder="settings.gamesFolder" />
      <SettingsPanel
        v-else
        :settings="settings"
        @saved="handleSettingsSaved"
        @close="showSettings = false"
      />
    </main>
  </div>
</template>

<style scoped>
.shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 22px;
  -webkit-app-region: drag;
}

.brand {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.14em;
  color: var(--text-primary);
}
.brand-accent {
  color: var(--accent);
}

.tabs {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  gap: 16px;
}

.tab {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  cursor: default;
}
.tab.active {
  color: var(--text-primary);
}

.gear {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 15px;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.gear:hover {
  color: var(--accent);
}

.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
