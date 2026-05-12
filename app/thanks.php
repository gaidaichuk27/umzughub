<?php
/**
 * Form thank-you page + optional Telegram + mail notifications.
 * Keep PHP notices off in production; never break the thank-you UI if remote calls fail.
 */
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

/**
 * Config: prefer environment variables on the server; fall back for legacy deploys.
 * Rotate the bot token if it was ever committed to a public repo.
 */
$telegramToken = getenv('TELEGRAM_BOT_TOKEN') ?: '5112521548:AAGBW8LKLmxFNUIM0-d_FmwESZJPgy8lJIE';
$telegramChatId = getenv('TELEGRAM_CHAT_ID') ?: '-4511764982';
$notifyEmail = getenv('FORM_NOTIFY_EMAIL') ?: 'umzughub@gmail.com';

$p = static function (string $key): string {
    return trim((string)($_POST[$key] ?? ''));
};

$arr = [
    'Name' => $p('yourName'),
    'Telefon' => $p('yourPhone'),
    'Umzug von' => $p('yourIn'),
    'Umzug nach' => $p('yourOut'),
    'Zimmer' => $p('yourPip'),
    'Etage' => $p('yourPas'),
    'Leistung / Formular' => $p('usluga'),
];

$lines = ['<b>Umzug-Hub</b> — neue Anfrage'];
foreach ($arr as $label => $value) {
    if ($value !== '') {
        $lines[] = '<b>' . htmlspecialchars($label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</b> '
            . htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
$telegramHtml = implode("\n", $lines);

/**
 * Telegram Bot API must receive UTF-8 via POST — raw GET URLs break on ä/ü/ß and long text.
 */
if ($telegramToken !== '' && $telegramChatId !== '') {
    $payload = http_build_query(
        [
            'chat_id' => $telegramChatId,
            'parse_mode' => 'HTML',
            'text' => $telegramHtml,
        ],
        '',
        '&',
        PHP_QUERY_RFC3986
    );

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 8,
            'ignore_errors' => true,
        ],
    ]);

    @file_get_contents(
        'https://api.telegram.org/bot' . $telegramToken . '/sendMessage',
        false,
        $ctx
    );
}

// Plain-text fallback for mail()
$plainBody = strip_tags(str_replace(["\r\n", "\n"], ' ', $telegramHtml));
$plainBody = html_entity_decode($plainBody, ENT_QUOTES | ENT_HTML5, 'UTF-8');

if ($notifyEmail !== '') {
    @mail(
        $notifyEmail,
        'Neue Anfrage Umzug-Hub',
        $plainBody !== '' ? $plainBody : '(Keine Felder ausgefüllt)',
        "Content-Type: text/plain; charset=UTF-8\r\n"
    );
}

?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Danke schön! Ihr Antrag wurde angenommen.</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/fav.png" sizes="32x32" />
<!-- Same bundle as the main site (webpack extracts app.css to dist root) -->
<link rel="stylesheet" href="/app.css">
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T9T954VT');</script>
</head>

<body class="loaded">

<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T9T954VT"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<div class="thanks-page">
<div class="container">
<div class="thanks-block">
<h1>Danke schön! Ihr Antrag wurde angenommen</h1>
<p>Unsere Manager werden sich in Kürze mit Ihnen in Verbindung setzen um die Details Ihrer Bestellung zu klären!</p>
<a href="/" title="Zurück zur Website">Zurück zur Website</a>
</div>
</div>
</div>

</body>
</html>
