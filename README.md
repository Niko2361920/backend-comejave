# Come Jave | Backend

API REST para apoyar el proyecto Come Jave, una propuesta de pedidos de comida para estudiantes de la Pontificia Universidad Javeriana Cali. Este repositorio contiene el backend desarrollado con NestJS y TypeScript: gestiona usuarios, productos de catálogo y pedidos, y guarda la información en una base de datos.

La idea es mantenerlo entendible y práctico: cada módulo separa las rutas HTTP, las reglas de negocio, los modelos de base de datos y los datos de entrada.

## Tecnologías

- Node.js y TypeScript.
- NestJS para organizar la API y sus módulos.
- TypeORM para comunicarse con la base de datos.
- SQLite con `better-sqlite3` para desarrollo local.
- PostgreSQL como alternativa de base de datos.
- `class-validator` y `class-transformer` para definir validaciones y conversiones en los DTOs.
- Jest para pruebas y Oxlint para análisis estático.

## Estructura

```text
src/
├─ main.ts                  # Inicia el servidor NestJS
├─ app.module.ts            # Registra configuración, base de datos y módulos
├─ app.controller.ts        # Estado básico de la API en GET /
├─ config/
│  └─ env.validation.ts     # Valida variables de entorno
├─ users/
│  ├─ controllers/          # Rutas HTTP de usuarios
│  ├─ dto/                  # Datos de entrada y actualización
│  ├─ entities/             # Modelo User
│  ├─ services/             # Reglas y consultas de usuarios
│  └─ users.module.ts
├─ products/                # Catálogo e inventario
└─ orders/                  # Pedidos, detalles y control de stock
test/                       # Pruebas end-to-end
postman/                    # Colección para probar la API
data/                       # Directorio local de SQLite
```

## Cómo funciona una petición

1. `main.ts` inicia NestJS y escucha en el puerto configurado, por defecto el `3000`.
2. `AppModule` carga la configuración y conecta TypeORM con SQLite o PostgreSQL.
3. Un controller recibe la petición, por ejemplo `POST /orders`.
4. El DTO describe los campos que espera la operación.
5. El service ejecuta la lógica de negocio y consulta o modifica la base de datos.
6. TypeORM representa y guarda los datos usando las entities.

## Instalación y ejecución paso a paso

Necesitas **Node.js 22 LTS o superior** y npm. Para revisar las versiones instaladas:

```bash
node --version
npm --version
```

Clona este repositorio y entra a su carpeta:

```bash
git clone https://github.com/Niko2361920/backend-comejave.git
cd backend-comejave
```

Instala las versiones exactas registradas en `package-lock.json`:

```bash
npm ci
```

Crea tu archivo `.env` a partir del ejemplo. En PowerShell:

```powershell
Copy-Item .env.example .env
```

En macOS o Linux:

```bash
cp .env.example .env
```

Para iniciar en desarrollo:

```bash
npm run start:dev
```

Deja esa terminal abierta mientras usas la API. El servidor queda en `http://localhost:3000` y se reinicia al guardar cambios. No tienes que instalar SQLite por separado: el driver está incluido en las dependencias de npm y la base local se crea al iniciar.

Comprueba que está respondiendo, desde otra terminal:

```powershell
Invoke-RestMethod http://localhost:3000/
```

En macOS o Linux puedes usar:

```bash
curl http://localhost:3000/
```

La ruta `GET /` devuelve el nombre, el estado y las rutas base de la API.

### Compilar y ejecutar para producción

```bash
npm run build
npm run start:prod
```

### Otros comandos

```bash
npm run test       # Pruebas unitarias
npm run test:e2e   # Pruebas de extremo a extremo
npm run test:cov   # Cobertura de pruebas
npm run lint       # Análisis estático de src/ y test/
npm run format     # Formatea TypeScript de src/ y test/
```

## Configurar la base de datos

La configuración se lee desde `.env` en la raíz. El archivo `.env.example` contiene los valores locales de inicio. Si no creas `.env`, los valores por defecto también apuntan a SQLite en `data/app.sqlite`.

### SQLite local

```env
PORT=3000
DB_TYPE=sqlite
DB_DATABASE=data/app.sqlite
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

### PostgreSQL

```env
PORT=3000
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=CAMBIA_ESTA_CLAVE
DB_DATABASE=come_jave
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

No subas `.env` ni credenciales a GitHub. `DB_SYNCHRONIZE=true` permite que TypeORM ajuste el esquema al iniciar; para producción se recomienda desactivarlo y gestionar cambios mediante migraciones. Para usar PostgreSQL, reemplaza los valores SQLite de `.env` por las variables de la opción PostgreSQL y asegúrate de que la base exista y esté accesible.

## Funcionalidades de la API

### Estado

- `GET /` informa si la API está arriba y muestra las rutas base.

### Usuarios

- `POST /users`: crea un usuario con identificación, nombre, correo, edad y teléfono.
- `GET /users`: devuelve usuarios activos.
- `GET /users/:id`: busca un usuario activo por identificación.
- `PUT /users/:id`: actualiza sus datos.
- `DELETE /users/:id`: lo desactiva; no elimina físicamente el registro.

