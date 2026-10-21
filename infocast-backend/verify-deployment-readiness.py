"""Read-only deployment readiness check. Never prints configuration or tokens."""
import json, pathlib, subprocess, urllib.request
import yaml
PROJECT = 'ts-back-nest-479305'
def check():
    cfg = yaml.safe_load(pathlib.Path('app.yaml').read_text())
    assert cfg['service'] == 'infocast-backend'
    assert cfg['instance_class'] == 'F1'
    assert cfg['automatic_scaling']['min_instances'] == 0
    assert cfg['automatic_scaling']['max_instances'] == 1
    scripts = json.loads(pathlib.Path('package.json').read_text()).get('scripts', {})
    assert scripts.get('gcp-build') and scripts.get('start')
    for name in ('gcp-build', 'start', 'prestart', 'postinstall', 'prepare'):
        assert not any(x in scripts.get(name, '') for x in ('db push', 'migrate reset', 'migrate deploy', 'seed'))
    token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()
    def request(url, body=None):
        req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)
    service = request('https://appengine.googleapis.com/v1/apps/'+PROJECT+'/services/'+cfg['service'])
    assert service['id'] == cfg['service']
    required = ['appengine.applications.get','appengine.versions.create','appengine.services.update','cloudbuild.builds.create','cloudbuild.builds.get','storage.buckets.get','storage.objects.create','storage.objects.get','storage.objects.list']
    granted = request('https://cloudresourcemanager.googleapis.com/v1/projects/'+PROJECT+':testIamPermissions', {'permissions':required}).get('permissions',[])
    missing = sorted(set(required)-set(granted))
    if missing:
        print('Missing deployment permissions: '+', '.join(missing))
        return False
    sa = cfg['service_account']
    allowed = request('https://iam.googleapis.com/v1/projects/-/serviceAccounts/'+sa+':testIamPermissions', {'permissions':['iam.serviceAccounts.actAs']}).get('permissions',[])
    assert 'iam.serviceAccounts.actAs' in allowed
    files = subprocess.check_output(['gcloud','meta','list-files-for-upload'],text=True).splitlines()
    assert files and not any('gha-creds-' in f or pathlib.PurePosixPath(f).name.startswith('.env') or 'service-account-key' in f for f in files)
    print('PASS: authenticated service access, deployment permissions, runtime actAs, source upload exclusions, unchanged instance class, pool budget. No deployment/build/database operation performed.')
    return True
try:
    ok = check()
except Exception:
    print('Deployment preflight failed; secret configuration and tokens are not printed.')
    ok = False
raise SystemExit(0 if ok else 1)
