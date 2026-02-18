import { prisma } from '@/lib/prisma'
import { SUPPORT_ORG } from './constants'
import type { DocumentContext, StudentData, CompanyData, ProjectData } from './types'
import type { SswField } from '@joshinan/database'

/**
 * プロジェクトIDから書類生成に必要な全データを収集する
 *
 * Project の contextData から studentId, companyId を取得し、
 * Student, Company テーブルから必要なフィールドを取得して
 * DocumentContext にまとめる。
 */
export async function collectDocumentData(projectId: string): Promise<DocumentContext> {
  // 1. プロジェクトを取得して contextData を読み取る
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      contextData: true,
    },
  })

  const contextData = project.contextData as Record<string, unknown>
  const studentId = contextData.studentId as string | undefined
  const companyId = contextData.companyId as string | undefined
  const sswField = contextData.sswField as SswField | undefined
  const nationality = contextData.nationality as string | undefined

  if (!studentId) {
    throw new Error('プロジェクトに学生が設定されていません（contextData.studentId が未設定）')
  }
  if (!sswField) {
    throw new Error('プロジェクトに特定技能分野が設定されていません（contextData.sswField が未設定）')
  }

  // 2. 学生データを取得
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      nameKanji: true,
      nameKana: true,
      nameEn: true,
      dateOfBirth: true,
      gender: true,
      nationality: true,
      addressJapan: true,
      phone: true,
      passportNumber: true,
      residenceCardNumber: true,
      residenceStatus: true,
      residenceExpiry: true,
      entryDate: true,
      // 資格証情報（技能試験・日本語試験の合格情報）
      certifications: {
        select: {
          examType: true,
          level: true,
          examDate: true,
          result: true,
          certificateNumber: true,
        },
      },
    },
  })

  const studentData: StudentData = {
    nameKanji: student.nameKanji,
    nameKana: student.nameKana,
    nameEn: student.nameEn,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    nationality: student.nationality,
    addressJapan: student.addressJapan,
    phone: student.phone,
    passportNumber: student.passportNumber,
    residenceCardNumber: student.residenceCardNumber,
    residenceStatus: student.residenceStatus,
    residenceExpiry: student.residenceExpiry,
    entryDate: student.entryDate,
    certifications: student.certifications.map((c) => ({
      examType: c.examType,
      level: c.level,
      examDate: c.examDate,
      result: c.result,
      certificateNumber: c.certificateNumber,
    })),
  }

  // 3. 企業データを取得（companyId が未設定の場合はダミーデータ）
  let companyData: CompanyData
  if (companyId) {
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        name: true,
        representative: true,
        postalCode: true,
        address: true,
        phone: true,
        field: true,
        businessLicense: true,
        corporateNumber: true,
        establishedDate: true,
      },
    })
    companyData = {
      name: company.name,
      representative: company.representative,
      postalCode: company.postalCode,
      address: company.address,
      phone: company.phone,
      field: company.field,
      businessLicense: company.businessLicense,
      corporateNumber: company.corporateNumber,
      establishedDate: company.establishedDate,
    }
  } else {
    // 企業未設定の場合は空データ（DAT-001 未完了の状態で生成を試みた場合）
    companyData = {
      name: '',
      representative: '',
      postalCode: null,
      address: '',
      phone: '',
      field: sswField,
      businessLicense: null,
      corporateNumber: null,
      establishedDate: null,
    }
  }

  // 4. プロジェクトデータを構成
  const projectData: ProjectData = {
    projectId: project.id,
    projectName: project.name,
    studentId,
    companyId: companyId ?? null,
    sswField,
    nationality: nationality ?? student.nationality,
  }

  return {
    student: studentData,
    company: companyData,
    project: projectData,
    supportOrg: SUPPORT_ORG,
  }
}
