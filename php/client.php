<?php
	require_once ('./../vendor/deviservi/nusoap/lib/nusoap.php');
	ini_set("soap.wsdl_cache_enabled", "0");
	$client = new soapclient('http://www.multimediainteractiva.ga/php/soap_server.php?wsdl', array("trace" => 1, "exception" => 0));

	$resul = $client->call('get_message', array('name'=>'David'));
	if($client->fault) {
		echo "FAULT: <p>Code: (".$client->faultcode."</p>";
		echo "String: ".$client->faultstring;
	} else {
		echo $resul;
	}
?>
