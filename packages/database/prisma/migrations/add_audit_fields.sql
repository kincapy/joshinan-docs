-- =============================================
-- マイグレーション: 全テーブルに監査フィールド (createdById/updatedById) を追加
-- 不足していた updatedAt カラムも追加
-- 実行先: Supabase SQL Editor
-- 注意: Prisma は @map なしなのでカラム名はキャメルケース
-- =============================================

-- =============================================
-- 1. 不足していた updatedAt カラムの追加
-- =============================================

ALTER TABLE "monthly_attendance_rates" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE "semiannual_attendance_reports" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE "monthly_balances" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE "dormitory_assignments" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE "scheduled_reports" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE "agent_aliases" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();

-- =============================================
-- 2. createdById / updatedById カラムの追加（全テーブル）
-- =============================================

-- 01-school-info
ALTER TABLE "schools" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "schools" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "enrollment_periods" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "enrollment_periods" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 02-student-management
ALTER TABLE "students" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "students" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "student_employments" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "student_employments" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "interview_records" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "interview_records" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "student_certifications" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "student_certifications" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 03-curriculum
ALTER TABLE "subjects" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "subjects" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "periods" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "periods" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "timetable_slots" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "timetable_slots" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 04-class-assignment
ALTER TABLE "classes" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "classes" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "class_enrollments" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "class_enrollments" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 05-attendance
ALTER TABLE "attendance_records" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "attendance_records" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "monthly_attendance_rates" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "monthly_attendance_rates" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "semiannual_attendance_reports" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "semiannual_attendance_reports" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 06-tuition
ALTER TABLE "billing_items" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "billing_items" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "invoices" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "invoices" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "payments" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "payments" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "monthly_balances" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "monthly_balances" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 07-agent-management
ALTER TABLE "agents" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "agents" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "agent_aliases" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "agent_aliases" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "agent_invoices" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "agent_invoices" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "agent_payments" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "agent_payments" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 08-facility-management
ALTER TABLE "dormitories" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "dormitories" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "dormitory_assignments" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "dormitory_assignments" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "dormitory_utilities" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "dormitory_utilities" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "wifi_devices" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "wifi_devices" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 09-staff-management
ALTER TABLE "staffs" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "staffs" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "teacher_qualifications" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "teacher_qualifications" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 11-immigration-report
ALTER TABLE "immigration_tasks" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "immigration_tasks" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "immigration_documents" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "immigration_documents" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "scheduled_reports" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "scheduled_reports" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 12-internal-documents
ALTER TABLE "document_templates" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "document_templates" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 14-recruitment
ALTER TABLE "recruitment_cycles" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "recruitment_cycles" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "application_cases" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "application_cases" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "application_documents" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "application_documents" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- document_check_results は immutable なので createdById のみ
ALTER TABLE "document_check_results" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- 15-specified-skilled-worker
ALTER TABLE "companies" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "companies" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "ssw_cases" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "ssw_cases" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "case_documents" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "case_documents" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "support_plans" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "support_plans" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

ALTER TABLE "ssw_invoices" ADD COLUMN "createdById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;
ALTER TABLE "ssw_invoices" ADD COLUMN "updatedById" UUID REFERENCES "staffs"("id") ON DELETE RESTRICT;

-- =============================================
-- 3. インデックスの追加
-- =============================================

