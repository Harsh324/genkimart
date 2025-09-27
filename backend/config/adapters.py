from allauth.account.adapter import DefaultAccountAdapter


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_email_confirmation_url(self, request, emailconfirmation):
        scheme = request.scheme
        host = request.get_host()
        return f"{scheme}://{host}/verify-email?key={emailconfirmation.key}"
