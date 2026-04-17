export type Status = 'done' | 'wip' | 'plan'

export interface Item {
  id: string
  position: number
  label: string
  checked: boolean
}

export interface Phase {
  id: string
  position: number
  title: string
  period: string
  status: Status
  items: Item[]
}