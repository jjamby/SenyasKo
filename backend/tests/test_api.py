from fastapi.testclient import TestClient
from app import create_app


def client(tmp_path):
    return TestClient(create_app(tmp_path / "test.sqlite3"))


def signup(api, username, email):
    response = api.post("/api/auth/signup", json={"username": username, "email": email, "password": "a-good-password"})
    assert response.status_code == 201, response.text
    return response.json()


def test_accounts_sessions_and_private_routes(tmp_path):
    api = client(tmp_path)
    assert api.get("/api/auth/me").status_code == 401
    user = signup(api, "Alice", "alice@example.com")
    assert user["username"] == "Alice"
    assert api.get("/api/auth/me").json()["id"] == user["id"]
    assert api.post("/api/auth/signup", json={"username": "Alice", "email": "another@example.com", "password": "a-good-password"}).status_code == 409
    assert api.post("/api/auth/logout").status_code == 204
    assert api.get("/api/messages").status_code == 401
    assert api.post("/api/auth/login", json={"identifier": "alice@example.com", "password": "bad-password"}).status_code == 401
    assert api.post("/api/auth/login", json={"identifier": "Alice", "password": "a-good-password"}).status_code == 200
    assert api.get("/api/auth/me").json()["username"] == "Alice"


def test_users_can_message_each_other_and_only_recipient_reads(tmp_path):
    alice = client(tmp_path)
    bob = client(tmp_path)
    signup(alice, "Alice", "alice@example.com")
    signup(bob, "Bob", "bob@example.com")
    assert any(user["username"] == "Bob" for user in alice.get("/api/users?q=bo").json())
    sent = alice.post("/api/messages", json={"recipient": "Bob", "subject": "Hello", "body": "Let's practice"})
    assert sent.status_code == 201, sent.text
    message_id = sent.json()["id"]
    assert alice.get("/api/messages?folder=inbox").json() == []
    assert alice.get("/api/messages?folder=sent").json()[0]["id"] == message_id
    assert alice.post(f"/api/messages/{message_id}/read").status_code == 404
    inbox = bob.get("/api/messages").json()
    assert len(inbox) == 1 and inbox[0]["sender"] == "Alice" and inbox[0]["unread"]
    assert bob.post(f"/api/messages/{message_id}/read").json()["unread"] is False
    assert bob.get("/api/messages").json()[0]["unread"] is False
    assert alice.post("/api/messages", json={"recipient": "Nobody", "subject": "Hello", "body": "Hi"}).status_code == 404


def test_drafts_and_progress_are_private_and_persistent(tmp_path):
    alice = client(tmp_path)
    bob = client(tmp_path)
    signup(alice, "Alice", "alice@example.com")
    signup(bob, "Bob", "bob@example.com")
    draft = alice.post("/api/drafts", json={"recipient": "Bob", "subject": "Later", "body": "Hello"})
    assert draft.status_code == 201
    assert len(alice.get("/api/drafts").json()) == 1
    assert bob.get("/api/drafts").json() == []
    assert bob.put(f"/api/drafts/{draft.json()['id']}", json={"recipient": "Bob", "subject": "Stolen", "body": "No"}).status_code == 404
    updated = alice.put(f"/api/drafts/{draft.json()['id']}", json={"recipient": "Bob", "subject": "Updated", "body": "Hello"})
    assert updated.status_code == 200 and updated.json()["subject"] == "Updated"
    assert alice.delete(f"/api/drafts/{draft.json()['id']}").status_code == 204
    assert alice.get("/api/drafts").json() == []
    assert bob.post("/api/progress/complete", json={"collection_id": "alphabet", "lesson": "Letters A–E"}).status_code == 200
    assert bob.post("/api/progress/complete", json={"collection_id": "alphabet", "lesson": "Letters A–E"}).status_code == 200
    assert bob.get("/api/progress").json()["collections"]["alphabet"] == 20
    assert alice.get("/api/progress").json()["collections"]["alphabet"] == 0
    assert bob.post("/api/progress/complete", json={"collection_id": "alphabet", "lesson": "Invalid"}).status_code == 422


def test_cross_site_write_is_rejected(tmp_path):
    api = client(tmp_path)
    signup(api, "Alice", "alice@example.com")
    response = api.post("/api/drafts", json={"recipient": "", "subject": "", "body": ""}, headers={"Origin": "https://other.example"})
    assert response.status_code == 403
    assert api.get("/api/drafts").json() == []


def test_blank_message_fields_are_rejected(tmp_path):
    api = client(tmp_path)
    signup(api, "Alice", "alice@example.com")
    assert api.post("/api/messages", json={"recipient": "Alice", "subject": "   ", "body": "Hi"}).status_code == 422
