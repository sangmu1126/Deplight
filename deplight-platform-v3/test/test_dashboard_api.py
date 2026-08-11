import asyncio
import importlib
import json
import os
import sys
import unittest
from pathlib import Path

from fastapi import HTTPException


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
dashboard = importlib.import_module("dashboard.api.main")


class FakeTable:
    def __init__(self, item=None, query_items=None):
        self.item = item
        self.query_items = query_items or []
        self.updated = None

    def get_item(self, **kwargs):
        if self.item is None:
            return {}
        return {"Item": self.item}

    def query(self, **kwargs):
        return {"Items": self.query_items}

    def update_item(self, **kwargs):
        self.updated = kwargs
        return {}


class DashboardApiTests(unittest.TestCase):
    def test_repository_normalization(self):
        self.assertEqual(
            dashboard._normalize_repository("https://github.com/example/service.git"),
            "example/service",
        )
        self.assertEqual(dashboard._normalize_repository("example/service"), "example/service")

        with self.assertRaises(HTTPException):
            dashboard._normalize_repository("http://example.com/not-github")

    def test_write_endpoints_are_disabled_without_api_key(self):
        original = dashboard.DASHBOARD_API_KEY
        dashboard.DASHBOARD_API_KEY = None
        try:
            with self.assertRaises(HTTPException) as raised:
                dashboard._require_deployment_auth(None)
            self.assertEqual(raised.exception.status_code, 503)
        finally:
            dashboard.DASHBOARD_API_KEY = original

    def test_service_detail_uses_id_and_queries_composite_analysis_key(self):
        deployment = FakeTable({
            "id": "deploy-1",
            "deployment_id": "deploy-1",
            "analysis_id": "analysis-1",
            "repository": "example/service",
        })
        analysis = FakeTable(query_items=[{
            "analysis_id": "analysis-1",
            "timestamp": "2026-01-01T00:00:00Z",
            "project_info": json.dumps({"framework": "FastAPI"}),
        }])
        old_deployment = dashboard.deployment_table
        old_analysis = dashboard.ai_analysis_table
        dashboard.deployment_table = deployment
        dashboard.ai_analysis_table = analysis
        try:
            response = asyncio.run(dashboard.get_service_detail("deploy-1"))
            self.assertEqual(response["service"]["id"], "deploy-1")
            self.assertEqual(response["service"]["projectInfo"]["framework"], "FastAPI")
        finally:
            dashboard.deployment_table = old_deployment
            dashboard.ai_analysis_table = old_analysis

    def test_complete_updates_existing_deployment(self):
        table = FakeTable({"id": "deploy-1", "status": "in_progress"})
        old_table = dashboard.deployment_table
        old_key = dashboard.DASHBOARD_API_KEY
        dashboard.deployment_table = table
        dashboard.DASHBOARD_API_KEY = "test-key"
        try:
            response = asyncio.run(dashboard.complete_deployment(
                {"deployment_id": "deploy-1"},
                x_api_key="test-key",
            ))
            self.assertTrue(response["success"])
            self.assertEqual(table.updated["Key"], {"id": "deploy-1"})
        finally:
            dashboard.deployment_table = old_table
            dashboard.DASHBOARD_API_KEY = old_key


if __name__ == "__main__":
    unittest.main()
