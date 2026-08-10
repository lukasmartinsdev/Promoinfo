class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("X-Permitted-Cross-Domain-Policies", "none")
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")
        response.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.setdefault("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://www.recaptcha.net; frame-src https://www.google.com https://recaptcha.google.com https://www.recaptcha.net; connect-src 'self' https://www.google.com https://www.gstatic.com https://www.recaptcha.net; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'")
        return response
