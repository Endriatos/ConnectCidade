import math


# Raio médio da Terra em metros (valor adotado pela IUGG)
RAIO_TERRA_METROS = 6_371_000


def calcular_distancia_metros(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância em metros entre dois pontos geográficos usando a fórmula de Haversine.

    A fórmula de Haversine é usada para calcular a distância entre dois pontos
    na superfície de uma esfera (a Terra) a partir de suas latitudes e longitudes.
    Ela é preferida sobre simples diferenças de coordenadas porque leva em conta
    a curvatura da Terra, sendo precisa para distâncias curtas e longas.
    """
    # Converte os ângulos de graus para radianos, que é o que math.sin/cos esperam
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    # Termo central da fórmula: sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )

    # Ângulo central entre os dois pontos em radianos
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # Distância final em metros: arco × raio da Terra
    return RAIO_TERRA_METROS * c
