const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm');
const ts = require('typescript');
const helper = "src/prisma/db-pool-policy.ts";
const source = fs.readFileSync(path.join(__dirname, helper), 'utf8');
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exp={}; const env={GAE_SERVICE:"infocast-backend",GAE_VERSION:'ci-test',DATABASE_URL:'postgresql://test:p%40ss@localhost/db?schema=owned&host=%2Fcloudsql%2Ftest&connection_limit=99'};
vm.runInNewContext(code,{exports:exp,URL,process:{env}});
const u=new URL(exp.pooledDatabaseUrl(env.DATABASE_URL));
assert.equal(u.searchParams.get('connection_limit'),'1');assert.equal(u.searchParams.get('schema'),'owned');assert.equal(u.searchParams.get('host'),'/cloudsql/test');assert.equal(u.password,'p%40ss');
assert.equal(u.searchParams.get('pool_timeout'),'15');assert.equal(u.searchParams.get('connect_timeout'),'5');
assert.equal(new URL(exp.prismaPoolOptions().datasources.db.url).searchParams.get('connection_limit'),'1');
assert.equal(exp.pgPoolOptions().max,1);assert.equal(exp.pgPoolOptions().min,0);assert.equal(exp.pgPoolOptions().idleTimeoutMillis,10000);assert.equal(exp.pgPoolOptions().connectionTimeoutMillis,15000);
assert.throws(()=>exp.pooledDatabaseUrl('mysql://localhost/db'));
const owner=fs.readFileSync(path.join(__dirname,"src/prisma/prisma.service.ts"),'utf8');
assert.match(owner,/import .* from '.\/db-pool-policy(?:\.js)?'/);
assert.match(owner, /(?:super\(\{\s*\.\.\.prismaPoolOptions\(\)|super\(prismaPoolOptions\(\)\)|new PrismaClient\(prismaPoolOptions\(\)\))/);

console.log('PASS: runtime URL and pg pool limits, source integration');
