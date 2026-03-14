def validar_cpf(cpf: str) -> bool:
    """
    Valida um CPF pelo algoritmo oficial da Receita Federal brasileira.

    O algoritmo calcula dois dígitos verificadores a partir dos 9 primeiros dígitos
    usando somas ponderadas com módulo 11. CPFs com todos os dígitos iguais
    (ex: 111.111.111-11) são matematicamente válidos pelo algoritmo, mas são
    explicitamente rejeitados pela Receita Federal — por isso verificamos
    sequências repetidas antes de calcular os dígitos.
    """
    cpf = "".join(c for c in cpf if c.isdigit())

    if len(cpf) != 11:
        return False

    # Sequências como 00000000000, 11111111111 etc. são inválidas por definição
    if cpf == cpf[0] * 11:
        return False

    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma * 10 % 11) % 10
    if digito1 != int(cpf[9]):
        return False

    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma * 10 % 11) % 10
    if digito2 != int(cpf[10]):
        return False

    return True
