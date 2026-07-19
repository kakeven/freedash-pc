<script setup>
import { ref, watch, onMounted } from 'vue'
import placeholder from '../assets/placeholder-cover.svg'

const props = defineProps({
  game: { type: Object, required: true },
  active: { type: Boolean, default: false }
})

defineEmits(['click'])

const coverSrc = ref(placeholder)

async function loadCover() {
  if (!props.game.coverPath) {
    coverSrc.value = placeholder
    return
  }
  const dataUrl = await window.freedash.readCover(props.game.coverPath)
  coverSrc.value = dataUrl || placeholder
}

watch(() => props.game.coverPath, loadCover)
onMounted(loadCover)
</script>

<template>
  <button class="card" :class="{ active }" @click="$emit('click')">
    <img :src="coverSrc" :alt="game.title" />
  </button>
</template>

<style scoped>
.card {
  flex: 0 0 auto;
  width: 118px;
  height: 164px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: var(--bg-panel);
  overflow: visible;
  transform: scale(0.9);
  opacity: 0.55;
  transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
}

.card img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.card.active {
  width: 150px;
  height: 210px;
  transform: translateY(-8px) scale(1);
  opacity: 1;
  box-shadow: 0 0 0 1px var(--accent-dim), 0 8px 18px rgba(180, 255, 57, 0.14);
}
</style>
