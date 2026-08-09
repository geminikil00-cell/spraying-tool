export interface SprayingFormItem {
  material_id: string
  quantity: number
}

export type SprayFormError = 'noPlots' | 'noItems' | null

export function validateSprayingForm(input: {
  plotIds: string[]
  items: SprayingFormItem[]
}): SprayFormError {
  if (input.plotIds.length === 0) return 'noPlots'
  if (input.items.length === 0) return 'noItems'
  for (const item of input.items) {
    if (!item.material_id) return 'noItems'
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) return 'noItems'
  }
  return null
}
