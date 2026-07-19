<script setup>
import { reactive, ref, computed } from 'vue'

const props = defineProps({
  settings: { type: Object, required: true }
})
const emit = defineEmits(['saved', 'close'])

const form = reactive({
  gamesFolder: props.settings.gamesFolder,
  xeniaDataFolder: props.settings.xeniaDataFolder,
  xeniaPath: props.settings.xeniaPath,
  backgroundPath: props.settings.backgroundPath,
  backgroundXzpEntry: props.settings.backgroundXzpEntry
})

async function pickGamesFolder() {
  const folder = await window.freedash.pickFolder()
  if (folder) form.gamesFolder = folder
}

async function pickXeniaDataFolder() {
  const folder = await window.freedash.pickFolder()
  if (folder) form.xeniaDataFolder = folder
}

async function pickXenia() {
  const file = await window.freedash.pickExecutable()
  if (file) form.xeniaPath = file
}

// --- Fundo: imagem/GIF direto, ou tema .xzp (Aurora/Freestyle Dash) ---
const xzpImages = ref([])
const xzpFilter = ref('')
const xzpError = ref('')
const xzpPreview = ref('')

const filteredXzpImages = computed(() => {
  const term = xzpFilter.value.trim().toLowerCase()
  if (!term) return xzpImages.value
  return xzpImages.value.filter((img) => img.name.toLowerCase().includes(term))
})

async function pickBackground() {
  const file = await window.freedash.pickBackground()
  if (!file) return

  xzpError.value = ''
  xzpImages.value = []
  xzpPreview.value = ''
  form.backgroundXzpEntry = ''

  if (file.toLowerCase().endsWith('.xzp')) {
    form.backgroundPath = file
    const result = await window.freedash.listXzpImages(file)
    if (result?.error) {
      xzpError.value = 'Não foi possível ler esse .xzp (arquivo corrompido ou fora do formato esperado).'
      return
    }
    xzpImages.value = result.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    form.backgroundPath = file
  }
}

async function chooseXzpEntry(entry) {
  form.backgroundXzpEntry = entry.name
  xzpPreview.value = (await window.freedash.readXzpEntry(form.backgroundPath, entry.name)) || ''
}

function clearBackground() {
  form.backgroundPath = ''
  form.backgroundXzpEntry = ''
  xzpImages.value = []
  xzpPreview.value = ''
  xzpError.value = ''
}

async function save() {
  const updated = await window.freedash.setSettings({ ...form })
  emit('saved', updated)
}
</script>

<template>
  <div class="settings">
    <h2>Configurações</h2>

    <div class="field">
      <label>Pasta de jogos</label>
      <div class="row">
        <input type="text" :value="form.gamesFolder" placeholder="Nenhuma pasta selecionada" readonly />
        <button class="pick" @click="pickGamesFolder">Escolher…</button>
      </div>
      <p class="hint">Cada jogo em uma subpasta com .iso/.xex (+ cover.jpg opcional), ou solto na raiz.</p>
    </div>

    <div class="field">
      <label>GameData do Xenia (capas)</label>
      <div class="row">
        <input type="text" :value="form.xeniaDataFolder" placeholder="Ex: G:\xenia_manager\GameData" readonly />
        <button class="pick" @click="pickXeniaDataFolder">Escolher…</button>
      </div>
      <p class="hint">
        Usada como fallback quando não há cover.jpg na pasta do jogo — lê a primeira imagem em
        GameData/&lt;NomeDoJogo&gt;/Artwork.
      </p>
    </div>

    <div class="field">
      <label>Executável do Xenia</label>
      <div class="row">
        <input type="text" :value="form.xeniaPath" placeholder="Nenhum executável selecionado" readonly />
        <button class="pick" @click="pickXenia">Escolher…</button>
      </div>
      <p class="hint">Usado futuramente para lançar os jogos — ainda não integrado nesta versão.</p>
    </div>

    <div class="field">
      <label>Imagem, GIF ou tema Xbox de fundo (opcional)</label>
      <div class="row">
        <input type="text" :value="form.backgroundPath" placeholder="Nenhuma imagem selecionada" readonly />
        <button class="pick" @click="pickBackground">Escolher…</button>
        <button v-if="form.backgroundPath" class="pick" @click="clearBackground">Remover</button>
      </div>
      <p class="hint">
        Aceita .jpg, .png, .gif, .webp — ou um tema .xzp (Aurora/Freestyle Dash), de onde você escolhe
        uma imagem específica de dentro do pacote.
      </p>

      <p v-if="xzpError" class="xzp-error">{{ xzpError }}</p>

      <div v-if="xzpImages.length" class="xzp-picker">
        <input
          v-model="xzpFilter"
          type="text"
          class="xzp-filter"
          placeholder="Filtrar por nome (ex: background)"
        />
        <div class="xzp-list">
          <button
            v-for="img in filteredXzpImages"
            :key="img.name"
            type="button"
            class="xzp-item"
            :class="{ active: img.name === form.backgroundXzpEntry }"
            @click="chooseXzpEntry(img)"
          >
            {{ img.name }}
          </button>
        </div>
        <img v-if="xzpPreview" :src="xzpPreview" class="xzp-preview" alt="Pré-visualização" />
      </div>
    </div>

    <div class="actions">
      <button class="secondary" @click="$emit('close')">Cancelar</button>
      <button class="primary" @click="save">Salvar</button>
    </div>
  </div>
</template>

<style scoped>
.settings {
  max-width: 560px;
  margin: 60px auto;
  padding: 0 32px;
}

h2 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 26px;
  margin: 0 0 28px;
}

.field {
  margin-bottom: 22px;
}
label {
  display: block;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.row {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  color: var(--text-primary);
  padding: 10px 12px;
  border-radius: 3px;
  font-family: var(--font-body);
  font-size: 13px;
}

button.pick {
  background: var(--bg-panel-raised);
  border: 1px solid var(--line);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: 3px;
  font-size: 13px;
  transition: border-color 0.15s;
}
button.pick:hover {
  border-color: var(--accent-dim);
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-dim);
}

.xzp-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #ff8a6a;
}

.xzp-picker {
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 10px;
  background: var(--bg-panel);
}
.xzp-filter {
  width: 100%;
  margin-bottom: 8px;
  background: var(--bg-panel-raised);
  border: 1px solid var(--line);
  color: var(--text-primary);
  padding: 8px 10px;
  border-radius: 3px;
  font-size: 12px;
}
.xzp-list {
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.xzp-item {
  text-align: left;
  background: none;
  border: none;
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text-dim);
  font-family: var(--font-body);
}
.xzp-item:hover {
  background: var(--bg-panel-raised);
  color: var(--text-primary);
}
.xzp-item.active {
  background: var(--accent-dim);
  color: var(--text-primary);
}
.xzp-preview {
  margin-top: 10px;
  max-width: 100%;
  max-height: 140px;
  border-radius: 3px;
  border: 1px solid var(--line);
  object-fit: contain;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

button.secondary {
  background: none;
  border: 1px solid var(--line);
  color: var(--text-dim);
  padding: 10px 20px;
  border-radius: 3px;
}
button.primary {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #0a0d0a;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 3px;
}
button.primary:hover {
  filter: brightness(1.08);
}
</style>
