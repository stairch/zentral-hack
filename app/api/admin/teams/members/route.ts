import { query } from '@/lib/db';
import { withCategoryPartnerAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, validationError, serverError } from '@/lib/api';

async function handleGet(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const availableForCategory = searchParams.get('availableForCategory');

    // Return users registered for a category who are NOT yet in any team
    if (availableForCategory) {
      if (req.user?.role === 'category_partner' && req.user.categoryId !== availableForCategory) {
        return validationError('Cannot view users from other categories');
      }
      const result = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name
         FROM users u
         JOIN registrations r ON u.id = r.user_id AND r.category_id = $1
         WHERE u.id NOT IN (
           SELECT tm.user_id FROM team_members tm
           JOIN teams t ON tm.team_id = t.id
           WHERE t.category_id = $1
         )
         ORDER BY u.last_name, u.first_name`,
        [availableForCategory]
      );
      return successResponse({ users: result.rows });
    }

    if (!teamId) {
      return validationError('Team ID required');
    }

    if (req.user?.role === 'category_partner') {
      const teamCheck = await query('SELECT category_id FROM teams WHERE id = $1', [teamId]);
      if (teamCheck.rows.length === 0) return validationError('Team not found');
      if (teamCheck.rows[0].category_id !== req.user.categoryId) {
        return validationError('Cannot view members of teams from other categories');
      }
    }

    const result = await query(
      `SELECT tm.id, tm.user_id, tm.role as member_role, tm.created_at,
              u.email, u.first_name, u.last_name
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.created_at ASC`,
      [teamId]
    );

    return successResponse({ members: result.rows });
  } catch (error) {
    console.error('[Team Members] GET Error:', error);
    return serverError();
  }
}

async function handlePost(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { teamId, userId: directUserId, userEmail, role } = body;

    if (!teamId || (!directUserId && !userEmail)) {
      return validationError('Team ID and user (ID or email) required');
    }

    const teamCheck = await query('SELECT category_id FROM teams WHERE id = $1', [teamId]);
    if (teamCheck.rows.length === 0) return validationError('Team not found');

    if (req.user?.role === 'category_partner' && teamCheck.rows[0].category_id !== req.user.categoryId) {
      return validationError('Cannot add members to teams from other categories');
    }

    let userId: string;
    let userInfo: { email: string; first_name: string; last_name: string };

    if (directUserId) {
      const userResult = await query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [directUserId]);
      if (userResult.rows.length === 0) return validationError('Benutzer nicht gefunden');
      userId = userResult.rows[0].id;
      userInfo = userResult.rows[0];
    } else {
      const userResult = await query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [userEmail.toLowerCase()]);
      if (userResult.rows.length === 0) return validationError('Benutzer mit dieser E-Mail nicht gefunden');
      userId = userResult.rows[0].id;
      userInfo = userResult.rows[0];
    }

    const existing = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    if (existing.rows.length > 0) {
      return validationError('Benutzer ist bereits Mitglied dieses Teams');
    }

    const result = await query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING id',
      [teamId, userId, role || 'member']
    );

    return successResponse({
      member: {
        id: result.rows[0].id,
        user_id: userId,
        email: userInfo.email,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        member_role: role || 'member',
      }
    }, 201);
  } catch (error) {
    console.error('[Team Members] POST Error:', error);
    return serverError();
  }
}

async function handleDelete(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const teamId = searchParams.get('teamId');

    if (!memberId || !teamId) {
      return validationError('Member ID and Team ID required');
    }

    // Verify access
    if (req.user?.role === 'category_partner') {
      const teamCheck = await query('SELECT category_id FROM teams WHERE id = $1', [teamId]);
      if (teamCheck.rows.length === 0) return validationError('Team not found');
      if (teamCheck.rows[0].category_id !== req.user.categoryId) {
        return validationError('Cannot remove members from teams in other categories');
      }
    }

    await query('DELETE FROM team_members WHERE id = $1 AND team_id = $2', [memberId, teamId]);
    return successResponse({ message: 'Member removed' });
  } catch (error) {
    console.error('[Team Members] DELETE Error:', error);
    return serverError();
  }
}

export const GET = withCategoryPartnerAuth(handleGet);
export const POST = withCategoryPartnerAuth(handlePost);
export const DELETE = withCategoryPartnerAuth(handleDelete);
