"""API package for certificate service.

Avoid importing `routes` at package import time because importing
`app.api.messaging.*` (consumer modules) would trigger route
registration and initialize the web-related imports. Import
`app.api.routes` only when starting the web server.
"""

__all__ = []