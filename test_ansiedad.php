<?php
require_once '../includes/base_datos.php';

$id_colaborador = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Obtener información del colaborador
$stmt = $conexion->prepare("SELECT nombre, apellido FROM colaboradores WHERE id_colaborador = ?");
$stmt->bind_param("i", $id_colaborador);
$stmt->execute();
$result = $stmt->get_result();
$colaborador = $result->fetch_assoc();
$stmt->close();

if (!$colaborador) {
    echo "<div class='container mt-4'><div class='alert alert-danger'>";
    echo "<h4>Error</h4>";
    echo "<p>No se encontró el colaborador.</p>";
    echo "<a href='cargar_pruebas_psicometricas.php' class='btn btn-primary'>Volver</a>";
    echo "</div></div>";
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $respuestas = [];
    for ($i = 1; $i <= 20; $i++) {
        $respuestas[$i] = isset($_POST["pregunta_$i"]) ? (int)$_POST["pregunta_$i"] : 1;
    }

    $total_score = array_sum($respuestas);
    $ansiedad_level = round((($total_score - 20) / (80 - 20)) * (10 - 1) + 1);
    $ansiedad_level = max(1, min(10, $ansiedad_level));

    // Primero verificamos si ya existe un registro
    $check_sql = "SELECT * FROM pruebas_psicometricas WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
    $check_stmt = $conexion->prepare($check_sql);
    $check_stmt->bind_param("i", $id_colaborador);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $check_stmt->close();

    // Mapear nivel de ansiedad a valores de la tabla
    if ($ansiedad_level <= 3) {
        $nivel = "Bajo";
    } elseif ($ansiedad_level <= 6) {
        $nivel = "Moderado";
    } elseif ($ansiedad_level <= 8) {
        $nivel = "Alto";
    } else {
        $nivel = "Muy Alto";
    }

    if ($result->num_rows > 0) {
        // Si existe, actualizamos los campos de ansiedad
        $sql = "UPDATE pruebas_psicometricas
                SET ansiedad = ?, puntuacion_total = ?, nivel = ?, tipo_prueba = 'Ansiedad'
                WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("iisi", $ansiedad_level, $ansiedad_level, $nivel, $id_colaborador);
    } else {
        // Si no existe, insertamos un nuevo registro
        $sql = "INSERT INTO pruebas_psicometricas (id_colaborador, fecha_evaluacion, tipo_prueba, ansiedad, puntuacion_total, nivel)
                VALUES (?, CURDATE(), 'Ansiedad', ?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("iiis", $id_colaborador, $ansiedad_level, $ansiedad_level, $nivel);
    }
    $stmt->execute();
    $stmt->close();

    $resultado = [
        'total_score' => $total_score,
        'ansiedad_level' => $ansiedad_level
    ];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Ansiedad Laboral</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            font-size: 16px;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
        }
        .card {
            margin: 2rem auto;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
        }
        .card-title {
            font-size: 2.2rem;
            color: #2c3e50;
            margin-bottom: 1.5rem;
        }
        .card-text {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
        }
        .radio-group {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            flex-wrap: wrap;
            gap: 10px;
        }
        .question {
            background-color: #f8f9fa;
            padding: 1.5rem;
            margin-bottom: 1.2rem;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .question p {
            font-size: 1.15rem;
            margin-bottom: 1rem;
            color: #2c3e50;
        }
        .form-check {
            margin: 8px 0;
            min-width: 140px;
        }
        .form-check-label {
            font-size: 1rem;
            padding-left: 5px;
        }
        .form-check-input {
            margin-top: 0.3rem;
        }
        .alert {
            font-size: 1.1rem;
            margin: 1.5rem 0;
        }
        .alert h4 {
            font-size: 1.4rem;
            margin-bottom: 1rem;
        }
        .btn-primary {
            font-size: 1.1rem;
            padding: 0.5rem 2rem;
        }
        .text-center {
            margin-top: 2rem;
        }
        @media (max-width: 768px) {
            .radio-group {
                flex-direction: column;
            }
            .form-check {
                margin: 5px 0;
            }
            .question {
                padding: 1rem;
            }
            .card-title {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
<div class="container mt-4">
    <div class="card">
        <div class="card-body">
            <h1 class="card-title">Test de Ansiedad Laboral</h1>
            <p class="card-text">Colaborador: <strong><?php echo htmlspecialchars($colaborador['nombre'] . " " . $colaborador['apellido']); ?></strong></p>
            
            <?php if (isset($resultado)): ?>
                <div class="alert alert-info">
                    <h4>Resultados del Test</h4>
                    <p><strong>Puntuación Total:</strong> <?php echo $resultado['total_score']; ?> / 80</p>
                    <p><strong>Nivel de Ansiedad:</strong> 
                        <?php 
                        if ($resultado['total_score'] <= 35) echo "Bajo";
                        elseif ($resultado['total_score'] <= 50) echo "Moderado";
                        else echo "Alto";
                        ?> 
                        (<?php echo $resultado['ansiedad_level']; ?>/10)
                    </p>
                    <a href="cargar_pruebas_psicometricas.php" class="btn btn-primary">Volver</a>
                </div>
            <?php else: ?>
                <form method="POST" class="mt-4">
                    <?php
                    $enunciados = [
                        "Me siento nervioso o ansioso antes de ir al trabajo.",
                        "Tengo dificultades para concentrarme en mis tareas debido a preocupaciones laborales.",
                        "Siento que mi trabajo me abruma frecuentemente.",
                        "Me preocupo constantemente por cometer errores en mi trabajo.",
                        "Siento tensión o presión en el pecho cuando pienso en mis responsabilidades laborales.",
                        "Tengo problemas para dormir porque pienso en mi trabajo.",
                        "Me siento irritable o impaciente con mis compañeros de trabajo.",
                        "Siento que no puedo cumplir con las expectativas de mi jefe o equipo.",
                        "Experimentó palpitaciones o taquicardia cuando estoy en el trabajo.",
                        "Me siento agotado emocionalmente por las demandas de mi trabajo.",
                        "Tengo miedo de no poder manejar situaciones difíciles en el trabajo.",
                        "Siento que mi trabajo afecta negativamente mi vida personal.",
                        "Me preocupo por mi desempeño laboral incluso fuera del horario de trabajo.",
                        "Me preocupo por mi desempeño laboral incluso fuera del horario de trabajo.",
                        "Siento que no tengo control sobre las exigencias de mi trabajo.",
                        "Tengo pensamientos recurrentes sobre problemas laborales que no puedo controlar.",
                        "Siento una sensación de inquietud o nerviosismo durante mi jornada laboral.",
                        "Me siento inseguro sobre mi capacidad para realizar mis tareas laborales.",
                        "Siento que mi trabajo me genera estrés constante.",
                        "Tengo síntomas físicos (como dolores de cabeza o estómago) relacionados con mi trabajo.",
                        "Me siento ansioso por el futuro de mi carrera o estabilidad laboral."
                    ];

                    foreach ($enunciados as $i => $enunciado): 
                        $num = $i + 1;
                    ?>
                        <div class="question">
                            <p><strong><?php echo $num; ?>.</strong> <?php echo htmlspecialchars($enunciado); ?></p>
                            <div class="radio-group">
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="1" required class="form-check-input">
                                    <label class="form-check-label">Nunca</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="2" class="form-check-input">
                                    <label class="form-check-label">A veces</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="3" class="form-check-input">
                                    <label class="form-check-label">Frecuentemente</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="4" class="form-check-input">
                                    <label class="form-check-label">Siempre</label>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                    
                    <div class="text-center mt-4">
                        <button type="submit" class="btn btn-primary">Enviar Test</button>
                    </div>
                </form>
            <?php endif; ?>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
<?php cerrar_conexion_manual(); ?>