<?php

$name = $_POST['name'];
$history = json_decode($_POST['history'], true);

$entry = array(
	"name" => $name,
	"history" => $history
);

$log = json_decode(file_get_contents("log.txt"), true);
array_push($log, $entry);

file_put_contents("log.txt", json_encode($log));

echo '{"status":"success"}';

$to = 'kasad.com Web Master <webmaster@kasad.com>';
$subject = 'Tic Tac Toe winner';
$message = file_get_contents('email-template.txt');
$message = str_replace('%name%', $name, $message);

mail($to, $subject, $message);

?>
