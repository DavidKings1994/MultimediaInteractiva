<?php
	require_once ('./../vendor/deviservi/nusoap/lib/nusoap.php');
	ini_set("soap.wsdl_cache_enabled", "0");

	class message
	{
		function get_message($id) {
			$client = new nusoap_client('http://www.multimediainteractiva.ga/php/soap_server.php?wsdl',"wsdl");
			$resul = $client->call('get_message', array('name'=>$id));
			$err = $client->getError();
			if ($err) {
				echo '<h2>Constructor error</h2>' . $err;
			    exit();
			}
			if($client->fault) {
				echo "FAULT: <p>Code: (".$client->faultcode."</p>";
				echo "String: ".$client->faultstring;
			} else {
				return $resul;
			}
		}
		function registro($nombre, $puntos) {
			$client = new nusoap_client('http://www.multimediainteractiva.ga/php/soap_server.php?wsdl',"wsdl");
			$resul = $client->call('registro', array('nombre'=>$nombre, 'puntos'=>$puntos));
			$err = $client->getError();
			if ($err) {
				echo '<h2>Constructor error</h2>' . $err;
			    exit();
			}
			if($client->fault) {
				echo "FAULT: <p>Code: (".$client->faultcode."</p>";
				echo "String: ".$client->faultstring;
			} else {
				return $resul;
			}
		}
		function leaderBoard()
		{
			$client = new nusoap_client('http://www.multimediainteractiva.ga/php/soap_server.php?wsdl',"wsdl");
			$resul = $client->call('leaderBoard');
			$err = $client->getError();
			if ($err) {
				echo '<h2>Constructor error</h2>' . $err;
			    exit();
			}
			if($client->fault) {
				echo "FAULT: <p>Code: (".$client->faultcode."</p>";
				echo "String: ".$client->faultstring;
			} else {
				return $resul;
			}
		}
	}
?>
