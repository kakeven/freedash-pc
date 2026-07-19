// Parser do formato XUIZ (.xzp) — pacotes de skin/tema do dashboard Xbox 360
// (Aurora, Freestyle Dash). Formato fechado, sem spec oficial; estrutura
// confirmada por engenharia reversa em arquivo real:
//
// offset 0-3   "XUIZ" (assinatura)
// offset 4-7   flags (uint32 BE)
// offset 8-11  tamanho total do arquivo (uint32 BE)
// offset 12-15 reservado (uint32 BE)
// offset 16-19 tamanho da seção de diretório, em bytes (uint32 BE)
// offset 20-21 número de entradas (uint16 BE)
//
// Diretório (a partir do offset 22), repetido `numEntries` vezes, empacotado
// sem alinhamento:
//   4 bytes  tamanho do arquivo (uint32 BE)
//   4 bytes  offset relativo dentro da seção de dados (uint32 BE)
//   1 byte   tamanho do nome, em caracteres
//   N*2 bytes nome do arquivo, UTF-16 big-endian (caminho com "\" como separador)
//
// Seção de dados: começa em (22 + dirSize); arquivos concatenados sem padding.
// A extensão do nome interno nem sempre bate com o conteúdo real (ex: um
// ".jpg" pode ser PNG por dentro) — por isso a detecção de mime é por
// assinatura de bytes, não pela extensão do nome.

const HEADER_SIZE = 22

function parseXzp(buf) {
  if (buf.length < HEADER_SIZE || buf.toString('ascii', 0, 4) !== 'XUIZ') {
    throw new Error('not-xzp')
  }

  const dirSize = buf.readUInt32BE(16)
  const numEntries = buf.readUInt16BE(20)
  const dataStart = HEADER_SIZE + dirSize

  const entries = []
  let pos = HEADER_SIZE

  for (let i = 0; i < numEntries; i++) {
    if (pos + 9 > buf.length) break
    const flen = buf.readUInt32BE(pos)
    const fptr = buf.readUInt32BE(pos + 4)
    const fnlen = buf.readUInt8(pos + 8)
    pos += 9

    const nameBytes = Buffer.from(buf.subarray(pos, pos + fnlen * 2))
    const name = nameBytes.swap16().toString('utf16le')
    pos += fnlen * 2

    entries.push({ name, length: flen, offset: dataStart + fptr })
  }

  return entries
}

function extractEntry(buf, entry) {
  return buf.subarray(entry.offset, entry.offset + entry.length)
}

// Detecta o mime real pelos bytes iniciais (a extensão do nome interno não é confiável)
function detectImageMime(data) {
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'image/png'
  if (data[0] === 0xff && data[1] === 0xd8) return 'image/jpeg'
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return 'image/gif'
  if (data[0] === 0x42 && data[1] === 0x4d) return 'image/bmp'
  return null
}

module.exports = { parseXzp, extractEntry, detectImageMime }
