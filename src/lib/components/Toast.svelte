<script lang="ts">
  import { toasts } from '$lib/store.svelte'
</script>

<div class="toasts" role="status">
  {#each toasts as t (t.id)}<div class="toast {t.tone}">{t.msg}</div>{/each}
</div>
