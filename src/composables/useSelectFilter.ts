import { ref, watch, type Ref, type ComputedRef } from 'vue'

export interface SelectOption {
  label: string
  value: unknown
  [key: string]: unknown
}

/**
 * Creates a filterable options list for Quasar q-select with use-input.
 *
 * Usage:
 *   const allOpts = computed(() => [...])
 *   const { options, filter } = useSelectFilter(allOpts)
 *
 * Template:
 *   <q-select :options="options" use-input input-debounce="0" @filter="filter" />
 */
export function useSelectFilter<T extends SelectOption>(
  source: Ref<T[]> | ComputedRef<T[]>
) {
  const options = ref<T[]>([]) as Ref<T[]>

  watch(source, v => { options.value = v }, { immediate: true })

  function filter(val: string, update: (fn: () => void) => void) {
    update(() => {
      if (!val) {
        options.value = source.value
      } else {
        const needle = val.toLowerCase()
        options.value = source.value.filter(o =>
          o.label.toLowerCase().includes(needle)
        )
      }
    })
  }

  return { options, filter }
}
