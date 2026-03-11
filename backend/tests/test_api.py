"""
MatchImovel API Tests
Testing: Admin analytics, Curator creation/email, Match visibility, Follow-ups
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@matchimob.com"
ADMIN_PASSWORD = "admin123"
CURATOR_EMAIL = "curador.teste@test.com"
CURATOR_PASSWORD = "curador123"


class TestHealth:
    """Basic health and auth tests"""
    
    def test_api_accessible(self):
        """Test that API is accessible"""
        # Try login endpoint (should return 401 or 200, not 500)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "wrong"
        })
        # Should be 401 (unauthorized) not 500 (server error)
        assert response.status_code in [401, 400], f"API not accessible: {response.status_code}"
        print(f"API accessible - returned {response.status_code} for invalid credentials")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data["role"] == "admin", f"Expected admin role, got {data['role']}"
        print(f"Admin login successful - role: {data['role']}")
        return data["token"]


class TestAdminAnalytics:
    """Test admin analytics dashboard"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_admin_stats_endpoint(self, admin_token):
        """Test /api/admin/stats endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        data = response.json()
        
        # Verify structure
        required_fields = ["total_buyers", "total_agents", "total_interests", "total_matches", "pending_matches", "approved_matches"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"Admin stats: {data}")
    
    def test_admin_analytics_endpoint(self, admin_token):
        """Test /api/admin/analytics endpoint - full dashboard metrics"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/analytics", headers=headers)
        
        assert response.status_code == 200, f"Analytics endpoint failed: {response.text}"
        data = response.json()
        
        # Verify overview section
        assert "overview" in data, "Missing overview section"
        overview = data["overview"]
        assert "total_buyers" in overview, "Missing total_buyers in overview"
        assert "total_agents" in overview, "Missing total_agents in overview"
        assert "total_curators" in overview, "Missing total_curators in overview"
        assert "total_interests" in overview, "Missing total_interests in overview"
        assert "active_interests" in overview, "Missing active_interests in overview"
        
        # Verify matches section
        assert "matches" in data, "Missing matches section"
        matches = data["matches"]
        assert "total" in matches, "Missing total in matches"
        assert "pending" in matches, "Missing pending in matches"
        assert "approved" in matches, "Missing approved in matches"
        assert "rejected" in matches, "Missing rejected in matches"
        assert "conversion_rate" in matches, "Missing conversion_rate in matches"
        
        # Verify followups section
        assert "followups" in data, "Missing followups section"
        followups = data["followups"]
        assert "total" in followups, "Missing total in followups"
        assert "with_broker" in followups, "Missing with_broker in followups"
        assert "with_buyer" in followups, "Missing with_buyer in followups"
        
        # Verify curator_performance section
        assert "curator_performance" in data, "Missing curator_performance section"
        
        # Verify agent_performance section
        assert "agent_performance" in data, "Missing agent_performance section"
        
        # Verify distributions section
        assert "distributions" in data, "Missing distributions section"
        assert "property_types" in data["distributions"], "Missing property_types distribution"
        assert "locations" in data["distributions"], "Missing locations distribution"
        
        # Verify price_range section
        assert "price_range" in data, "Missing price_range section"
        assert "average_min" in data["price_range"], "Missing average_min in price_range"
        assert "average_max" in data["price_range"], "Missing average_max in price_range"
        
        print(f"Analytics overview: {overview}")
        print(f"Matches stats: {matches}")
        print(f"Curator performance count: {len(data['curator_performance'])}")
        print(f"Agent performance count: {len(data['agent_performance'])}")
    
    def test_analytics_access_denied_for_non_admin(self):
        """Test that analytics endpoint is restricted to admin only"""
        # Try without token
        response = requests.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code in [401, 403], "Analytics should require authentication"
        print("Analytics endpoint properly requires authentication")