CREATE INDEX "schools_createdById_idx" ON "schools"("createdById");
CREATE INDEX "schools_updatedById_idx" ON "schools"("updatedById");
CREATE INDEX "enrollment_periods_createdById_idx" ON "enrollment_periods"("createdById");
CREATE INDEX "enrollment_periods_updatedById_idx" ON "enrollment_periods"("updatedById");
CREATE INDEX "students_createdById_idx" ON "students"("createdById");
CREATE INDEX "students_updatedById_idx" ON "students"("updatedById");
CREATE INDEX "student_employments_createdById_idx" ON "student_employments"("createdById");
CREATE INDEX "student_employments_updatedById_idx" ON "student_employments"("updatedById");
CREATE INDEX "interview_records_createdById_idx" ON "interview_records"("createdById");
CREATE INDEX "interview_records_updatedById_idx" ON "interview_records"("updatedById");
CREATE INDEX "student_certifications_createdById_idx" ON "student_certifications"("createdById");
CREATE INDEX "student_certifications_updatedById_idx" ON "student_certifications"("updatedById");
CREATE INDEX "subjects_createdById_idx" ON "subjects"("createdById");
CREATE INDEX "subjects_updatedById_idx" ON "subjects"("updatedById");
CREATE INDEX "periods_createdById_idx" ON "periods"("createdById");
CREATE INDEX "periods_updatedById_idx" ON "periods"("updatedById");
CREATE INDEX "timetable_slots_createdById_idx" ON "timetable_slots"("createdById");
CREATE INDEX "timetable_slots_updatedById_idx" ON "timetable_slots"("updatedById");
CREATE INDEX "classes_createdById_idx" ON "classes"("createdById");
CREATE INDEX "classes_updatedById_idx" ON "classes"("updatedById");
CREATE INDEX "class_enrollments_createdById_idx" ON "class_enrollments"("createdById");
CREATE INDEX "class_enrollments_updatedById_idx" ON "class_enrollments"("updatedById");
CREATE INDEX "attendance_records_createdById_idx" ON "attendance_records"("createdById");
CREATE INDEX "attendance_records_updatedById_idx" ON "attendance_records"("updatedById");
CREATE INDEX "monthly_attendance_rates_createdById_idx" ON "monthly_attendance_rates"("createdById");
CREATE INDEX "monthly_attendance_rates_updatedById_idx" ON "monthly_attendance_rates"("updatedById");
CREATE INDEX "semiannual_attendance_reports_createdById_idx" ON "semiannual_attendance_reports"("createdById");
CREATE INDEX "semiannual_attendance_reports_updatedById_idx" ON "semiannual_attendance_reports"("updatedById");
CREATE INDEX "billing_items_createdById_idx" ON "billing_items"("createdById");
CREATE INDEX "billing_items_updatedById_idx" ON "billing_items"("updatedById");
CREATE INDEX "invoices_createdById_idx" ON "invoices"("createdById");
CREATE INDEX "invoices_updatedById_idx" ON "invoices"("updatedById");
CREATE INDEX "payments_createdById_idx" ON "payments"("createdById");
CREATE INDEX "payments_updatedById_idx" ON "payments"("updatedById");
CREATE INDEX "monthly_balances_createdById_idx" ON "monthly_balances"("createdById");
CREATE INDEX "monthly_balances_updatedById_idx" ON "monthly_balances"("updatedById");
CREATE INDEX "agents_createdById_idx" ON "agents"("createdById");
CREATE INDEX "agents_updatedById_idx" ON "agents"("updatedById");
CREATE INDEX "agent_aliases_createdById_idx" ON "agent_aliases"("createdById");
CREATE INDEX "agent_aliases_updatedById_idx" ON "agent_aliases"("updatedById");
CREATE INDEX "agent_invoices_createdById_idx" ON "agent_invoices"("createdById");
CREATE INDEX "agent_invoices_updatedById_idx" ON "agent_invoices"("updatedById");
CREATE INDEX "agent_payments_createdById_idx" ON "agent_payments"("createdById");
CREATE INDEX "agent_payments_updatedById_idx" ON "agent_payments"("updatedById");
CREATE INDEX "dormitories_createdById_idx" ON "dormitories"("createdById");
CREATE INDEX "dormitories_updatedById_idx" ON "dormitories"("updatedById");
CREATE INDEX "dormitory_assignments_createdById_idx" ON "dormitory_assignments"("createdById");
CREATE INDEX "dormitory_assignments_updatedById_idx" ON "dormitory_assignments"("updatedById");
CREATE INDEX "dormitory_utilities_createdById_idx" ON "dormitory_utilities"("createdById");
CREATE INDEX "dormitory_utilities_updatedById_idx" ON "dormitory_utilities"("updatedById");
CREATE INDEX "wifi_devices_createdById_idx" ON "wifi_devices"("createdById");
CREATE INDEX "wifi_devices_updatedById_idx" ON "wifi_devices"("updatedById");
CREATE INDEX "staffs_createdById_idx" ON "staffs"("createdById");
CREATE INDEX "staffs_updatedById_idx" ON "staffs"("updatedById");
CREATE INDEX "teacher_qualifications_createdById_idx" ON "teacher_qualifications"("createdById");
CREATE INDEX "teacher_qualifications_updatedById_idx" ON "teacher_qualifications"("updatedById");
CREATE INDEX "immigration_tasks_createdById_idx" ON "immigration_tasks"("createdById");
CREATE INDEX "immigration_tasks_updatedById_idx" ON "immigration_tasks"("updatedById");
CREATE INDEX "immigration_documents_createdById_idx" ON "immigration_documents"("createdById");
CREATE INDEX "immigration_documents_updatedById_idx" ON "immigration_documents"("updatedById");
CREATE INDEX "scheduled_reports_createdById_idx" ON "scheduled_reports"("createdById");
CREATE INDEX "scheduled_reports_updatedById_idx" ON "scheduled_reports"("updatedById");
CREATE INDEX "document_templates_createdById_idx" ON "document_templates"("createdById");
CREATE INDEX "document_templates_updatedById_idx" ON "document_templates"("updatedById");
CREATE INDEX "recruitment_cycles_createdById_idx" ON "recruitment_cycles"("createdById");
CREATE INDEX "recruitment_cycles_updatedById_idx" ON "recruitment_cycles"("updatedById");
CREATE INDEX "application_cases_createdById_idx" ON "application_cases"("createdById");
CREATE INDEX "application_cases_updatedById_idx" ON "application_cases"("updatedById");
CREATE INDEX "application_documents_createdById_idx" ON "application_documents"("createdById");
CREATE INDEX "application_documents_updatedById_idx" ON "application_documents"("updatedById");
CREATE INDEX "document_check_results_createdById_idx" ON "document_check_results"("createdById");
CREATE INDEX "companies_createdById_idx" ON "companies"("createdById");
CREATE INDEX "companies_updatedById_idx" ON "companies"("updatedById");
CREATE INDEX "ssw_cases_createdById_idx" ON "ssw_cases"("createdById");
CREATE INDEX "ssw_cases_updatedById_idx" ON "ssw_cases"("updatedById");
CREATE INDEX "case_documents_createdById_idx" ON "case_documents"("createdById");
CREATE INDEX "case_documents_updatedById_idx" ON "case_documents"("updatedById");
CREATE INDEX "support_plans_createdById_idx" ON "support_plans"("createdById");
CREATE INDEX "support_plans_updatedById_idx" ON "support_plans"("updatedById");
CREATE INDEX "ssw_invoices_createdById_idx" ON "ssw_invoices"("createdById");
CREATE INDEX "ssw_invoices_updatedById_idx" ON "ssw_invoices"("updatedById");
