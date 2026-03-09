import requests
import sys
import json
from datetime import datetime

class MatchImobAPITester:
    def __init__(self, base_url="https://find-your-home-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.buyer_token = None
        self.agent_token = None
        self.buyer_id = None
        self.agent_id = None
        self.interest_id = None
        self.match_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test data
        self.buyer_data = {
            "email": f"buyer_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Buyer",
            "phone": "(11) 99999-9999",
            "role": "buyer"
        }
        
        self.agent_data = {
            "email": f"agent_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Agent",
            "phone": "(11) 88888-8888",
            "role": "agent"
        }
        
        self.interest_data = {
            "property_type": "Apartamento",
            "location": "São Paulo",
            "neighborhoods": ["Vila Madalena", "Pinheiros"],
            "min_price": 500000.0,
            "max_price": 800000.0,
            "min_area": 70.0,
            "max_area": 120.0,
            "bedrooms": 3,
            "bathrooms": 2,
            "parking_spaces": 1,
            "features": ["Piscina", "Elevador", "Varanda"],
            "additional_notes": "Preferência por apartamentos com boa localização"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_buyer_registration(self):
        """Test buyer registration"""
        success, response = self.run_test(
            "Buyer Registration",
            "POST",
            "auth/register",
            200,
            data=self.buyer_data
        )
        if success and 'token' in response:
            self.buyer_token = response['token']
            self.buyer_id = response['user_id']
            return True
        return False

    def test_agent_registration(self):
        """Test agent registration"""
        success, response = self.run_test(
            "Agent Registration",
            "POST",
            "auth/register",
            200,
            data=self.agent_data
        )
        if success and 'token' in response:
            self.agent_token = response['token']
            self.agent_id = response['user_id']
            return True
        return False

    def test_buyer_login(self):
        """Test buyer login"""
        login_data = {
            "email": self.buyer_data["email"],
            "password": self.buyer_data["password"]
        }
        success, response = self.run_test(
            "Buyer Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        return success and 'token' in response

    def test_agent_login(self):
        """Test agent login"""
        login_data = {
            "email": self.agent_data["email"],
            "password": self.agent_data["password"]
        }
        success, response = self.run_test(
            "Agent Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        return success and 'token' in response

    def test_create_interest(self):
        """Test creating buyer interest"""
        success, response = self.run_test(
            "Create Interest",
            "POST",
            "buyers/interests",
            200,
            data=self.interest_data,
            token=self.buyer_token
        )
        if success and 'id' in response:
            self.interest_id = response['id']
            return True
        return False

    def test_get_buyer_interests(self):
        """Test retrieving buyer interests"""
        success, response = self.run_test(
            "Get Buyer Interests",
            "GET",
            "buyers/my-interests",
            200,
            token=self.buyer_token
        )
        return success and isinstance(response, list)

    def test_get_buyer_matches(self):
        """Test retrieving buyer matches"""
        success, response = self.run_test(
            "Get Buyer Matches",
            "GET",
            "buyers/my-matches",
            200,
            token=self.buyer_token
        )
        return success and isinstance(response, list)

    def test_agent_search_buyers(self):
        """Test agent searching for buyers"""
        success, response = self.run_test(
            "Agent Search Buyers",
            "GET",
            "agents/buyers",
            200,
            token=self.agent_token
        )
        return success and isinstance(response, list)

    def test_agent_create_match(self):
        """Test agent creating match"""
        if not self.interest_id:
            print("❌ Skipping match creation - no interest ID available")
            return False
            
        match_data = {
            "buyer_id": self.buyer_id,
            "interest_id": self.interest_id
        }
        success, response = self.run_test(
            "Agent Create Match",
            "POST",
            "agents/match",
            200,
            data=match_data,
            token=self.agent_token
        )
        if success and 'id' in response:
            self.match_id = response['id']
            return True
        return False

    def test_agent_get_matches(self):
        """Test agent retrieving their matches"""
        success, response = self.run_test(
            "Agent Get Matches",
            "GET",
            "agents/my-matches",
            200,
            token=self.agent_token
        )
        return success and isinstance(response, list)

    def test_bot_conversation(self):
        """Test bot conversation functionality"""
        if not self.match_id:
            print("❌ Skipping bot conversation - no match ID available")
            return False
            
        message_data = {
            "message": "Olá, tenho um apartamento de 3 quartos em Pinheiros disponível"
        }
        success, response = self.run_test(
            "Bot Send Message",
            "POST",
            f"bot/conversation/{self.match_id}",
            200,
            data=message_data,
            token=self.agent_token
        )
        return success and 'response' in response

    def test_get_bot_conversation(self):
        """Test retrieving bot conversation"""
        if not self.match_id:
            print("❌ Skipping bot conversation retrieval - no match ID available")
            return False
            
        success, response = self.run_test(
            "Get Bot Conversation",
            "GET",
            f"bot/conversation/{self.match_id}",
            200,
            token=self.agent_token
        )
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access scenarios"""
        print("\n🔐 Testing Authorization...")
        
        # Test accessing protected endpoints without token
        success, _ = self.run_test(
            "Unauthorized Interest Creation",
            "POST",
            "buyers/interests",
            401,
            data=self.interest_data
        )
        
        # Test accessing buyer endpoints with agent token
        success2, _ = self.run_test(
            "Agent Accessing Buyer Endpoint",
            "POST",
            "buyers/interests",
            403,
            data=self.interest_data,
            token=self.agent_token
        )
        
        return success and success2

def main():
    """Main test execution"""
    print("🚀 Starting Match Imob API Tests")
    print("=" * 50)
    
    tester = MatchImobAPITester()
    
    # Test sequence
    tests = [
        ("Buyer Registration", tester.test_buyer_registration),
        ("Agent Registration", tester.test_agent_registration),
        ("Buyer Login", tester.test_buyer_login),
        ("Agent Login", tester.test_agent_login),
        ("Create Interest", tester.test_create_interest),
        ("Get Buyer Interests", tester.test_get_buyer_interests),
        ("Agent Search Buyers", tester.test_agent_search_buyers),
        ("Agent Create Match", tester.test_agent_create_match),
        ("Get Buyer Matches", tester.test_get_buyer_matches),
        ("Agent Get Matches", tester.test_agent_get_matches),
        ("Bot Conversation", tester.test_bot_conversation),
        ("Get Bot Conversation", tester.test_get_bot_conversation),
        ("Authorization Tests", tester.test_unauthorized_access),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"  - {test}")
    else:
        print("\n✅ All tests passed!")
    
    print(f"\n📝 Summary:")
    print(f"  - Registration: {'✅' if 'Buyer Registration' not in failed_tests and 'Agent Registration' not in failed_tests else '❌'}")
    print(f"  - Authentication: {'✅' if 'Buyer Login' not in failed_tests and 'Agent Login' not in failed_tests else '❌'}")
    print(f"  - Interest Management: {'✅' if 'Create Interest' not in failed_tests and 'Get Buyer Interests' not in failed_tests else '❌'}")
    print(f"  - Matching System: {'✅' if 'Agent Create Match' not in failed_tests else '❌'}")
    print(f"  - Bot Integration: {'✅' if 'Bot Conversation' not in failed_tests else '❌'}")
    print(f"  - Authorization: {'✅' if 'Authorization Tests' not in failed_tests else '❌'}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())