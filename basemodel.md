# Modelo de base de datos (v1)

Borrador de trabajo del modelo de datos de Maestrio para la v1. Base de datos:
PostgreSQL.

## Cadena de dependencias

```
maestros → salones → alumnos
                  └→ sesiones → asistencias (alumno + estado)
```

## Convenciones

- Tablas en plural y en minúsculas: `maestros`, `salones`, `alumnos`, `sesiones`,
  `asistencias`.
- Cada tabla tiene una llave primaria `id_<entidad>` en singular (`id_salon`,
  `id_alumno`...). Así, una llave foránea se llama igual que la llave primaria a la
  que apunta, y se lee sola: `alumnos.id_salon` → `salones.id_salon`.
- `INTEGER IDENTITY` = número entero que PostgreSQL asigna solo (1, 2, 3...). Nunca
  lo escribe la app.
- `NOT NULL` = el campo es obligatorio. Si no dice `NOT NULL`, puede quedar vacío.

---

### Tabla: maestros

Dueño de los salones. Sin login en la v1: en local existe un maestro de prueba
creado a mano y todo cuelga de él.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id_maestro` | INTEGER IDENTITY | Llave primaria | Identificador interno del maestro |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre con el que se muestra al maestro |

Sin correo ni contraseña: los añade el login (Better Auth), que trae sus propias
tablas de usuario. Cuando llegue, se decide cómo se conecta `maestros` con esas
tablas.

### Tabla: salones

Una clase del maestro, con nombre libre (por ejemplo, "Matemáticas 2B"). No hay
tabla de materias en la v1.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id_salon` | INTEGER IDENTITY | Llave primaria | Identificador interno del salón |
| `id_maestro` | INTEGER | NOT NULL, llave foránea → `maestros.id_maestro`, borrado en cascada | Maestro dueño del salón. Si se borra el maestro, se borran sus salones |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre visible del salón, por ejemplo "Matemáticas 2B" |

### Tabla: alumnos

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id_alumno` | INTEGER IDENTITY | Llave primaria | Identificador interno del alumno |
| `id_salon` | INTEGER | NOT NULL, llave foránea → `salones.id_salon`, borrado en cascada | Salón al que pertenece. Si se borra el salón, se borran sus alumnos |
| `nombre` | VARCHAR(50) | NOT NULL | Nombre(s) del alumno |
| `apellido_paterno` | VARCHAR(50) | NOT NULL | Primer apellido |
| `apellido_materno` | VARCHAR(50) | — | Segundo apellido. Puede quedar vacío si el alumno no lo tiene |

Mínimo de datos personales: solo lo necesario para identificar al alumno en la
lista. Solo datos de prueba.

### Tabla: sesiones

Un momento concreto en que un salón tiene clase. En la v1 se crea al tomar lista,
con fecha y horas escritas a mano. Un salón puede tener varias sesiones el mismo día.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id_sesion` | INTEGER IDENTITY | Llave primaria | Identificador interno de la sesión |
| `id_salon` | INTEGER | NOT NULL, llave foránea → `salones.id_salon`, borrado en cascada | Salón que tuvo la clase. Si se borra el salón, se borran sus sesiones |
| `fecha` | DATE | NOT NULL | Día de la clase |
| `hora_inicio` | TIME | NOT NULL | Hora en que empieza la clase |
| `hora_fin` | TIME | NOT NULL, debe ser mayor que `hora_inicio` | Hora en que termina la clase |

### Tabla: asistencias

Una fila por alumno por sesión.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id_asistencia` | INTEGER IDENTITY | Llave primaria | Identificador interno del registro |
| `id_sesion` | INTEGER | NOT NULL, llave foránea → `sesiones.id_sesion`, borrado en cascada | Sesión en la que se tomó lista. Si se borra la sesión, se borra su lista |
| `id_alumno` | INTEGER | NOT NULL, llave foránea → `alumnos.id_alumno`, borrado en cascada | Alumno al que corresponde. Si se borra el alumno, se borran sus asistencias |
| `estado` | Lista cerrada (enum) | NOT NULL | Uno de: `presente`, `ausente`, `retardo`, `salida_anticipada` |

**Regla de unicidad:** la pareja (`id_sesion`, `id_alumno`) no se repite. Un alumno
tiene un solo estado por sesión. Dos clases el mismo día son dos sesiones
distintas, así que esta regla no impide el doble pase de lista.

---

## Reglas que la base de datos no garantiza sola

- **El alumno debe ser del salón de la sesión.** Con estas llaves, nada impide
  guardar la asistencia de un alumno de "Matemáticas 2B" en una sesión de
  "Ciencias 3A". Lo valida el código del servidor al tomar lista.
- **Los datos de cada maestro no se mezclan.** Sin login, la app trabaja con el
  maestro de prueba. Cuando llegue el login, cada consulta debe filtrar por el
  maestro que entró.

## Decisiones tomadas en este borrador (revisar)

1. `codigo_salon` (VARCHAR 20) pasó a `nombre` (VARCHAR 100), porque ahora el salón
   es una clase con nombre libre como "Matemáticas 2B".
2. Se quitó `id_salon` y `fecha` de la asistencia: el salón y la fecha ya están en
   la sesión. Guardarlos dos veces permite que se contradigan.
3. `estatus` (texto libre) pasó a `estado` (lista cerrada), para que "Presente" y
   "presente" no cuenten como dos cosas distintas.
4. Cascadas nuevas: maestro → salones, salón → sesiones y sesión → asistencias.
   Con esto, borrar un salón borra sus alumnos, sus sesiones y toda su asistencia.
