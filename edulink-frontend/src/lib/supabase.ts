import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// This creates a single Supabase client for use in Client Components
export const supabase = createClientComponentClient()
