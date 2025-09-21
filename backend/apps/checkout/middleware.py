from django.utils.deprecation import MiddlewareMixin


class EnsureSessionKeyMiddleware(MiddlewareMixin):
    """Guarantee a session key exists for anonymous users so we can key carts.
    Add to MIDDLEWARE after Django's SessionMiddleware.
    """

    def process_request(self, request):
        # Django only creates a session key on first write; force-create one.
        if not getattr(request, "session", None):
            return
        if request.session.session_key is None:
            request.session.save()
