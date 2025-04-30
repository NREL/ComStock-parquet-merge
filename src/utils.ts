export const onInput =
  (setter: (value: string) => void) =>
  ({ currentTarget: { value } }: { currentTarget: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) =>
    setter(value)

export const onInputMultiple =
  (setter: (value: string[]) => void) =>
  ({ currentTarget: { selectedOptions } }: { currentTarget: HTMLSelectElement }) =>
    setter(Array.from(selectedOptions, ({ value }) => value))
