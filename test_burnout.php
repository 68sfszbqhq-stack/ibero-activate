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

    for ($i = 1; $i <= 22; $i++) {
        $respuestas[$i] = isset($_POST["pregunta_$i"]) ? (int)$_POST["pregunta_$i"] : 0;
    }

    $ee_items = [1, 2, 3, 6, 8, 13, 14, 16, 20];
    $d_items = [5, 10, 11, 15, 22];
    $pa_items = [4, 7, 9, 12, 17, 18, 19, 21];

    $ee_score = 0;
    $d_score = 0;
    $pa_score = 0;

    foreach ($ee_items as $item) {
        $ee_score += $respuestas[$item];
    }
    foreach ($d_items as $item) {
        $d_score += $respuestas[$item];
    }
    foreach ($pa_items as $item) {
        $pa_score += $respuestas[$item];
    }

    $ee_normalized = ($ee_score / 54) * 100;
    $d_normalized = ($d_score / 30) * 100;
    $pa_normalized = 100 - (($pa_score / 48) * 100);

    $burnout_score = (0.4 * $ee_normalized + 0.4 * $d_normalized + 0.2 * $pa_normalized) / 10;
    $burnout_level = round(min(max($burnout_score, 1), 10));

    // Primero verificamos si ya existe un registro
    $check_sql = "SELECT * FROM pruebas_psicometricas WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
    $check_stmt = $conexion->prepare($check_sql);
    $check_stmt->bind_param("i", $id_colaborador);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $check_stmt->close();

    // Mapear nivel de burnout a valores de la tabla
    if ($burnout_level <= 3) {
        $nivel = "Bajo";
    } elseif ($burnout_level <= 6) {
        $nivel = "Moderado";
    } elseif ($burnout_level <= 8) {
        $nivel = "Alto";
    } else {
        $nivel = "Muy Alto";
    }

    if ($result->num_rows > 0) {
        // Si existe, actualizamos los campos de burnout
        $sql = "UPDATE pruebas_psicometricas
                SET burnout = ?, puntuacion_total = ?, nivel = ?, tipo_prueba = 'Burnout'
                WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("iisi", $burnout_level, $burnout_level, $nivel, $id_colaborador);
    } else {
        // Si no existe, insertamos un nuevo registro
        $sql = "INSERT INTO pruebas_psicometricas (id_colaborador, fecha_evaluacion, tipo_prueba, burnout, puntuacion_total, nivel)
                VALUES (?, CURDATE(), 'Burnout', ?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("iiis", $id_colaborador, $burnout_level, $burnout_level, $nivel);
    }
    $stmt->execute();
    $stmt->close();

    $resultado = [
        'ee_score' => $ee_score,
        'd_score' => $d_score,
        'pa_score' => $pa_score,
        'burnout_level' => $burnout_level
    ];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Burnout de Maslach</title>
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
            <h1 class="card-title">Test de Burnout de Maslach</h1>
            <p class="card-text">Colaborador: <strong><?php echo htmlspecialchars($colaborador['nombre'] . " " . $colaborador['apellido']); ?></strong></p>
            
            <?php if (isset($resultado)): ?>
                <div class="alert alert-info">
                    <h4>Resultados del Test</h4>
                    <p><strong>Agotamiento Emocional (EE):</strong> <?php echo $resultado['ee_score']; ?> / 54 
                        (<?php 
                            if ($resultado['ee_score'] <= 18) echo "Bajo";
                            elseif ($resultado['ee_score'] <= 26) echo "Medio";
                            else echo "Alto";
                        ?>)
                    </p>
                    <p><strong>Despersonalización (D):</strong> <?php echo $resultado['d_score']; ?> / 30 
                        (<?php 
                            if ($resultado['d_score'] <= 5) echo "Bajo";
                            elseif ($resultado['d_score'] <= 9) echo "Medio";
                            else echo "Alto";
                        ?>)
                    </p>
                    <p><strong>Realización Personal (PA):</strong> <?php echo $resultado['pa_score']; ?> / 48 
                        (<?php 
                            if ($resultado['pa_score'] <= 25) echo "Bajo";
                            elseif ($resultado['pa_score'] <= 31) echo "Medio";
                            else echo "Alto";
                        ?>)
                    </p>
                    <p><strong>Nivel de Burnout:</strong> <?php echo $resultado['burnout_level']; ?>/10</p>
                    <a href="cargar_pruebas_psicometricas.php" class="btn btn-primary">Volver</a>
                </div>
            <?php else: ?>
                <form method="POST" class="mt-4">
                    <?php
                    $enunciados = [
                        "Debido a mi trabajo me siento emocionalmente agotado o agotada.",
                        "Al final del día me siento agotado o agotada.",
                        "Me encuentro cansado o cansada cuando me levanto por la mañana y tengo que enfrentarme a otro día de trabajo.",
                        "Puedo entender con facilidad lo que piensan las personas con quienes trabajo.",
                        "Creo que trato a las personas como si fueran objetos.",
                        "Trabajar con personas todos los días es una tensión para mí.",
                        "Me enfrento muy bien a los problemas de trabajo que se me presentan.",
                        "Me siento 'quemado' o 'quemada' por mi trabajo.",
                        "Siento que con mi trabajo estoy influyendo positivamente en la vida de otros.",
                        "Creo que tengo un trato más insensible con las personas desde que tengo este trabajo.",
                        "Me preocupa que este trabajo me esté endureciendo emocionalmente.",
                        "Me encuentro con mucha vitalidad.",
                        "Me siento frustrado por mi trabajo.",
                        "Siento que estoy haciendo un trabajo muy duro.",
                        "Realmente no me importa lo que pueda suceder a las personas que me rodean.",
                        "Trabajar directamente con personas me produce estrés.",
                        "Tengo facilidad para crear un ambiente de confianza con las personas con quienes trabajo.",
                        "Me encuentro relajado después de una junta de trabajo.",
                        "He realizado muchas cosas que valen la pena en este trabajo.",
                        "En el trabajo siento que estoy al límite de mis posibilidades.",
                        "Siento que sé tratar de forma adecuada los problemas emocionales en el trabajo.",
                        "Siento que las personas en mi trabajo me culpan de algunos de sus problemas."
                    ];

                    foreach ($enunciados as $i => $enunciado): 
                        $num = $i + 1;
                    ?>
                        <div class="question">
                            <p><strong><?php echo $num; ?>.</strong> <?php echo htmlspecialchars($enunciado); ?></p>
                            <div class="radio-group">
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="0" required class="form-check-input">
                                    <label class="form-check-label">Nunca</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="1" class="form-check-input">
                                    <label class="form-check-label">Alguna vez al año o menos</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="2" class="form-check-input">
                                    <label class="form-check-label">Una vez al mes o menos</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="3" class="form-check-input">
                                    <label class="form-check-label">Algunas veces al mes</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="4" class="form-check-input">
                                    <label class="form-check-label">Una vez a la semana</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="5" class="form-check-input">
                                    <label class="form-check-label">Varias veces a la semana</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" name="pregunta_<?php echo $num; ?>" value="6" class="form-check-input">
                                    <label class="form-check-label">Todos los días</label>
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