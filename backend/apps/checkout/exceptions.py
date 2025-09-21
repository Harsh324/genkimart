class CheckoutError(Exception):
    """Domain-level exception for checkout failures."""

    pass


class CartMergeError(CheckoutError):
    """Raised when carts cannot be merged deterministically."""

    pass
