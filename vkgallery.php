<?php

require_once('./vendor/autoload.php');

define('TOKEN', 'тут_ваш_сервис_токен_из_vk.com');
$_GET['access_token'] = TOKEN;
$params = http_build_query($_GET);
$url = 'https://api.vk.com/method/photos.get?&' . $params;

$client = new \GuzzleHttp\Client();
$res = $client->request('GET', $url);
if ($res->getStatusCode() === 200) {
    echo $res->getBody();
} else {
    echo json_encode(['errors' => ['Guzzle Request Error', $res->getBody()]]);
}