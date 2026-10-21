"""Apply non-secret infocast-backend limits after generating app.yaml from Secret Manager.

Never prints the supplied configuration or database URL.
"""
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import yaml


def apply_policy(config):
    if config.get('service', 'default') != 'infocast-backend':
        raise ValueError('Refusing to modify another App Engine service')
    if 'basic_scaling' in config or 'manual_scaling' in config:
        raise ValueError('Expected automatic scaling')
    scaling = config.setdefault('automatic_scaling', {})
    scaling.update(max_instances=1, min_instances=0, min_idle_instances=0,
                   max_idle_instances=1)
    env = config.setdefault('env_variables', {})
    raw = env.get('DATABASE_URL')
    if not raw:
        raise ValueError('DATABASE_URL is required')
    url = urlsplit(raw)
    if url.scheme not in ('postgres', 'postgresql'):
        raise ValueError('PostgreSQL is required')
    query = dict(parse_qsl(url.query, keep_blank_values=True))
    query.update(connection_limit='1', pool_timeout='15', connect_timeout='5')
    env['DATABASE_URL'] = urlunsplit(url._replace(query=urlencode(query)))
    return config


if __name__ == '__main__':
    import argparse, copy
    parser = argparse.ArgumentParser()
    parser.add_argument('path')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        path = Path(args.path)
        original = yaml.safe_load(path.read_text(encoding='utf-8'))
        expected = apply_policy(copy.deepcopy(original))
        if args.check:
            if original != expected:
                raise ValueError('Connection policy is not applied')
        else:
            path.write_text(yaml.safe_dump(expected, allow_unicode=True), encoding='utf-8')
    except Exception:
        print('Connection policy validation failed; configuration values are not printed.', file=sys.stderr)
        raise SystemExit(1)
    print('Connection policy verified: pool=1, min=0, max=1.')
