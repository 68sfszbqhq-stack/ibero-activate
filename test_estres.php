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
    $respuestas = [
        'carga_trabajo' => (int)$_POST['carga_trabajo'],
        'control' => (int)$_POST['control'],
        'apoyo' => (int)$_POST['apoyo'],
        'relaciones' => (int)$_POST['relaciones'],
        'rol' => (int)$_POST['rol'],
        'cambio' => (int)$_POST['cambio']
    ];
    
    // Calcular puntaje total (0-24, mayor puntaje = mayor estrés)
    $estres_total = array_sum($respuestas);
    
    // Primero verificamos si ya existe un registro
    $check_sql = "SELECT * FROM pruebas_psicometricas WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
    $check_stmt = $conexion->prepare($check_sql);
    $check_stmt->bind_param("i", $id_colaborador);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $check_stmt->close();

    // Determinar nivel basado en el puntaje
    $nivel = $estres_total <= 8 ? "Bajo" : ($estres_total <= 16 ? "Moderado" : "Alto");

    if ($result->num_rows > 0) {
        // Si existe, actualizamos los campos de estrés
        $sql = "UPDATE pruebas_psicometricas
                SET estres = ?, puntuacion_total = ?, nivel = ?, tipo_prueba = 'Estrés'
                WHERE id_colaborador = ? AND fecha_evaluacion = CURDATE()";
        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            echo "<div class='alert alert-danger'>Error en la preparación de la consulta UPDATE: " . $conexion->error . "</div>";
            exit();
        }
        $stmt->bind_param("iisi", $estres_total, $estres_total, $nivel, $id_colaborador);
    } else {
        // Si no existe, insertamos un nuevo registro
        $sql = "INSERT INTO pruebas_psicometricas (id_colaborador, fecha_evaluacion, tipo_prueba, estres, puntuacion_total, nivel)
                VALUES (?, CURDATE(), 'Estrés', ?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            echo "<div class='alert alert-danger'>Error en la preparación de la consulta INSERT: " . $conexion->error . "</div>";
            exit();
        }
        $stmt->bind_param("iiis", $id_colaborador, $estres_total, $estres_total, $nivel);
    }
    if (!$stmt->execute()) {
        echo "<div class='alert alert-danger'>Error al guardar los resultados: " . $stmt->error . "</div>";
        $stmt->close();
        exit();
    }
    $stmt->close();
    
    $resultado = [
        'estres_total' => $estres_total,
        'nivel_estres' => $estres_total <= 8 ? "Bajo" : ($estres_total <= 16 ? "Moderado" : "Alto")
    ];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Estrés Laboral (OMS)</title>
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
            <h1 class="card-title">Test de Estrés Laboral (OMS)</h1>
            <p class="card-text">Colaborador: <strong><?php echo htmlspecialchars($colaborador['nombre'] . " " . $colaborador['apellido']); ?></strong></p>
            
            <?php if (isset($resultado)): ?>
                <div class="alert alert-info">
                    <h4>Resultados del Test</h4>
                    <p><strong>Puntaje Total:</strong> <?php echo $resultado['estres_total']; ?>/24</p>
                    <p><strong>Nivel de Estrés:</strong> <?php echo $resultado['nivel_estres']; ?></p>
                    <a href="cargar_pruebas_psicometricas.php" class="btn btn-primary">Volver</a>
                </div>
            <?php else: ?>
                <form method="POST" class="mt-4">
                    <?php
                    $enunciados = [
                        "¿Sientes que tu carga de trabajo es excesiva?",
                        "¿Tienes control sobre cómo realizas tu trabajo?",
                        "¿Recibes apoyo suficiente de tus superiores y compañeros?",
                        "¿Cómo son tus relaciones interpersonales en el trabajo?",
                        "¿Está claro tu rol y responsabilidades en el trabajo?",
                        "¿Cómo manejas los cambios en tu entorno laboral?"
                    ];

                    $nombres_campos = [
                        'carga_trabajo',
                        'control',
                        'apoyo',
                        'relaciones',
                        'rol',
                        'cambio'
                    ];

                    foreach ($enunciados as $i => $enunciado): 
                        $num = $i + 1;
                    ?>
                        <div class="question">
                            <p><strong><?php echo $num; ?>.</strong> <?php echo htmlspecialchars($enunciado); ?></p>
                            <div class="radio-group">
                                <?php if (in_array($nombres_campos[$i], ['carga_trabajo'])): ?>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="0" required class="form-check-input">
                                        <label class="form-check-label">Nada</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="1" class="form-check-input">
                                        <label class="form-check-label">Poco</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="2" class="form-check-input">
                                        <label class="form-check-label">Moderado</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="3" class="form-check-input">
                                        <label class="form-check-label">Bastante</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="4" class="form-check-input">
                                        <label class="form-check-label">Mucho</label>
                                    </div>
                                <?php else: ?>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="4" required class="form-check-input">
                                        <label class="form-check-label">Mucho/Muy bueno</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="3" class="form-check-input">
                                        <label class="form-check-label">Bastante/Bueno</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="2" class="form-check-input">
                                        <label class="form-check-label">Moderado/Regular</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="1" class="form-check-input">
                                        <label class="form-check-label">Poco/Malo</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="radio" name="<?php echo $nombres_campos[$i]; ?>" value="0" class="form-check-input">
                                        <label class="form-check-label">Nada/Muy malo</label>
                                    </div>
                                <?php endif; ?>
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