<script lang="ts">
  let { label, value, max, text, tone = '' }: { label: string; value: number; max: number; text: string; tone?: string } = $props()
</script>

<div class="bar-row">
  <span>{label}</span>
  <div class="bar"><i class={tone} style:width="{max ? Math.min(100, (value / max) * 100) : 0}%"></i></div>
  <b>{text}</b>
</div>
