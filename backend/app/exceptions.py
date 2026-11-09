class BusinessError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 409):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFound(BusinessError):
    def __init__(self, resource: str):
        super().__init__("not_found", f"{resource} não encontrado(a).", 404)


class InsufficientStock(BusinessError):
    def __init__(self, available: int):
        super().__init__("insufficient_stock", f"Estoque insuficiente. Disponível: {available} unidade(s).")
