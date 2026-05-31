# ShiftBoard

Sistema web para gestionar turnos laborales semanales. Un manager asigna turnos a cada trabajador a lo largo de la semana y el sistema calcula automáticamente las horas, controla el cumplimiento según el contrato y verifica la cobertura mínima de personal por franja horaria.

Pensado inicialmente para una estación de servicio 24/7, pero genérico: las categorías de puesto y las franjas horarias se configuran desde la aplicación sin tocar código.

---

## Funcionalidades

### Cuadro de turnos
Vista principal. Tabla semanal con una fila por trabajador y una columna por día. Un clic en cualquier celda abre un selector para asignar o cambiar el turno. La columna "Semana" muestra las horas acumuladas, la meta del contrato y una barra de progreso con estado de color (exacto / exceso / déficit). Debajo de la tabla aparece el panel de cobertura: cuántas personas hay asignadas por franja y día, destacando en rojo los huecos que no alcanzan el mínimo requerido.

### Asistente de asignación automática
Genera una propuesta de cuadro a partir de restricciones configurables:

- **Aplicar a**: todos los trabajadores o solo una categoría.
- **Turno base**: automático (usa el turno más frecuente en el historial de cada trabajador) o una franja fija para todos.
- **Días libres mínimos**: cuántos días sin turno debe tener cada trabajador (1, 2 o 3).
- **Distribución**: *compactar* (días de trabajo consecutivos) o *repartir* (descansos distribuidos a lo largo de la semana).
- **Respetar meta de horas**: avisa si la propuesta no alcanza el objetivo del contrato.
- **Incluir fines de semana**: permite asignar sábados y domingos.

La propuesta se revisa antes de aplicarla: se ven las tiras semanales, el cambio de horas (actual → propuesto) y un indicador por trabajador. Se puede descartar sin consecuencias o aplicar al cuadro con un clic.

### Trabajadores
CRUD completo. Cada tarjeta muestra el avatar con iniciales, categoría, tipo de contrato, horas asignadas vs. meta, barra de progreso y días trabajados / libres. Se puede buscar por nombre o categoría. El formulario de alta/edición incluye el tipo de contrato (Tiempo Completo 40h o Part Time 20h) y la selección de categoría con color.

### Estadísticas
Dashboard de resumen semanal:
- **KPIs**: total de trabajadores, horas asignadas (con desvío sobre/bajo meta), cobertura cubierta en % y número de huecos.
- **Cumplimiento**: barra apilada con conteo de exacto / exceso / déficit.
- **Horas por franja y por categoría**: barras proporcionales.
- **Desglose por trabajador**: ordenado por desvío absoluto, con barra de progreso y chip de diferencia.

### Configuración
Administración de **categorías/puestos** (nombre + color por hue) y **franjas horarias** (nombre, horario desde/hasta con cálculo automático de duración, color y cobertura mínima por día). Al eliminar una franja, las celdas asignadas pasan automáticamente a "Libre". Al eliminar una categoría, los trabajadores se reasignan a otra existente.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| UI | Material UI v6 + Emotion |
| Fuentes | IBM Plex Sans / IBM Plex Mono |
| Persistencia | localStorage (sin backend) |

---

## Algoritmo de asignación automática

El asistente usa una heurística por trabajador, no una optimización global. El objetivo es generar un punto de partida razonable rápido, no la solución óptima.

**Para cada trabajador:**

1. **Determinar el turno a asignar**
   - Si el usuario eligió un turno fijo → se usa ese turno para todos.
   - Si está en modo *Automático* → se elige la franja que el trabajador tiene asignada con más frecuencia en el cuadro actual. Si no tiene historial, se selecciona la primera franja que se ajusta a su contrato (≥ 8h para tiempo completo, ≤ 4h para part time).

2. **Calcular días de trabajo ideales**
   ```
   idealDays = round(horasMeta / horasPorTurno)
   ```
   Se limita por dos topes:
   - `7 − díasLibresMínimos` (la restricción de descanso configurada)
   - Cantidad de días elegibles (solo días de semana, o los 7 si se habilitaron los fines de semana)

3. **Seleccionar los días**

   *Compactar*: toma los primeros `n` días del pool elegible. El resultado agrupa el trabajo al inicio de la semana y concentra el descanso al final.

   *Repartir*: distribuye `n` días a lo largo del pool usando interpolación lineal:
   ```
   índice_i = round(i × (total − 1) / (n − 1))
   ```
   El resultado es un espaciado uniforme entre turnos, con días libres intercalados.

4. **Construir el cuadro propuesto**
   Los días seleccionados reciben el turno elegido; el resto queda como "Libre".

5. **Reportar desvío**
   Si `Respetar meta de horas` está activo y las horas resultantes difieren de la meta, se muestra un aviso por trabajador indicando el faltante o el exceso.

**Limitaciones conocidas:**
- La heurística no optimiza cobertura: puede generar huecos. El panel de cobertura del asistente los reporta para que el manager ajuste manualmente antes de aplicar.
- El mínimo de cobertura es el mismo todos los días. No distingue entre semana y fin de semana.
- No considera restricciones entre trabajadores (evitar que dos trabajadores del mismo puesto descansen el mismo día, por ejemplo).

---

## Modelo de datos

```ts
Worker   { id, name, cat: categoryId, role: "full"|"part", shifts: { lun…dom: shiftId } }
Category { id, name, hue: number }          // hue 0–360 para generar colores OKLCH
ShiftType{ id, name, start: 0–23, end: 0–23, hue: number }  // end < start → cruza medianoche
Config   { categories, shiftTypes, coverage: { [shiftId]: number } }
```

- `role: "full"` → meta 40h/semana · `role: "part"` → meta 20h/semana
- Los colores se generan dinámicamente desde el `hue` de cada categoría/franja usando la función `hueColors(hue, dark)` con valores OKLCH, lo que garantiza relaciones armónicas entre temas claro y oscuro.
- El estado se persiste en `localStorage` (claves `sb_*`). Para resetear a los datos de ejemplo, borrar el localStorage del navegador.

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

Requiere Node.js 18+. El servidor de desarrollo inicia en `http://localhost:5173`.

---

## Estructura del proyecto

```
src/
├── types.ts              # Interfaces TypeScript del modelo de datos
├── data.ts               # Registro de franjas/categorías, helpers de cálculo y datos de ejemplo
├── theme.ts              # Tema Material UI (paleta OKLCH, tipografía, overrides)
├── App.tsx               # Shell: sidebar, navegación, estado global, modo oscuro
├── components/
│   ├── Icon.tsx          # Íconos SVG de línea
│   ├── ShiftChip.tsx     # Pill de turno con color por hue
│   ├── HoursBar.tsx      # Barra de progreso de horas (con patrón rayado en exceso)
│   └── StatusPill.tsx    # Chip de estado exacto/exceso/déficit
└── views/
    ├── Turnos.tsx         # Cuadro de turnos + selector + cobertura
    ├── Asistente.tsx      # Restricciones + algoritmo + preview de propuesta
    ├── Trabajadores.tsx   # Grid de tarjetas + CRUD
    ├── Estadisticas.tsx   # KPIs + gráficos de barras + desglose
    └── Configuracion.tsx  # Categorías + franjas + cobertura mínima
```
