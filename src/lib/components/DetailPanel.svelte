<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  let { label, onclose, children }: { label: string; onclose: () => void; children: Snippet } = $props()
  let compact = $state(false)
  let dialog = $state<HTMLDialogElement>()
  onMount(() => {
    const media = window.matchMedia('(max-width: 1280px)')
    const update = () => { compact = media.matches }
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  })
  $effect(() => { if (compact && dialog && !dialog.open) dialog.showModal() })
</script>

{#if compact}
  <dialog bind:this={dialog} aria-label={label} oncancel={(event) => { event.preventDefault(); onclose() }}>
    {@render children()}
  </dialog>
{:else}
  <aside class="detail" aria-label={label}>{@render children()}</aside>
{/if}

<style>
  dialog { inset: 0; width: min(680px, 100%); height: 100dvh; max-height: 100dvh; max-width: 100%; margin: 0 0 0 auto; padding: 24px; border: 0; background: var(--surface); color: var(--text); overflow: auto; }
  dialog::backdrop { background: #173b3b70; }
  dialog :global(.detail-head) { position: sticky; top: -24px; background: var(--surface); padding: 16px 0; z-index: 1; }
  dialog :global(button) { min-height: 44px; }
  dialog :global(input) { font-size: 16px; }
</style>
