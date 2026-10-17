"""SenyasKo account, messaging, and learner-progress API."""

import hashlib
import hmac
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import Cookie, Depends, FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field


LESSONS = {
    "alphabet": ["Letters A–E", "Letters F–J", "Letters K–O", "Letters P–T", "Letters U–Z"],
    "numbers": ["Numbers 1–5", "Numbers 6–10", "Everyday numbers"],
    "greetings": ["Hello & goodbye", "Good morning", "How are you?"],
    "expressions": ["Everyday feelings", "Showing appreciation", "Asking for help"],
    "introductions": ["My name is…", "Nice to meet you", "A little about me"],
}
COOKIE = "senyasko_session"
SESSION_DAYS = 14


class Signup(BaseModel):
    username: str = Field(min_length=2, max_length=40)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class Login(BaseModel):
    identifier: str
    password: str


class MessageInput(BaseModel):
    recipient: str = Field(min_length=1, max_length=100)
    subject: str = Field(min_length=1, max_length=150)
    body: str = Field(min_length=1, max_length=5000)


class DraftInput(BaseModel):
    recipient: str = Field(default="", max_length=100)
    subject: str = Field(default="", max_length=150)
    body: str = Field(default="", max_length=5000)


class CompletionInput(BaseModel):
    collection_id: str
    lesson: str


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, digest = stored.split(":", 1)
    return hmac.compare_digest(password_hash(password, bytes.fromhex(salt)).split(":", 1)[1], digest)


