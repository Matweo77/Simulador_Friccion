# Simulador de Fricción y Segunda Ley de Newton

## Descripción del Proyecto

Este proyecto es una simulación interactiva desarrollada para demostrar cómo actúa la fricción en el movimiento de un objeto según la Segunda Ley de Newton.

El usuario puede modificar diferentes variables físicas como:

- Fuerza aplicada
- Masa del objeto
- Tipo de superficie

Dependiendo de estos valores, el sistema calcula cómo el objeto se desplaza y cuánto tiempo tarda en detenerse debido a la fricción.

El proyecto tiene un enfoque educativo y visual, buscando representar de forma sencilla y dinámica conceptos básicos de física.

---

# Objetivo

Simular el comportamiento de un objeto sometido a una fuerza inicial y afectado posteriormente por la fricción de distintas superficies.

La simulación permite comprender conceptos como:

- Segunda Ley de Newton
- Fricción estática
- Fricción cinética
- Fuerza normal
- Velocidad
- Distancia recorrida

---

# Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript Vanilla
- Canvas API

---

# Características Principales

## Simulación Física
- Aplicación de fuerza inicial.
- Cálculo de aceleración.
- Sistema de fricción estática y cinética.
- Movimiento desacelerado por fricción.

## Superficies Disponibles
- Hielo
- Madera
- Arena

Cada superficie posee diferentes coeficientes de fricción.

## Interfaz Interactiva
- Inputs dinámicos.
- Canvas animado.
- Información en tiempo real.
- Cámara suave durante el movimiento.

## Información Mostrada
- Velocidad actual
- Distancia recorrida
- Estado del objeto
- Resultado final de la simulación

---

# Fórmulas Utilizadas

## Segunda Ley de Newton
\[
F = m \times a
\]

Donde:
- \(F\) = Fuerza
- \(m\) = Masa
- \(a\) = Aceleración

---

## Fuerza Normal
\[
N = m \times g
\]

Donde:
- \(N\) = Fuerza normal
- \(g\) = Gravedad terrestre

---

## Fricción
\[
F_r = \mu \times N
\]

Donde:
- \(F_r\) = Fuerza de fricción
- \(\mu\) = Coeficiente de fricción
- \(N\) = Fuerza normal

---

# Funcionamiento

1. El usuario ingresa:
   - Masa del objeto (kg)
   - Fuerza aplicada (N)
   - Tipo de superficie

2. El sistema evalúa si la fuerza supera la fricción estática.

3. Si el objeto logra moverse:
   - Se aplica velocidad inicial.
   - La fricción cinética comienza a desacelerar el objeto.

4. La simulación finaliza cuando la velocidad llega a cero.

---

# Estructura del Proyecto

```bash
📁 proyecto/
 ├── index.html
 ├── style.css
 ├── script.js
 └── README.md
```

---

# Archivos del Proyecto

## index.html
Contiene:
- La estructura principal.
- Inputs del usuario.
- Canvas de simulación.
- Panel de resultados.

---

## style.css
Contiene:
- Diseño visual.
- Responsive design.
- Estilos de interfaz.
- Colores y estructura.

---

## script.js
Contiene:
- Lógica física.
- Sistema de animación.
- Renderizado en canvas.
- Cálculos matemáticos.
- Movimiento del objeto.

---

# Posibles Mejoras Futuras

- Nuevos objetos físicos.
- Más superficies.
- Gráficas en tiempo real.
- Sonidos.
- Modo oscuro.
- Simulación 3D.
- Estadísticas avanzadas.
- Historial de simulaciones.

---

# Autor

Proyecto desarrollado como simulador educativo universitario para la asignatura de Física / Ingeniería de Sistemas.

---

# Licencia

Proyecto desarrollado con fines educativos.