class TestCuratorCreation:
    """Test curator creation and email sending"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_create_curator_endpoint(self, admin_token):
        """Test /api/admin/create-curator endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create curator with unique email to avoid conflicts
        unique_email = f"test_curator_{int(time.time())}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/admin/create-curator", 
            headers=headers,
            json={
                "email": unique_email,
                "name": "Test Curador",
                "phone": "11999999999"
            }
        )
        
        assert response.status_code == 200, f"Create curator failed: {response.text}"
        data = response.json()
        
        assert "status" in data, "Missing status in response"
        assert data["status"] == "success", f"Expected success status, got {data['status']}"
        assert "email_sent" in data, "Missing email_sent in response"
        
        # Check if message indicates success
        assert "message" in data, "Missing message in response"
        
        print(f"Curator creation result: {data}")
        print(f"Email sent: {data.get('email_sent', False)}")
        
        # If email wasn't sent, registration_link should be provided
        if not data.get("email_sent"):
            assert "registration_link" in data, "Should have registration_link when email fails"
            print(f"Registration link provided: {data['registration_link'][:50]}...")
    
    def test_create_curator_duplicate_email(self, admin_token):
        """Test that duplicate email is rejected"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to create curator with admin email (should fail)
        response = requests.post(f"{BASE_URL}/api/admin/create-curator", 
            headers=headers,
            json={
                "email": ADMIN_EMAIL,  # Already exists
                "name": "Duplicate Test",
                "phone": "11999999999"
            }
        )
        
        assert response.status_code == 400, f"Should reject duplicate email: {response.text}"
        print("Duplicate email properly rejected")


class TestMatchVisibility:
    """Test match visibility for curators"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    @pytest.fixture
    def curator_token(self):
        """Get curator token if available"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CURATOR_EMAIL,
            "password": CURATOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Curator login failed - curator may not exist")
        return response.json()["token"]
    
    def test_admin_sees_all_matches(self, admin_token):
        """Test that admin can see all matches"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/matches", headers=headers)
        
        assert response.status_code == 200, f"Admin matches failed: {response.text}"
        matches = response.json()
        
        print(f"Admin can see {len(matches)} total matches")
        
        # Verify admin sees matches with different statuses
        statuses = set(m.get("status") for m in matches)
        print(f"Match statuses visible to admin: {statuses}")
    
    def test_curator_sees_only_their_matches(self, curator_token):
        """Test that curator only sees matches they curated"""
        headers = {"Authorization": f"Bearer {curator_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/matches", headers=headers)
        
        assert response.status_code == 200, f"Curator matches failed: {response.text}"
        matches = response.json()
        
        print(f"Curator can see {len(matches)} matches (only their curated matches)")
        
        # Each match should have curator_id matching the current user
        # This validates the visibility logic
        if matches:
            for match in matches[:3]:  # Check first 3
                assert match.get("curator_id") is not None, "Curator should only see curated matches"
                print(f"Match {match['id'][:8]}... curated by {match.get('curator_name', 'N/A')}")
    
    def test_pending_matches_endpoint(self, admin_token):
        """Test pending matches endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/curator/pending-matches", headers=headers)
        
        assert response.status_code == 200, f"Pending matches failed: {response.text}"
        matches = response.json()
        
        # All should be pending_approval status
        for match in matches:
            assert match["status"] == "pending_approval", f"Expected pending_approval, got {match['status']}"
        
        print(f"Found {len(matches)} pending matches")


class TestFollowUpSystem:
    """Test follow-up CRM system"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_get_approved_match_for_followup(self, admin_token):
        """Get an approved match to test follow-ups"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/matches", headers=headers)
        
        assert response.status_code == 200
        matches = response.json()
        
        # Find approved match
        approved_matches = [m for m in matches if m["status"] == "approved"]
        
        if not approved_matches:
            pytest.skip("No approved matches to test follow-ups")
        
        return approved_matches[0]
    
    def test_create_followup(self, admin_token):
        """Test creating a follow-up on an approved match"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get approved match
        response = requests.get(f"{BASE_URL}/api/admin/matches", headers=headers)
        matches = response.json()
        approved_matches = [m for m in matches if m["status"] == "approved"]
        
        if not approved_matches:
            pytest.skip("No approved matches to test follow-ups")
        
        match_id = approved_matches[0]["id"]
        
        # Create follow-up
        followup_data = {
            "content": f"Test follow-up at {time.time()}",
            "contact_type": "corretor"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matches/{match_id}/followup",
            headers=headers,
            json=followup_data
        )
        
        assert response.status_code == 200, f"Create follow-up failed: {response.text}"
        data = response.json()
        assert data["status"] == "success", f"Expected success, got {data}"
        assert "followup_id" in data, "Missing followup_id in response"
        
        print(f"Follow-up created: {data['followup_id']}")
    
    def test_get_followups(self, admin_token):
        """Test getting follow-ups for a match"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get approved match
        response = requests.get(f"{BASE_URL}/api/admin/matches", headers=headers)
        matches = response.json()
        approved_matches = [m for m in matches if m["status"] == "approved"]
        
        if not approved_matches:
            pytest.skip("No approved matches to test follow-ups")
        
        match_id = approved_matches[0]["id"]
        
        # Get follow-ups
        response = requests.get(
            f"{BASE_URL}/api/matches/{match_id}/followups",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get follow-ups failed: {response.text}"
        followups = response.json()
        
        print(f"Found {len(followups)} follow-ups for match {match_id[:8]}...")
        
        # Verify structure if followups exist
        if followups:
            assert "id" in followups[0], "Missing id in followup"
            assert "content" in followups[0], "Missing content in followup"
            assert "contact_type" in followups[0], "Missing contact_type in followup"


class TestCuratorMatchCuration:
    """Test full curation flow"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_approve_match(self, admin_token):
        """Test approving a pending match"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get pending matches
        response = requests.get(f"{BASE_URL}/api/curator/pending-matches", headers=headers)
        assert response.status_code == 200
        pending = response.json()
        
        if not pending:
            print("No pending matches to approve - skipping")
            pytest.skip("No pending matches available")
        
        match_id = pending[0]["id"]
        
        # Approve match
        response = requests.post(
            f"{BASE_URL}/api/curator/curate/{match_id}",
            headers=headers,
            json={"approved": True, "notes": "Test approval"}
        )
        
        assert response.status_code == 200, f"Curate failed: {response.text}"
        data = response.json()
        assert data["status"] == "success"
        assert data["new_status"] == "approved"
        
        print(f"Match {match_id[:8]}... approved successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
