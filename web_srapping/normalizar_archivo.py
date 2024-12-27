def limpiar_archivo(ruta_archivo):
    try:
        with open(ruta_archivo, "r", encoding="utf-8") as file:
            lineas = file.readlines()

        # Limpiar y normalizar cada línea
        lineas_normalizadas = []
        for linea in lineas:
            # Eliminar espacios al inicio y al final
            linea = linea.strip()
            # Reemplazar comillas tipográficas y otros caracteres problemáticos
            linea = (
                linea.replace("‘", "'")
                     .replace("’", "'")
                     .replace("“", '"')
                     .replace("”", '"')
            )
            if linea:  # Ignorar líneas vacías
                lineas_normalizadas.append(linea)

        # Sobrescribir el archivo con las líneas normalizadas
        with open(ruta_archivo, "w", encoding="utf-8") as file:
            file.write("\n".join(lineas_normalizadas))

        print("Archivo limpiado y normalizado correctamente.")
    except Exception as e:
        print(f"Error al limpiar el archivo: {e}")

if __name__ == "__main__":
    RUTA_TXT = "canciones_y_artistas.txt"
    limpiar_archivo(RUTA_TXT)