def create_app(db_path: Path | str | None = None) -> FastAPI:
    path = Path(db_path or os.environ.get("SENYASKO_DB", Path(__file__).with_name("data.sqlite3")))
    path.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def db():
        connection = sqlite3.connect(path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    with db() as connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                email TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY, sender_id INTEGER NOT NULL REFERENCES users(id),
                recipient_id INTEGER NOT NULL REFERENCES users(id), subject TEXT NOT NULL,
                body TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT
            );
            CREATE INDEX IF NOT EXISTS messages_recipient ON messages(recipient_id, created_at);
            CREATE INDEX IF NOT EXISTS messages_sender ON messages(sender_id, created_at);
            CREATE TABLE IF NOT EXISTS drafts (
                id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS completed_lessons (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                collection_id TEXT NOT NULL, lesson TEXT NOT NULL, completed_at TEXT NOT NULL,
                PRIMARY KEY (user_id, collection_id, lesson)
            );
        """)

    app = FastAPI(title="SenyasKo API")

    @app.middleware("http")
    async def check_origin(request: Request, call_next):
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            origin = request.headers.get("origin")
            allowed = {"http://localhost:5173", "http://127.0.0.1:5173", str(request.base_url).rstrip("/")}
            allowed.update(value.strip() for value in os.environ.get("SENYASKO_ALLOWED_ORIGINS", "").split(",") if value.strip())
            if origin and origin not in allowed:
                return Response(status_code=403, content="Untrusted origin")
        return await call_next(request)

    def public_user(row):
        return {"id": row["id"], "username": row["username"], "email": row["email"]}

    def current_user(senyasko_session: str | None = Cookie(default=None)):
        if not senyasko_session:
            raise HTTPException(401, "Sign in required")
        token_hash = hashlib.sha256(senyasko_session.encode()).hexdigest()
        with db() as connection:
            row = connection.execute("""
                SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
                WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """, (token_hash, now())).fetchone()
        if row is None:
            raise HTTPException(401, "Session expired or invalid")
        return public_user(row)

    def start_session(connection, user_id, response):
        token = secrets.token_urlsafe(32)
        expires = (datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)).isoformat()
        connection.execute("INSERT INTO sessions VALUES (?, ?, ?)", (hashlib.sha256(token.encode()).hexdigest(), user_id, expires))
        response.set_cookie(COOKIE, token, max_age=SESSION_DAYS * 86400, httponly=True,
                            secure=os.environ.get("SENYASKO_COOKIE_SECURE") == "1", samesite="lax", path="/")

    def message_row(row):
        return {"id": row["id"], "sender": row["sender"], "recipient": row["recipient"],
                "subject": row["subject"], "body": row["body"], "date": row["created_at"],
                "unread": row["read_at"] is None}

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.post("/api/auth/signup", status_code=201)
    def signup(data: Signup, response: Response):
        username, email = data.username.strip(), str(data.email).lower()
        if len(username) < 2:
            raise HTTPException(422, "Username must contain at least two characters")
        with db() as connection:
            try:
                cursor = connection.execute("INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                                            (username, email, password_hash(data.password), now()))
            except sqlite3.IntegrityError:
                raise HTTPException(409, "Username or email is already in use") from None
            start_session(connection, cursor.lastrowid, response)
            return {"id": cursor.lastrowid, "username": username, "email": email}

    @app.post("/api/auth/login")
    def login(data: Login, response: Response):
        with db() as connection:
            row = connection.execute("SELECT * FROM users WHERE username = ? OR email = ?", (data.identifier.strip(), data.identifier.strip())).fetchone()
            if row is None or not verify_password(data.password, row["password_hash"]):
                raise HTTPException(401, "Invalid username/email or password")
            start_session(connection, row["id"], response)
            return public_user(row)

    @app.post("/api/auth/logout", status_code=204)
    def logout(response: Response, senyasko_session: str | None = Cookie(default=None)):
        if senyasko_session:
            with db() as connection:
                connection.execute("DELETE FROM sessions WHERE token_hash = ?", (hashlib.sha256(senyasko_session.encode()).hexdigest(),))
        response.delete_cookie(COOKIE, path="/")

    @app.get("/api/auth/me")
    def me(user=Depends(current_user)):
        return user

    @app.get("/api/users")
    def users(q: str = "", user=Depends(current_user)):
        query = q.strip()
        if len(query) < 2:
            return []
        with db() as connection:
            rows = connection.execute("SELECT id, username FROM users WHERE id != ? AND (username LIKE ? OR email LIKE ?) ORDER BY username LIMIT 10",
                                      (user["id"], f"%{query}%", f"%{query}%")).fetchall()
            return [dict(row) for row in rows]

    @app.get("/api/messages")
    def messages(folder: str = "inbox", user=Depends(current_user)):
        if folder not in {"inbox", "sent"}:
            raise HTTPException(422, "Folder must be inbox or sent")
        where = "recipient_id" if folder == "inbox" else "sender_id"
        with db() as connection:
            rows = connection.execute(f"""
                SELECT messages.*, sender.username AS sender, recipient.username AS recipient
                FROM messages JOIN users AS sender ON sender.id = sender_id
                JOIN users AS recipient ON recipient.id = recipient_id
                WHERE messages.{where} = ? ORDER BY messages.created_at DESC, messages.id DESC
            """, (user["id"],)).fetchall()
            return [message_row(row) for row in rows]

    @app.post("/api/messages", status_code=201)
    def send_message(data: MessageInput, user=Depends(current_user)):
        if not data.recipient.strip() or not data.subject.strip() or not data.body.strip():
            raise HTTPException(422, "Recipient, subject, and message are required")
        with db() as connection:
            recipient = connection.execute("SELECT id FROM users WHERE username = ? OR email = ?", (data.recipient.strip(), data.recipient.strip())).fetchone()
            if recipient is None:
                raise HTTPException(404, "Recipient not found. Ask them to sign up first.")
            cursor = connection.execute("INSERT INTO messages (sender_id, recipient_id, subject, body, created_at) VALUES (?, ?, ?, ?, ?)",
                                        (user["id"], recipient["id"], data.subject.strip(), data.body.strip(), now()))
            row = connection.execute("""
                SELECT messages.*, sender.username AS sender, receiver.username AS recipient
                FROM messages JOIN users AS sender ON sender.id = sender_id
                JOIN users AS receiver ON receiver.id = recipient_id WHERE messages.id = ?
            """, (cursor.lastrowid,)).fetchone()
            return message_row(row)

    @app.post("/api/messages/{message_id}/read")
    def mark_read(message_id: int, user=Depends(current_user)):
        with db() as connection:
            row = connection.execute("SELECT id FROM messages WHERE id = ? AND recipient_id = ?", (message_id, user["id"])).fetchone()
            if row is None:
                raise HTTPException(404, "Message not found")
            connection.execute("UPDATE messages SET read_at = COALESCE(read_at, ?) WHERE id = ?", (now(), message_id))
            row = connection.execute("""
                SELECT messages.*, sender.username AS sender, receiver.username AS recipient
                FROM messages JOIN users AS sender ON sender.id = sender_id
                JOIN users AS receiver ON receiver.id = recipient_id WHERE messages.id = ?
            """, (message_id,)).fetchone()
            return message_row(row)

    @app.get("/api/drafts")
    def drafts(user=Depends(current_user)):
        with db() as connection:
            return [dict(row) for row in connection.execute("SELECT id, recipient, subject, body, updated_at FROM drafts WHERE owner_id = ? ORDER BY updated_at DESC", (user["id"],)).fetchall()]

    @app.post("/api/drafts", status_code=201)
    def save_draft(data: DraftInput, user=Depends(current_user)):
        with db() as connection:
            cursor = connection.execute("INSERT INTO drafts (owner_id, recipient, subject, body, updated_at) VALUES (?, ?, ?, ?, ?)",
                                        (user["id"], data.recipient, data.subject, data.body, now()))
            return dict(connection.execute("SELECT id, recipient, subject, body, updated_at FROM drafts WHERE id = ?", (cursor.lastrowid,)).fetchone())

    @app.put("/api/drafts/{draft_id}")
    def update_draft(draft_id: int, data: DraftInput, user=Depends(current_user)):
        with db() as connection:
            cursor = connection.execute("UPDATE drafts SET recipient = ?, subject = ?, body = ?, updated_at = ? WHERE id = ? AND owner_id = ?",
                                        (data.recipient, data.subject, data.body, now(), draft_id, user["id"]))
            if not cursor.rowcount:
                raise HTTPException(404, "Draft not found")
            return dict(connection.execute("SELECT id, recipient, subject, body, updated_at FROM drafts WHERE id = ?", (draft_id,)).fetchone())

    @app.delete("/api/drafts/{draft_id}", status_code=204)
    def delete_draft(draft_id: int, user=Depends(current_user)):
        with db() as connection:
            cursor = connection.execute("DELETE FROM drafts WHERE id = ? AND owner_id = ?", (draft_id, user["id"]))
            if not cursor.rowcount:
                raise HTTPException(404, "Draft not found")

    @app.get("/api/progress")
    def progress(user=Depends(current_user)):
        with db() as connection:
            rows = connection.execute("SELECT collection_id, lesson FROM completed_lessons WHERE user_id = ?", (user["id"],)).fetchall()
        done = {(row["collection_id"], row["lesson"]) for row in rows}
        return {"collections": {key: round(100 * sum((key, lesson) in done for lesson in lessons) / len(lessons)) for key, lessons in LESSONS.items()},
                "completed_lessons": [{"collection_id": key, "lesson": lesson} for key, lesson in sorted(done)],
                "experience": len(done) * 100}

    @app.post("/api/progress/complete")
    def complete(data: CompletionInput, user=Depends(current_user)):
        if data.lesson not in LESSONS.get(data.collection_id, []):
            raise HTTPException(422, "Unknown lesson")
        with db() as connection:
            connection.execute("INSERT OR IGNORE INTO completed_lessons VALUES (?, ?, ?, ?)",
                               (user["id"], data.collection_id, data.lesson, now()))
        return progress(user)

    return app


app = create_app()
