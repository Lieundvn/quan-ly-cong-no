import { createClient } from '@supabase/supabase-js'

// Dán URL và Key bạn đã lưu từ Giai đoạn 1 vào đây
const supabaseUrl = "https://sustppllktraopnmeaoi.supabase.co" // Ví dụ
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1c3RwcGxsa3RyYW9wbm1lYW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODU5MDgsImV4cCI6MjA2NjM2MTkwOH0.uYNMhPBGhknhqanfgPG18hnAjrf-7UuezFmq4D6f8dE"
// Tạo ra kết nối và xuất nó ra để các file khác có thể dùng
export const supabase = createClient(supabaseUrl, supabaseAnonKey)