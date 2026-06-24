# BlacUSA Auth Testing Playbook

JWT Bearer auth (localStorage token), single seeded admin. No httpOnly cookies in this app.

## Admin credentials
- Email: `admin@blacusa.com`
- Password: `BlacUSA2026!`

## API testing
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@blacusa.com","password":"BlacUSA2026!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"
curl -s "$API/api/admin/overview" -H "Authorization: Bearer $TOKEN"
# Unauthorized should be 401:
curl -s -o /dev/null -w "%{http_code}" "$API/api/admin/overview"
```

## Expectations
- Wrong password -> 401 "Invalid email or password".
- Missing/invalid token on /api/admin/* -> 401; non-admin -> 403.
- Admin article/case create/update/delete persist and reflect on public endpoints (published articles only appear publicly when is_published != false).
- Tip status patch transitions: pending_review -> approved/rejected/reviewed.

## Frontend
- Login at `/admin/login`, token stored in localStorage `blacusa-admin-token`.
- Protected routes `/admin/*` redirect to `/admin/login` when no/invalid token.
- AuthContext checks `/api/auth/me` on mount.
