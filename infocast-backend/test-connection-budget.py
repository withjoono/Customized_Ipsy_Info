import copy, importlib.util, pathlib, subprocess, sys, tempfile
from urllib.parse import urlsplit, parse_qs
import yaml
HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('policy', HERE / 'apply-connection-policy.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
SERVICE = 'infocast-backend'
cfg = {'service': SERVICE, 'instance_class': 'F2', 'automatic_scaling': {'min_instances': 3, 'max_instances': 20}, 'env_variables': {'DATABASE_URL': 'postgresql://test:p%40ss@localhost/db?schema=owned&host=%2Fcloudsql%2Ftest&connection_limit=99', 'KEEP': 'unchanged'}}
a = m.apply_policy(copy.deepcopy(cfg)); q = parse_qs(urlsplit(a['env_variables']['DATABASE_URL']).query)
assert q['connection_limit']==['1'] and q['pool_timeout']==['15'] and q['connect_timeout']==['5']
assert q['schema']==['owned'] and q['host']==['/cloudsql/test'] and urlsplit(a['env_variables']['DATABASE_URL']).password=='p%40ss'
assert a['instance_class']=='F2' and a['env_variables']['KEEP']=='unchanged'
assert a['automatic_scaling']['min_instances']==0 and a['automatic_scaling']['max_instances']==1
assert a['automatic_scaling']['min_idle_instances']==0 and a['automatic_scaling']['max_idle_instances']==1
assert m.apply_policy(copy.deepcopy(a))==a
for bad in [{'service':'wrong'}, {'service':SERVICE,'basic_scaling':{}}, {'service':SERVICE,'manual_scaling':{}}, {'service':SERVICE,'env_variables':{}}, {'service':SERVICE,'env_variables':{'DATABASE_URL':'mysql://localhost/db'}}]:
    try: m.apply_policy(bad)
    except (ValueError, TypeError): pass
    else: raise AssertionError('Unsafe config accepted')
with tempfile.TemporaryDirectory() as temp:
    p=pathlib.Path(temp)/'app.yaml';p.write_text(yaml.safe_dump(cfg),encoding='utf8')
    cmd=[sys.executable,str(HERE/'apply-connection-policy.py'),str(p)]
    assert subprocess.run(cmd+['--check'],capture_output=True).returncode==1
    subprocess.run(cmd,check=True)
    subprocess.run(cmd+['--check'],check=True)
repo=HERE
while not (repo/'.github/workflows/deploy-backend.yml').exists():
    if repo==repo.parent:raise AssertionError('Missing deployment workflow')
    repo=repo.parent
workflow=yaml.safe_load((repo/'.github/workflows/deploy-backend.yml').read_text(encoding='utf8'))
steps=workflow['jobs']['deploy']['steps']
pidx=next(i for i,x in enumerate(steps) if x.get('name')=='Enforce shared DB connection budget')
didx=next(i for i,x in enumerate(steps) if 'gcloud app deploy' in x.get('run',''))
assert pidx<didx and 'if' not in steps[pidx] and not steps[pidx].get('continue-on-error')
assert 'apply-connection-policy.py app.yaml --check' in steps[pidx]['run']
print('PASS: service isolation, preserved URL/schema, strict limits, rejection tests, deployment gate')
