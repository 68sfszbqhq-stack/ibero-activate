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
    $puntaje_total = 0;

    for ($i = 1; $i <= 9; $i++) {
        $respuesta = isset($_POST["pregunta_$i"]) ? (int)$_POST["pregunta_$i"] : 0;
        $respuestas[] = $respuesta;
        $puntaje_total += $respuesta;
    }

    if ($puntaje_total <= 4) {
        $nivel_depresion = "Depresión mínima";
    } elseif ($puntaje_total <= 9) {
        $nivel_depresion = "Depresión leve";
    } elseif ($puntaje_total <= 14) {
        $nivel_depresion = "Depresión moderada";
    } elseif ($puntaje_total <= 19) {
        $nivel_depresion = "Depresión moderadamente severa";
    } else {
        $nivel_depresion = "Depresión severa";
    }

    // Primero verificamos si ya existe un registro
    $check_sql = "SELECT * FROM pruebas_psicometricas WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
    $check_stmt = $conexion->prepare($check_sql);
    $check_stmt->bind_param("i", $id_colaborador);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $check_stmt->close();

    // Mapear nivel de depresión a valores de la tabla
    if ($puntaje_total <= 4) {
        $nivel = "Bajo";
    } elseif ($puntaje_total <= 9) {
        $nivel = "Moderado";
    } elseif ($puntaje_total <= 14) {
        $nivel = "Alto";
    } else {
        $nivel = "Muy Alto";
    }

    if ($result->num_rows > 0) {
        // Si existe, actualizamos los campos de depresión
        $sql = "UPDATE pruebas_psicometricas
                SET depresion = ?, puntuacion_total = ?, nivel = ?, tipo_prueba = 'Depresión'
                WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("iisi", $puntaje_total, $puntaje_total, $nivel, $id_colaborador);
    } else {
        // Si no existe, insertamos un nuevo registro
        $sql = "INSERT INTO pruebas_psicometricas (id_colaborador, fecha_evaluacion, tipo_prueba, depresion, puntuacion_total, nivel)
                VALUES (?, CURDATE(), 'Depresión', ?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("iiis", $id_colaborador, $puntaje_total, $puntaje_total, $nivel);
    }
    $stmt->execute();
    $stmt->close();

    $resultado = [
        'puntaje_total' => $puntaje_total,
        'nivel_depresion' => $nivel_depresion
    ];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Depresión (PHQ-9)</title>
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
            <h1 class="card-title">Test de Depresión (PHQ-9)</h1>
            <p class="card-text">Colaborador: <strong><?php echo htmlspecialchars($colaborador['nombre'] . " " . $colaborador['apellido']); ?></strong></p>
            
            <?php if (isset($resultado)): ?>
                <div class="alert alert-info">
                    <h4>Resultados del Test</h4>
                    <p><strong>Puntaje Total:</strong> <?php echo $resultado['puntaje_total']; ?>/27</p>
                    <p><strong>Nivel de Depresión:</strong> <?php echo $resultado['nivel_depresion']; ?></p>
                    <a href="cargar_pruebas_psicometricas.php" class="btn btn-primary">Volver</a>
                </div>
            <?php else: ?>
                <form method="POST" class="mt-4">
                    <?php
                    $enunciados = [
                        "Poco interés o placer en hacer cosas",
                        "Sentirse deprimido, triste o sin esperanzas",
                        "Dificultad para conciliar o mantener el sueño, o dormir demasiado",
                        "Sentirse cansado o con poca energía",
                        "Poco apetito o comer en exceso",
                        "Sentirse mal consigo mismo, o que es un fracaso, o que ha decepcionado a su familia o a sí mismo",
                        "Dificultad para concentrarse en cosas, como leer el periódico o ver televisión",
                        "Moverse o hablar tan despacio que otras personas lo han notado, o lo contrario, estar tan inquieto o agitado que ha estado moviéndose más de lo habitual",
                        "Pensamientos de que estaría mejor muerto o de hacerse daño de alguna manera"
                    ];

                    foreach ($enunciados as $i => $enunciado): 
                        $num = $i + 1;
                    ?>
                        <div class="question">
                            <p><strong><?php echo $num; ?>.</strong> <?php echo htmlspecialchars($enunciado); ?></p>
                            <div class="radio-group">
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="0" required class="form-check-input">
                                    <label class="form-check-label">Nada</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="1" class="form-check-input">
                                    <label class="form-check-label">Varios días</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="2" class="form-check-input">
                                    <label class="form-check-label">Más de la mitad de los días</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="3" class="form-check-input">
                                    <label class="form-check-label">Casi todos los días</label>
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