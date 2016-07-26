<?php
	include "servicios.php";
	$var = new message;
    $var->registro($_POST["nombre"],$_POST["puntos"]);
	header("Location: ../index.php");
?>
