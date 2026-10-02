/**
 * Cek apakah request datang dari Vercel Cron.
 *
 * Vercel Cron otomatis mengirim:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Env `CRON_SECRET` di-set di Vercel → otomatis dipakai oleh platform
 * untuk sign request cron. Kalau `CRON_SECRET` gak ada, semua request
 * dianggap bukan cron (fail-closed).
 */
export function isAuthorizedCron(req: Request): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false
    return req.headers.get('authorization') === `Bearer ${secret}`
}