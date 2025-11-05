<!-- 616d4a4a-760b-4bc3-b34c-abf62ca9234e d4fe371d-5e38-431f-b003-3afde98afd3e -->
# Complete prerequisites to run containers

## Scope

Add the minimal missing modules that current endpoints import so the app starts and Swagger loads under Docker Compose.

## Changes

- Add `app/schemas/report.py` with `ReportResponse`, `ReportGenerateRequest`, `ReportListResponse`.
- Add `app/schemas/request.py` with `RequestInfoResponse`, `RequestListResponse`.
- Optionally export these in `app/schemas/__init__.py` (not required but nice to have).
- No changes to routers or compose files.

## After changes

- Start with `docker compose up -d`.
- Verify `http://localhost:8006/docs` loads and shows Verifications, Reports, Requests groups.
- Use Swagger Authorize (Bearer) to test protected endpoints.

### To-dos

- [x] Create app/schemas/report.py with minimal models used by reports endpoints
- [ ] Create app/schemas/request.py with minimal models used by requests endpoints