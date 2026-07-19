<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import GameCard from './GameCard.vue'

const props = defineProps({
  gamesFolder: { type: String, default: '' }
})

const games = ref([])
const selected = ref(0)
const status = ref('loading') // loading | empty | no-folder | ready

const selectedGame = computed(() => games.value[selected.value] ?? null)

async function scan() {
  if (!props.gamesFolder) {
    status.value = 'no-folder'
    games.value = []
    return
  }
  status.value = 'loading'
  const result = await window.freedash.scanGames()
  if (result.error === 'folder-not-set' || result.error === 'read-failed') {
    status.value = 'no-folder'
    games.value = []
    return
  }
  games.value = result.games
  selected.value = 0
  status.value = result.games.length ? 'ready' : 'empty'
}

function move(delta) {
  if (!games.value.length) return
  selected.value = Math.max(0, Math.min(games.value.length - 1, selected.value + delta))
}

function onKeydown(e) {
  if (status.value !== 'ready') return
  if (e.key === 'ArrowRight') move(1)
  if (e.key === 'ArrowLeft') move(-1)
}

watch(() => props.gamesFolder, scan)
onMounted(() => {
  scan()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="dashboard">
    <div v-if="status === 'no-folder'" class="empty-state">
      <p class="empty-title">Nenhuma pasta de jogos configurada</p>
      <p class="empty-hint">Abra as configurações (⚙) e selecione a pasta onde ficam seus jogos.</p>
    </div>

    <div v-else-if="status === 'empty'" class="empty-state">
      <p class="empty-title">Nenhum jogo encontrado</p>
      <p class="empty-hint">
        Cada jogo deve estar em uma subpasta com um arquivo .iso/.xex, ou solto na pasta raiz.
      </p>
    </div>

    <div v-else-if="status === 'loading'" class="empty-state">
      <p class="empty-title">Procurando jogos…</p>
    </div>

    <template v-else>
      <div class="title-zone">
        <p class="counter">{{ String(selected + 1).padStart(2, '0') }} / {{ String(games.length).padStart(2, '0') }}</p>
        <h1>{{ selectedGame?.title }}</h1>
      </div>

      <div class="blade">
        <GameCard
          v-for="(game, i) in games"
          :key="game.id"
          :game="game"
          :active="i === selected"
          @click="selected = i"
        />
      </div>

      <div class="hints">
        <span class="hint"><i>←</i><i>→</i> Navegar</span>
        <span class="hint"><i>↵</i> Selecionar</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.title-zone {
  padding: 0 28px 18px;
}
.counter {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--accent);
  margin: 0 0 6px;
}
.title-zone h1 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 30px;
  line-height: 1.2;
  letter-spacing: 0.01em;
  margin: 0;
  color: var(--text-primary);
}

.blade {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 22px 28px 24px;
  overflow-x: auto;
  scroll-behavior: smooth;
}

.hints {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding: 12px 28px;
  border-top: 1px solid var(--line);
}
.hint {
  font-size: 11px;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 6px;
}
.hint i {
  font-style: normal;
  font-size: 13px;
}

.empty-state {
  margin: auto;
  text-align: center;
  color: var(--text-dim);
}
.empty-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--text-primary);
  margin: 0 0 8px;
}
.empty-hint {
  font-size: 14px;
  margin: 0;
  max-width: 380px;
}
</style>
