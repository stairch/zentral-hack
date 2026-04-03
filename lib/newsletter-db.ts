import { query } from '@/lib/db';

export interface NewsletterColumnSupport {
  weeklyUpdatesSubscribed: boolean;
  updatedAt: boolean;
}

let cachedSupport: NewsletterColumnSupport | null = null;

export async function getNewsletterColumnSupport(): Promise<NewsletterColumnSupport> {
  if (cachedSupport) {
    return cachedSupport;
  }

  const expectedColumns = ['weekly_updates_subscribed', 'updated_at'];
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'newsletter_subscribers'
       AND column_name = ANY($1::text[])`,
    [expectedColumns]
  );

  const columns = new Set<string>(result.rows.map((row: { column_name: string }) => row.column_name));
  cachedSupport = {
    weeklyUpdatesSubscribed: columns.has('weekly_updates_subscribed'),
    updatedAt: columns.has('updated_at'),
  };

  return cachedSupport;
}

export function getWeeklyEligibleFilter(columnSupport: NewsletterColumnSupport): string {
  if (columnSupport.weeklyUpdatesSubscribed) {
    return 'subscribed = true AND weekly_updates_subscribed = true';
  }
  return 'subscribed = true';
}
