export interface Animal {
  id: string
  user_id: string
  name: string
  tag_number: string | null
  type: 'cow' | 'buffalo'
  breed: string | null
  date_of_birth: string | null
  gender: 'female' | 'male'
  status: 'Calf' | 'Heifer' | 'Lactating' | 'Dry' | 'Bull'
  dam_info: string | null
  weight_kg: number | null
  notes: string | null
  created_at: string
}

export interface InseminationRecord {
  id: string
  animal_id: string
  ai_date: string
  method: 'AI' | 'Natural'
  semen_company: string | null
  bull_name: string | null
  lactation_no: number
  pregnancy_status: 'AI' | 'Natural' | 'Confirmed' | 'Failed'
  expected_calving_date: string | null
  created_at: string
  // Joined from animals table
  animals?: Animal
}

export type PregnancyFilter = 'All' | 'AI' | 'Natural' | 'Confirmed' | 'Failed'

export interface Seller {
  id: string
  user_id: string
  name: string
  contact_number: string | null
  rate_per_liter: number
  created_at: string
}

export interface MilkSaleEntry {
  id: string
  user_id: string
  seller_id: string
  date: string
  morning_liters: number
  evening_liters: number
  total_liters: number
  rate_per_liter: number
  total_amount: number
  created_at: string
  // Joined from sellers table
  sellers?: Seller
}

export type ExpenseCategory = 
  | 'Feed'
  | 'Veterinary / Medicine'
  | 'Labor / Staff Salary'
  | 'Equipment / Machinery'
  | 'Utilities'
  | 'Other'

export interface Expense {
  id: string
  user_id: string
  date: string
  category: ExpenseCategory
  description: string | null
  amount: number
  created_at: string
}

export type VaccinationStatus = 'Upcoming' | 'Given' | 'Overdue'

export interface VaccinationRecord {
  id: string
  user_id: string
  animal_id: string
  vaccine_name: string
  date_given: string
  given_by: string | null
  notes: string | null
  next_due_date: string
  status: VaccinationStatus
  created_at: string
  // Joined from animals table
  animals?: Animal
}
