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

## Instalación y ejecución

Necesitas Node.js y npm. Desde la raíz del repositorio:

```bash
npm install
npm run start:dev
```

La API queda disponible en `http://localhost:3000`. Para comprobar el estado:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/
```

La ruta `GET /` responde con el nombre de la API, el estado y las rutas base.

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

La configuración se lee desde `.env` en la raíz. Si no existe ese archivo, se usa SQLite con `data/app.sqlite`.

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

No subas `.env` ni credenciales a GitHub. `DB_SYNCHRONIZE=true` permite que TypeORM ajuste el esquema al iniciar; para producción se recomienda desactivarlo y gestionar cambios mediante migraciones.

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

## Qué cubre y qué falta para la app completa

Este backend conserva el CRUD académico de usuarios, productos y pedidos. Sin embargo, no incluye todavía entidades para restaurantes y categorías, carga automática de los platos de Ventolini y La Frute, autenticación propia, integración con Nequi, número de comprobante ni calificación de pedidos. El historial y el carrito que hoy guarda el frontend en `localStorage` no se sincronizan automáticamente con esta API.

Los DTOs contienen reglas con `class-validator`, pero `main.ts` aún no registra un `ValidationPipe` global. Para que esas reglas se apliquen automáticamente a las solicitudes hay que habilitar dicho pipe. Tampoco hay configuración de CORS en el arranque; si el frontend se sirve desde otro dominio, se debe configurar antes de conectarlos.

## Despliegue

Este repositorio contiene el backend NestJS. Vercel está configurado para desplegar el frontend del proyecto por separado; no se debe confundir esa publicación con el servidor de esta API. Para producción, despliega el backend en un servicio compatible con Node.js, configura PostgreSQL y define las variables de entorno allí. SQLite local no es apropiado para un entorno serverless con almacenamiento efímero.

## Licencia

Proyecto académico privado (`UNLICENSED`).
