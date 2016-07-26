<?php
	ini_set('display_errors', 'off');
	$GLOBALS['HTTP_RAW_POST_DATA'] = file_get_contents ('php://input');
	$HTTP_RAW_POST_DATA = $GLOBALS['HTTP_RAW_POST_DATA'];

	require_once('./../vendor/deviservi/nusoap/lib/nusoap.php');

	ini_set("soap.wsdl_cache_enabled", "0");
	$URL = "http://www.multimediainteractiva.ga/php/soap_server.php";
	$namespace = $URL.'?wsdl';

	function connect()
	{
		$link = mysqli_connect('localhost', 'root', 'jjkli8jlkjlu', 'mia')
	    	or die('No se pudo conectar: ' . mysql_error());
	    	return $link;
	}

	$server = new nusoap_server;
	$server->configureWSDL('server', "urn:server");
	$server->wsdl->schemaTargetNamespace = "urn:server";

	$server->register('get_message',array("name" => "xsd:string"),array("return" => "xsd:string"),"urn:server","urn:server#get_message",'rpc','encoded','Just say hello');
	$server->register('registro',array("nombre" => "xsd:string", "puntos" => "xsd:string"),array(),"urn:server","urn:server#registro",'rpc','encoded','registra puntuaciones');
	$server->register('leaderBoard',array(),array("return" => "xsd:string"),"urn:server","urn:server#leaderBoard",'rpc','encoded','todos los datos');

	function get_message($name)
	{
		if(!isset($name))
		{
			return new soap_fault('Client','','Put Your Name!');
		}
		$result = "Welcome to ".$name.". Thanks for Your First Web Service Using PHP with SOAP";
		return $result;
	}

	function registro($nombre, $puntos)
	{
		$link = connect();
		$query = mysqli_prepare($link, "CALL resgistrarPuntuacion(?,?);");
		$query->bind_param('si', $nombre, $puntos);
		$query->execute();
		if(!$query)
		{
			echo "CALL failed: (" . $link->errno . ") " . $link->error;
		}
	}

	function leaderBoard()
	{
		$link = connect();
		$resul = mysqli_query($link, "CALL mostrarPuntuaciones();");
		$row = array();
		while($r = mysqli_fetch_assoc($resul))
		{
			$row[] = $r;
		}
		return json_encode($row);
	}

	$server->service($HTTP_RAW_POST_DATA);
	exit();
?>
