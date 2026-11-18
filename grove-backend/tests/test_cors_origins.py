import pytest

import server


def test_local_development_without_a_setting_allows_any_address():
    assert server.cors_origins({}) == ['*']


def test_a_list_is_split_and_spaces_after_commas_are_ignored():
    env = {'CORS_ORIGINS': 'https://app.floragrove.app, https://floragrove.app'}
    assert server.cors_origins(env) == ['https://app.floragrove.app', 'https://floragrove.app']


def test_production_refuses_any_address():
    with pytest.raises(RuntimeError):
        server.cors_origins({'APP_ENV': 'production', 'CORS_ORIGINS': '*'})


def test_production_refuses_a_missing_setting():
    with pytest.raises(RuntimeError):
        server.cors_origins({'APP_ENV': 'production'})


def test_production_accepts_the_app_address():
    env = {'APP_ENV': 'production', 'CORS_ORIGINS': 'https://app.floragrove.app'}
    assert server.cors_origins(env) == ['https://app.floragrove.app']
