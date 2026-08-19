import threading

_thread_locals = threading.local()


def get_current_request():
    return getattr(_thread_locals, "request", None)


class AuditRequestMiddleware:
    """
    Stashes the current request in thread-local storage so model-level
    signal handlers (e.g. price-change audit logging) can pull the
    requesting user/IP without every call site threading it through
    manually. Read-only, never mutates the request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            response = self.get_response(request)
        finally:
            _thread_locals.request = None
        return response