El correo y la identificación no se pueden repetir. La identificación se maneja como texto de 5 a 20 dígitos.

Ejemplo de cuerpo para `POST /users`:

```json
{
  "id": "12345678",
  "name": "Alex Estudiante",
  "email": "alex@javerianacali.edu.co",
  "age": 20,
  "phone": "+573001234567"
}
```

### Productos

- `POST /products`: agrega un producto al catálogo.
- `GET /products`: lista productos activos y permite filtros.
- `GET /products/:id`: consulta un producto por UUID.
- `PUT /products/:id`: actualiza sus datos.
- `DELETE /products/:id`: lo desactiva sin borrarlo físicamente.

Los filtros disponibles en `GET /products` son `name`, `minPrice`, `maxPrice`, `minStock` y `maxStock`. Ejemplo:

```http
GET /products?name=pasta&minPrice=10000&maxPrice=30000&minStock=1
```

Cada producto tiene nombre, descripción opcional, precio, stock, estado activo y fecha de creación.

Ejemplo de cuerpo para `POST /products`:

```json
{
  "name": "Pasta Bolognesa",
  "description": "Salsa de carne y tomate",
  "price": 22000,
  "stock": 20
}
```

La respuesta incluye el UUID del producto. Guarda ese valor para usarlo como `productId` al crear un pedido.

### Pedidos

- `POST /orders`: crea un pedido para un usuario con uno o más productos.
- `GET /orders`: lista pedidos y acepta filtros `status` y `userId`.
- `GET /orders/user/:userId`: consulta el historial de pedidos de un usuario.
- `GET /orders/:id`: consulta un pedido por UUID.
- `PUT /orders/:id`: cambia el estado permitido del pedido.
- `PUT /orders/:id/cancel`: cancela un pedido pendiente y devuelve sus unidades al inventario.
- `DELETE /orders/:id`: elimina el pedido; si estaba pendiente, primero devuelve el stock.

Los estados contemplados son `PENDING`, `PAID` y `CANCELLED`. Al crear un pedido, el backend valida el usuario, comprueba que los productos estén activos y tengan unidades disponibles, calcula el total y descuenta inventario. Estas operaciones se ejecutan dentro de una transacción para evitar dejar cambios parciales si ocurre un error.

Ejemplo de cuerpo para `POST /orders`:

```json
{
  "userId": "12345678",
  "items": [
    {
      "productId": "UUID-DEL-PRODUCTO",
      "quantity": 2
    }
  ]
}
```

El total y el precio unitario se calculan o guardan en el backend a partir del producto, no se reciben como valores confiables del cliente.

Para probar el flujo completo, primero crea un usuario y un producto, y luego envía el `id` del usuario y el UUID del producto que devolvió la API al siguiente endpoint. Los identificadores de este ejemplo son ilustrativos:

```http
POST http://localhost:3000/orders
Content-Type: application/json
```

```json
{
  "userId": "12345678",
  "items": [
    {
      "productId": "UUID-QUE-DEVOLVIO-POST-PRODUCTS",
      "quantity": 2
    }
  ]
}
```

También puedes consultar `GET /orders?userId=12345678`, marcar un pedido pagado con `PUT /orders/UUID-DEL-PEDIDO` y el cuerpo `{"status":"PAID"}`, o cancelarlo con `PUT /orders/UUID-DEL-PEDIDO/cancel`.

## Probar con Postman

Importa `postman/backend-nestjs-seed.postman_collection.json` en Postman. La API base local es `http://localhost:3000`. Para crear pedidos correctamente, crea primero el usuario y los productos y usa los identificadores devueltos por sus respuestas.

## Validaciones y funcionamiento esperado

El servidor registra `ValidationPipe` global con transformación de tipos y limpieza de propiedades que no estén en los DTOs. Si envías campos inválidos, la API devuelve un error `400`. Algunos endpoints, como la consulta y cancelación de pedidos, devuelven `404` si no encuentran el recurso; un pedido sin stock suficiente devuelve `400`.

## Qué cubre y qué falta para la app completa

Este backend conserva el CRUD académico de usuarios, productos y pedidos. Sin embargo, no incluye todavía entidades para restaurantes y categorías, carga automática de los platos de Ventolini y La Frute, autenticación propia, integración con Nequi, número de comprobante ni calificación de pedidos. El historial y el carrito que hoy guarda el frontend en `localStorage` no se sincronizan automáticamente con esta API.

El backend todavía no configura CORS ni implementa autenticación propia. Si una página web alojada en otro dominio necesita consumir esta API desde el navegador, habrá que permitir ese origen en CORS. El CRUD de usuarios no sustituye un sistema de inicio de sesión seguro.

## Despliegue

Este repositorio contiene el backend NestJS. Vercel está configurado para desplegar el frontend del proyecto por separado; no se debe confundir esa publicación con el servidor de esta API. Para producción, despliega el backend en un servicio compatible con Node.js, configura PostgreSQL y define las variables de entorno allí. SQLite local no es apropiado para un entorno serverless con almacenamiento efímero.

