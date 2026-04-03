import { query } from '@/lib/db';

const optionalCategoryColumns = ['partner_name', 'color', 'icon'] as const;

export type OptionalCategoryColumn = (typeof optionalCategoryColumns)[number];

export async function getAvailableCategoryColumns(): Promise<Set<OptionalCategoryColumn>> {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'categories'
       AND column_name = ANY($1::text[])`,
    [optionalCategoryColumns]
  );

  return new Set(result.rows.map((row) => row.column_name as OptionalCategoryColumn));
}

export function buildCategorySelectClause(availableColumns: Set<OptionalCategoryColumn>) {
  return [
    'id',
    'name',
    'slug',
    'description',
    availableColumns.has('partner_name') ? 'partner_name' : 'NULL::text AS partner_name',
    availableColumns.has('color') ? 'color' : 'NULL::text AS color',
    availableColumns.has('icon') ? 'icon' : 'NULL::text AS icon',
    'is_active',
    'created_at',
    'updated_at',
  ].join(', ');
}