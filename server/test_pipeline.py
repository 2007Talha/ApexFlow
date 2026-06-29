import unittest
import pandas as pd
from main import generate_synthetic_telemetry, routes_db, get_live_vehicles, run_benchmark, get_ai_recommendation, sync_cloud_assets, BenchmarkRequest, QueryAgentRequest

class TestApexFlowBackend(unittest.TestCase):
    
    def test_telemetry_generation(self):
        """Test that synthetic telemetry generates correct columns and size"""
        size = 50000
        df = generate_synthetic_telemetry(size)
        
        self.assertIsInstance(df, pd.DataFrame)
        self.assertEqual(len(df), size)
        
        expected_cols = ["vehicle_id", "route_id", "speed", "battery_level", "latitude", "longitude", "delay_seconds", "timestamp"]
        for col in expected_cols:
            self.assertIn(col, df.columns)

    def test_live_vehicles(self):
        """Test the live vehicle telemetry stream endpoint returns valid data"""
        res = get_live_vehicles()
        self.assertEqual(res["status"], "success")
        self.assertGreater(res["count"], 0)
        self.assertEqual(len(res["vehicles"]), res["count"])
        
        # Check vehicle structure
        v = res["vehicles"][0]
        self.assertIn("id", v)
        self.assertIn("route_name", v)
        self.assertIn("lat", v)
        self.assertIn("lon", v)
        self.assertIn("speed", v)
        self.assertIn("battery", v)

    def test_gemini_agent(self):
        """Test that the Gemini Agent response structure is valid for various keywords"""
        # Test delay query
        req_delay = QueryAgentRequest(prompt="Show traffic delay issues")
        res_delay = get_ai_recommendation(req_delay)
        
        self.assertEqual(res_delay["status"], "success")
        self.assertIn("Gemini Dispatch Alert", res_delay["title"])
        self.assertGreater(len(res_delay["recommendations"]), 0)
        self.assertIn("table", res_delay)
        self.assertEqual(res_delay["table"]["headers"][0], "Vehicle ID")
        
        # Test battery query
        req_bat = QueryAgentRequest(prompt="EV batteries report")
        res_bat = get_ai_recommendation(req_bat)
        self.assertIn("Battery & charging", res_bat["title"])
        
        # Test default query
        req_def = QueryAgentRequest(prompt="hello")
        res_def = get_ai_recommendation(req_def)
        self.assertIn("General Fleet Status", res_def["title"])

    def test_gcp_sync(self):
        """Test that GCP sync returns storage and BigQuery details"""
        res = sync_cloud_assets()
        self.assertEqual(res["status"], "success")
        self.assertIn("storage", res)
        self.assertIn("analytics", res)
        self.assertIn("bytes_synced", res["storage"])
        self.assertIn("rows_appended", res["analytics"])

if __name__ == '__main__':
    unittest.main()
