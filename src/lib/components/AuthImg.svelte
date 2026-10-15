<script lang="ts">
  // Foto dari API butuh header Authorization, jadi dimuat sebagai blob.
  import { apiBlob } from '$lib/api.svelte'

  let { id, alt = 'Foto bukti' }: { id: string; alt?: string } = $props()
  let src = $state<string | null>(null)
  $effect(() => {
    let url: string | null = null
    apiBlob(`/photos/${id}`).then((b) => (src = url = URL.createObjectURL(b))).catch(() => (src = null))
    return () => { if (url) URL.revokeObjectURL(url) }
  })
</script>

{#if src}<img class="thumb" {src} {alt} />{/if}
