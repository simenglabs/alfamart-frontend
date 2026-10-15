<script lang="ts">
  import type { Snippet } from 'svelte'
  let { open = $bindable(false), title, busy = false, error = '', children }: { open?: boolean; title: string; busy?: boolean; error?: string; children: Snippet } = $props()
  let dialog: HTMLDialogElement
  const id = $props.id()
  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  })
</script>

<dialog bind:this={dialog} aria-labelledby={`${id}-title`} oncancel={(event) => { event.preventDefault(); if (!busy) open = false }} onclose={() => { open = false }}>
  <header><div><p>ALFAMART WORKSPACE</p><h2 id={`${id}-title`}>{title}</h2></div><button type="button" class="ghost" aria-label="Tutup modal" disabled={busy} onclick={() => { open = false }}>×</button></header>
  <div class="modal-body">{#if error}<p class="alert bad" role="alert">{error}</p>{/if}{@render children()}</div>
</dialog>

<style>
  dialog { width: min(560px, calc(100vw - 32px)); max-height: calc(100svh - 40px); padding: 0; border: 1px solid var(--line); border-radius: 12px; color: var(--text); background: var(--surface); box-shadow: 0 24px 80px #23364b26; }
  dialog::backdrop { background: #173b3b70; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 24px; border-bottom: 1px solid var(--line); }
  header p { margin: 0 0 8px; color: var(--brand); font-size: 9px; letter-spacing: .12em; }
  h2 { font-size: 21px; }
  header button { font-size: 24px; padding: 0; width: 36px; height: 36px; }
  .modal-body { padding: 24px; }
  .modal-body :global(.select-label) { display: block; }
  .modal-body > .alert { margin: 0 0 18px; }
  .modal-body :global(form) { display: grid; gap: 18px; }
  .modal-body :global(.field) { gap: 7px; }
  .modal-body :global(.modal-actions) { display: flex; justify-content: flex-end; gap: 10px; padding-top: 18px; margin-top: 6px; border-top: 1px solid var(--line); }
  @media (max-width: 600px) {
    dialog { width: 100%; max-width: 100%; height: 100dvh; max-height: 100dvh; margin: 0; border: 0; border-radius: 0; }
    header { position: sticky; top: 0; z-index: 2; padding: 16px; background: var(--surface); }
    header button { width: 44px; height: 44px; }
    .modal-body { padding: 20px 16px; }
    .modal-body :global(input), .modal-body :global(textarea) { font-size: 16px; }
    .modal-body :global(.modal-actions) { position: sticky; bottom: -20px; background: var(--surface); padding: 16px 0 max(16px, env(safe-area-inset-bottom)); }
    .modal-body :global(.modal-actions button) { flex: 1; min-height: 48px; }
  }
</style>
