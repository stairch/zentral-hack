import { query } from "@/lib/db"
import { withCategoryPartnerAuth, AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { buildCategorySelectClause, getAvailableCategoryColumns } from "@/lib/category-db"
import { categoryIconMap } from "@/lib/category-config"
import { normalizeHexColor } from "@/lib/helpers"

export async function GET() {
  try {
    const availableColumns = await getAvailableCategoryColumns()
    const result = await query(
      `SELECT ${buildCategorySelectClause(availableColumns)}
       FROM categories
       WHERE is_active = true
       ORDER BY name`
    )
    return successResponse({ categories: result.rows })
  } catch (error) {
    console.error("Categories fetch error:", error)
    return serverError("Kategorien konnten nicht geladen werden")
  }
}

async function putHandler(req: AuthenticatedRequest) {
  try {
    const {
      id,
      name,
      nameEn,
      description,
      descriptionEn,
      partnerName,
      partnerNameEn,
      color,
      icon,
      challengeDescription,
      challengeDescriptionEn,
      showChallengeDescription,
      prize,
      targetGroup,
      targetGroupEn
    } = await req.json()

    if (!id) {
      return validationError("Category ID required")
    }

    if (typeof name === "string" && name.trim().length === 0) {
      return validationError("German category name required")
    }

    if (typeof nameEn === "string" && nameEn.trim().length === 0) {
      return validationError("English category name required")
    }

    if (typeof description === "string" && description.trim().length === 0) {
      return validationError("German category description required")
    }

    if (typeof descriptionEn === "string" && descriptionEn.trim().length === 0) {
      return validationError("English category description required")
    }

    if (typeof partnerName === "string" && partnerName.trim().length === 0) {
      return validationError("German partner name required")
    }

    if (typeof partnerNameEn === "string" && partnerNameEn.trim().length === 0) {
      return validationError("English partner name required")
    }

    if (showChallengeDescription === true) {
      if (typeof challengeDescription !== "string" || challengeDescription.trim().length === 0) {
        return validationError("German challenge description required")
      }

      if (typeof challengeDescriptionEn !== "string" || challengeDescriptionEn.trim().length === 0) {
        return validationError("English challenge description required")
      }
    }

    if (typeof icon === "string" && !(icon in categoryIconMap)) {
      return validationError("Invalid category icon")
    }

    if (req.user?.role === "category_partner" && req.user.categoryId !== id) {
      return validationError("Cannot edit other categories")
    }

    const availableColumns = await getAvailableCategoryColumns()
    const fieldAssignments: string[] = []
    const values: Array<string | null> = []

    if (typeof name === "string") {
      values.push(name.trim())
      fieldAssignments.push(`name = $${values.length}`)
    }

    if (availableColumns.has("name_en") && typeof nameEn === "string") {
      values.push(nameEn.trim() || null)
      fieldAssignments.push(`name_en = $${values.length}`)
    }

    if (typeof description === "string") {
      values.push(description.trim())
      fieldAssignments.push(`description = $${values.length}`)
    }

    if (availableColumns.has("description_en") && typeof descriptionEn === "string") {
      values.push(descriptionEn.trim() || null)
      fieldAssignments.push(`description_en = $${values.length}`)
    }

    if (availableColumns.has("partner_name") && typeof partnerName === "string") {
      values.push(partnerName.trim() || null)
      fieldAssignments.push(`partner_name = $${values.length}`)
    }

    if (availableColumns.has("partner_name_en") && typeof partnerNameEn === "string") {
      values.push(partnerNameEn.trim() || null)
      fieldAssignments.push(`partner_name_en = $${values.length}`)
    }

    if (availableColumns.has("color") && typeof color === "string") {
      values.push(normalizeHexColor(color))
      fieldAssignments.push(`color = $${values.length}`)
    }

    if (availableColumns.has("icon") && typeof icon === "string") {
      values.push(icon)
      fieldAssignments.push(`icon = $${values.length}`)
    }

    if (
      availableColumns.has("challenge_description") &&
      (typeof challengeDescription === "string" || challengeDescription === null)
    ) {
      const normalizedChallengeDescription =
        typeof challengeDescription === "string" ? challengeDescription.trim() || null : null

      values.push(normalizedChallengeDescription)
      fieldAssignments.push(`challenge_description = $${values.length}`)
    }

    if (
      availableColumns.has("challenge_description_en") &&
      (typeof challengeDescriptionEn === "string" || challengeDescriptionEn === null)
    ) {
      const normalizedChallengeDescriptionEn =
        typeof challengeDescriptionEn === "string" ? challengeDescriptionEn.trim() || null : null

      values.push(normalizedChallengeDescriptionEn)
      fieldAssignments.push(`challenge_description_en = $${values.length}`)
    }

    if (availableColumns.has("show_challenge_description") && typeof showChallengeDescription === "boolean") {
      values.push(showChallengeDescription ? "true" : "false")
      fieldAssignments.push(`show_challenge_description = $${values.length}::boolean`)
    }

    if (availableColumns.has("prize") && (typeof prize === "string" || prize === null)) {
      values.push(typeof prize === "string" ? prize.trim() || null : null)
      fieldAssignments.push(`prize = $${values.length}`)
    }

    if (availableColumns.has("target_group") && (typeof targetGroup === "string" || targetGroup === null)) {
      values.push(typeof targetGroup === "string" ? targetGroup.trim() || null : null)
      fieldAssignments.push(`target_group = $${values.length}`)
    }

    if (
      availableColumns.has("target_group_en") &&
      (typeof targetGroupEn === "string" || targetGroupEn === null)
    ) {
      values.push(typeof targetGroupEn === "string" ? targetGroupEn.trim() || null : null)
      fieldAssignments.push(`target_group_en = $${values.length}`)
    }

    if (fieldAssignments.length === 0) {
      return validationError("No valid category fields provided")
    }

    fieldAssignments.push("updated_at = NOW()")
    values.push(id)

    const result = await query(
      `UPDATE categories
       SET ${fieldAssignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${buildCategorySelectClause(availableColumns)}`,
      values
    )

    if (result.rows.length === 0) {
      return validationError("Category not found")
    }

    return successResponse({ category: result.rows[0] })
  } catch (error) {
    console.error("Category update error:", error)
    return serverError()
  }
}

export const PUT = withCategoryPartnerAuth(putHandler)
