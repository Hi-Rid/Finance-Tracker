import type {
    FiType,
    MilestoneType,
    AiAnalysis,
} from '@/lib/validators/financial-freedom'

export type FiSettings = {
    id: string
    user_id: string
    profile_id: string
    fi_type: FiType
    fi_multiplier: number
    monthly_expense_override: number | null
    monthly_income_override: number | null
    expected_return_rate: number
    inflation_rate: number
    current_age: number | null
    target_retire_age: number | null
    onboarding_completed: boolean
    fi_achieved_dismissed_at: string | null
    created_at: string
    updated_at: string
}

export type FiSnapshot = {
    id: string
    user_id: string
    profile_id: string
    snapshot_month: string
    net_worth: number
    fi_number: number
    fi_progress: number
    savings_rate: number
    lean_fi_progress: number | null
    regular_fi_progress: number | null
    fat_fi_progress: number | null
    coast_fi_progress: number | null
    estimated_fi_date: string | null
    monthly_expense: number
    monthly_income: number
    created_at: string
}

export type FiImprovement = {
    title: string
    description: string
    impact_estimate: string
}

export type FiInsight = {
    id: string
    user_id: string
    profile_id: string
    generated_at: string
    overall_status: string | null
    savings_rate_analysis: string | null
    improvements: FiImprovement[] | null
    next_milestone: string | null
    next_milestone_amount: number | null
    next_milestone_gap: number | null
    raw_ai_response: AiAnalysis | null
    created_at: string
}

export type FiMilestoneRow = {
    id: string
    user_id: string
    profile_id: string
    milestone_type: MilestoneType
    milestone_label: string
    target_amount: number
    achieved_at: string | null
    is_notified: boolean
    created_at: string
}

export type FiActionStep = {
    id: string
    user_id: string
    profile_id: string
    title: string
    description: string | null
    impact_estimate: string | null
    is_done: boolean
    done_at: string | null
    sort_order: number
    created_at: string
}

export type FiServerData = {
    netWorth: {
        accounts: number
        assets: number
        debts: number
        total: number
    }
    avgExpense: number
    income: { value: number; source: 'budget' | 'transactions' | 'none' }
    topCategories: Array<{ name: string; amount: number; percent: number }>
}