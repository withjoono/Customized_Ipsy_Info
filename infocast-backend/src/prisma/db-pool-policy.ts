/** Shared DB budget: one connection per ORM, never CPU-count based. */
export function pooledDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const url = new URL(raw);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL required');
  url.searchParams.set('connection_limit', '1');
  url.searchParams.set('pool_timeout', '15');
  url.searchParams.set('connect_timeout', '5');
  url.searchParams.set('application_name', poolApplicationName('prisma'));
  return url.toString();
}
export function poolApplicationName(driver: string): string {
  return `${process.env.GAE_SERVICE || 'infocast-backend'}/${process.env.GAE_VERSION || 'local'}/${driver}`.slice(0, 63);
}
export function prismaPoolOptions() {
  const url = pooledDatabaseUrl(process.env.DATABASE_URL);
  return { datasources: url ? { db: { url } } : undefined };
}
export function pgPoolOptions() {
  return { max: 1, min: 0, idleTimeoutMillis: 10000, connectionTimeoutMillis: 15000,
    application_name: poolApplicationName('pg') };
}
