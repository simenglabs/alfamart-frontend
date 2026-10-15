<script lang="ts">
  import { rp } from '$lib/format'

  let { value = $bindable(0), disabled = false, required = false, placeholder }: {
    value: number; disabled?: boolean; required?: boolean; placeholder?: number
  } = $props()

  function formatInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const digits = input.value.replace(/\D/g, '')
    value = digits ? Number(digits) : 0
    input.value = digits ? rp(value) : ''
  }
</script>

<input type="text" inputmode="numeric" autocomplete="off" {disabled} {required}
  value={value ? rp(value) : ''} placeholder={placeholder === undefined ? 'Rp 0' : rp(placeholder)} oninput={formatInput} />
