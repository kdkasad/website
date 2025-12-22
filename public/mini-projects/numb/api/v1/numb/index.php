<?php

header('Content-type: application/json');

$input = $_GET['stdin'];

$descriptorspec = array(
	0 => array('pipe', 'r'),
	1 => array('pipe', 'w'),
	2 => array('pipe', 'w'),
);

$proc = proc_open('numb', $descriptorspec, $pipes, null, null, null);
if (is_resource($proc)) {
	$stdin = $pipes[0];
	$stdout = $pipes[1];
	$stderr = $pipes[2];

	fwrite($stdin, $input);
	fclose($stdin);

	$output = stream_get_contents($stdout);
	fclose($stdout);
	$errout = stream_get_contents($stderr);
	fclose($stderr);

	$exitcode = proc_close($proc);

	$data = array(
		'exitCode' => $exitcode,
		'stdout' => $output,
		'stderr' => $errout
	);
	echo json_encode($data);
} else {
	http_response_code(500);
	$data = array(
		'error' => error_get_last()
	);
	echo json_encode($data);
}

?>
