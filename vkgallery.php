<?php
define('TOKEN', 'тут_ваш_сервис_токен_из_vk.com');
$_GET['access_token'] = TOKEN;
$params = http_build_query($_GET);
$url = 'https://api.vk.com/method/photos.get?&' . $params;
echo file_get_contents($url);