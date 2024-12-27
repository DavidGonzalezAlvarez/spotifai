from neo4j import GraphDatabase

# Configuración de la conexión
uri = "bolt://localhost:7999"  # Cambia la URI si es diferente
username = "neo4j"             # Tu usuario de Neo4j
password = "password"     # Tu contraseña de Neo4j

# Crear el controlador de la base de datos
driver = GraphDatabase.driver(uri, auth=(username, password))

def contar_canciones():
    with driver.session() as session:
        query = "MATCH (c:Cancion) RETURN COUNT(c) AS total_canciones;"
        result = session.run(query)
        total_canciones = result.single()["total_canciones"]
        return total_canciones

# Llamar a la función y mostrar el resultado
total = contar_canciones()
print(f"Total de canciones en la base de datos Neo4j: {total}")

# Cerrar la conexión
driver.close()
