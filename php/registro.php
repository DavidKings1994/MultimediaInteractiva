<?php
	include "servicios.php";
	$var = new message;
    $var->registro($_POST["nombre"],$_POST["puntos"],$_POST["idPuntuacion"],$_POST["urlFoto"]);
?>
