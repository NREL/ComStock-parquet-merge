export const getTimestamp = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}_${hour}-${minute}-${second}`
}

export const onInput =
  (setter: (value: string) => void) =>
  ({ currentTarget: { value } }: { currentTarget: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) =>
    setter(value)

export const onInputMultiple =
  (setter: (value: string[]) => void) =>
  ({ currentTarget: { selectedOptions } }: { currentTarget: HTMLSelectElement }) =>
    setter(Array.from(selectedOptions, ({ value }) => value))
