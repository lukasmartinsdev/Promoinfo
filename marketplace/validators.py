import re


def limpar_cpf(cpf: str) -> str:
    """Retorna somente os dígitos informados no CPF."""
    return re.sub(r"\D", "", cpf or "")


def validar_cpf(cpf: str) -> bool:
    """Valida matematicamente os dois dígitos verificadores de um CPF."""
    cpf_limpo = limpar_cpf(cpf)

    if len(cpf_limpo) != 11:
        return False

    if len(set(cpf_limpo)) == 1:
        return False

    numeros = [int(digito) for digito in cpf_limpo]
    base = numeros[:9]

    soma_primeiro = sum(
        numero * peso
        for numero, peso in zip(base, range(10, 1, -1), strict=True)
    )
    primeiro_digito = (soma_primeiro * 10) % 11
    if primeiro_digito == 10:
        primeiro_digito = 0

    base_segundo = [*base, primeiro_digito]
    soma_segundo = sum(
        numero * peso
        for numero, peso in zip(base_segundo, range(11, 1, -1), strict=True)
    )
    segundo_digito = (soma_segundo * 10) % 11
    if segundo_digito == 10:
        segundo_digito = 0

    return numeros[-2:] == [primeiro_digito, segundo_digito]
