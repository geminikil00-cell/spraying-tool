import { describe, expect, it } from 'vitest'
import { validateSprayingForm } from './validation'

describe('validateSprayingForm', () => {
  it('requires at least one selected planned plot', () => {
    expect(validateSprayingForm({ plotIds: [], items: [{ material_id: 'm1', quantity: 1 }] })).toBe(
      'noPlots',
    )
  })

  it('requires a material and positive quantity for every ingredient', () => {
    expect(validateSprayingForm({ plotIds: ['p1'], items: [{ material_id: '', quantity: 1 }] })).toBe(
      'noItems',
    )
    expect(validateSprayingForm({ plotIds: ['p1'], items: [{ material_id: 'm1', quantity: 0 }] })).toBe(
      'noItems',
    )
  })

  it('accepts a plot selection and valid ingredients', () => {
    expect(
      validateSprayingForm({
        plotIds: ['p1', 'p2'],
        items: [
          { material_id: 'm1', quantity: 2 },
          { material_id: 'm2', quantity: 0.25 },
        ],
      }),
    ).toBeNull()
  })
})
