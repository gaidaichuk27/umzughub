<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Danke schön! Ihr Antrag wurde angenommen.</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/fav.png" sizes="32x32" />
<link href="/css/bootstrap.min.css" rel="stylesheet" media="screen">
<link rel="stylesheet" href="/style.css" />
<link href="/css/respons.css" rel="stylesheet" media="screen">

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NPGV4RNP');</script>
<!-- End Google Tag Manager -->


</head>

<body class="loaded">

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NPGV4RNP"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->


	<?php 
  error_reporting(E_ERROR);

    //в переменную $token нужно вставить токен, который нам прислал @botFather
    $token = "5112521548:AAGBW8LKLmxFNUIM0-d_FmwESZJPgy8lJIE";

    //нужна вставить chat_id (Как получить chad id, читайте ниже)
    $chat_id = "-4511764982";

    $arr = array(
      'Название: ' => 'Umzug-Hab',
      'Ваше имя: ' => $_POST['yourName'],
      'Телефон: ' => $_POST['yourPhone'],
      'Откуда: ' => $_POST['yourIn'],
      'Куда: ' => $_POST['yourOut'],
      'Количество комнат: ' => $_POST['yourPip'],
      'Этаж: ' => $_POST['yourPas'],
      'Тур: ' => $_POST['usluga'],
    );
    $txt = '';
    foreach($arr as $key => $value) {
   if($value) $txt .= "<b>".$key."</b> ".$value."%0A";
    };	

    $sendToTelegram = fopen("https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=html&text={$txt}","r");
	
	$mailto = "umzug.hab@gmail.com";
	
	mail($mailto, "Новая заявка" , str_replace(["%0A", '<b>', '</b>'], ["\r\n",'',''], $txt));

	?>

<div class="thanks-page">
<div class="container">
<div class="thanks-block">
<h1>Danke schön! Ihr Antrag wurde angenommen</h1>
<p>Unsere Manager werden sich in Kürze mit Ihnen in Verbindung setzen um die Details Ihrer Bestellung zu klären!</p>
<a href="/" title="Zurück zur Website">Zurück zur Website</a>
</div>
</div>
</div>
<script src="/js/jquery.js"></script> 
<script src="/js/bootstrap.min.js"></script> 
</body>
</html>