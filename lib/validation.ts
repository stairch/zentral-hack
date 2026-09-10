import { z } from "zod"

// Shared patterns
export const passwordSchema = z
  .string()
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Passwort muss mindestens ein Sonderzeichen enthalten")
  .regex(/[0-9]/, "Passwort muss mindestens eine Zahl enthalten")
  .regex(/[A-Z]/, "Passwort muss mindestens einen Großbuchstaben enthalten")
  .min(12, "Passwort muss mindestens 12 Zeichen lang sein")

export const emailSchema = z.string().email("Ungültige E-Mail-Adresse").toLowerCase()

// Auth Schemas
export const SignupSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Vorname erforderlich")
      .max(50)
      .regex(/^[a-zA-ZäöüßÄÖÜ\s-]+$/, "Ungültiger Vorname"),
    lastName: z
      .string()
      .min(1, "Nachname erforderlich")
      .max(50)
      .regex(/^[a-zA-ZäöüßÄÖÜ\s-]+$/, "Ungültiger Nachname"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    university: z.string().max(100).optional(),
    studyProgram: z.string().max(100).optional(),
    semester: z.string().max(20).optional(),
    linkedinUrl: z.string().url("Ungültige LinkedIn-URL").optional().or(z.literal("")),
    allergies: z.string().max(500).optional(),
    dietaryRestrictions: z.string().max(500).optional(),
    categoryId: z.string().uuid("Ungültige Kategorie").optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"]
  })

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Passwort erforderlich")
})

// Registration/Team Schemas
export const RegistrationSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: emailSchema,
  categoryId: z.string().uuid(),
  university: z.string().max(100).optional(),
  studyProgram: z.string().max(100).optional(),
  semester: z.string().max(20).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  allergies: z.string().max(500).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  subscribeNewsletter: z.boolean().default(false)
})

// const TeamCreateSchema = z.object({
//   name: z.string().min(1, "Team-Name erforderlich").max(100),
//   description: z.string().max(500).optional(),
//   categoryId: z.string().uuid("Ungültige Kategorie")
// })
//
// const TeamUpdateSchema = z.object({
//   name: z.string().min(1).max(100).optional(),
//   description: z.string().max(500).optional()
// })
//
// const AddTeamMemberSchema = z.object({
//   userId: z.string().uuid("Ungültige Benutzer-ID"),
//   teamId: z.string().uuid("Ungültige Team-ID")
// })

// File Upload Schema (validation in API, but schema for structure)
// const FileUploadSchema = z.object({
//   fileType: z.enum(["pdf", "image", "document"]),
//   maxSize: z.number().int().positive(),
//   allowedMimeTypes: z.array(z.string())
// })

// const ALLOWED_FILE_TYPES = {
//   document: {
//     mimeTypes: ["application/pdf"],
//     extensions: [".pdf"],
//     maxSize: 10 * 1024 * 1024 // 10MB
//   },
//   image: {
//     mimeTypes: ["image/jpeg", "image/png", "image/webp"],
//     extensions: [".jpg", ".jpeg", ".png", ".webp"],
//     maxSize: 5 * 1024 * 1024 // 5MB
//   },
//   spreadsheet: {
//     mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"],
//     extensions: [".xlsx", ".csv"],
//     maxSize: 20 * 1024 * 1024 // 20MB
//   }
// }

// Utility function to validate and parse
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = formatErrors(result)
  return { success: false, errors }
}

function formatErrors(result: any): Record<string, string> {
  const errors: Record<string, string> = {}
  result.error.errors.forEach((err: any) => {
    const path = err.path.join(".")
    errors[path] = err.message
  })

  return errors
}

export function getError(result: any): string {
  const errors: Record<string, string> = formatErrors(result)
  return Object.entries(errors)[0][1]
}
