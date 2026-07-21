# App Ambulatorio

Aplicación web para la gestión de historias clínicas familiares en ambulatorios y centros de salud. Diseñada para funcionar sin conexión a internet (offline-first) y sincronizar automáticamente cuando hay red disponible.

## ¿Para qué sirve?

Permite al personal médico registrar y consultar la información de las familias que atienden: datos de la vivienda, integrantes del núcleo familiar, patologías, condiciones de vida y más. Todo desde una sola aplicación que se instala en el teléfono, la tableta o la computadora del consultorio.

## ¿Cómo funciona?

- **Sin internet:** La aplicación guarda los datos en el dispositivo. Puede trabajar en el campo o en consultorios sin red.
- **Con internet:** Los datos se sincronizan automáticamente con el servidor del ambulatorio y con los dispositivos de los demás miembros del equipo.
- **Tiempo real:** Si un colega registra un cambio, este aparece en su pantalla sin necesidad de recargar la página.
- **Red local:** No necesita internet externo. Funciona dentro de la red WiFi del ambulatorio.

## Funcionalidades principales

- Registro de **centros de salud** (ASIC y consultorio)
- Registro de **viviendas** con características (tipo, material, servicios, etc.)
- Registro de **familias** con dirección, ubicación geográfica y evaluación
- Registro de **integrantes** de cada familia con datos personales y de salud
- Asignación de **patologías** a cada integrante
- Registro de **condiciones de vida** (bienes, medios de cocción)
- Registro de **fauna** doméstica y nociva por vivienda
- Catálogos configurables (tipos de vivienda, materiales, escolaridad, etc.)
- Búsqueda de familias e integrantes
- Respaldo y restauración de la base de datos

## Requisitos

- Un **servidor** (una computadora en el ambulatorio que ejecuta la aplicación)
- Dispositivos **cliente** (celulares, tablets o computadoras) conectados a la misma red WiFi
- Navegador web moderno (Chrome, Edge, Firefox o Safari)

## Instalación

El personal técnico del ambulatorio se encarga de instalar y configurar el servidor. Una vez en funcionamiento, los usuarios solo deben:

1. Ingresar a la dirección web del ambulatorio desde el navegador del dispositivo
2. Iniciar sesión con su usuario y contraseña
3. Agregar la aplicación a la pantalla de inicio para usarla como una app instalada

## Tecnología

Construida con SvelteKit y Bun. Almacenamiento local en el dispositivo con sincronización automática al servidor.
