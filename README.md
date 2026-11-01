# Keitaro Landing Behavior Tracker — Basic Edition

[English](#english) | [Українська](#українська)

## English

A small inline script that writes visitor behavior straight into the Keitaro click's sub IDs: time on page, VSL watched with sound, and whether the form came into view. You can then group Keitaro reports by these sub IDs and compare them with conversions.

For **local Keitaro v11 ZIP landing pages** only, opened through a tracker campaign.

### Installation

1. Open `index.html` or `index.php` of your local landing page.
2. Paste the **entire contents** of `keitaro-behavior-tracker-basic.js` before the closing `</body>` tag, wrapped in a `<script>` tag:

   ```html
   <script>
     /* contents of keitaro-behavior-tracker-basic.js */
   </script>
   ```

3. Upload/update the ZIP landing page in Keitaro and open it through a **test campaign**.
4. Check the report: `sub_id_15`, `sub_id_16`, `sub_id_19`.

**Important:** paste the code inline. Do not include `keitaro-behavior-tracker-basic.js` as an external `<script src="...">`: Keitaro substitutes the `{subid}` macro only inside the local `index.html`/`index.php`.

### Fields

- `sub_id_15`: time spent in a visible tab, rounded down to the last checkpoint passed from `CONFIG.timeCheckpoints`: `0005`, `0015`, `0030`, `0060`… The last checkpoint (`1200`) means "20 minutes or more".
- `sub_id_16`: the furthest HTML5 video position reached while playing with sound on, rounded down to `CONFIG.videoStepSec` (15 s): `0000/0185 (000%)`, `0015/0185 (008%)`, `0030/0185 (016%)`… `0000` means the sound was turned on but the viewer didn't reach second 15; `0185/0185 (100%)` means they reached the end. This is **not actual watch time**: seeking forward can inflate it.
- `sub_id_19`: events joined with `-`: `play` (video started), `sound` (played with sound on), `form` (form came into view). Always in the same order, e.g. `play-sound-form`. To see only visitors who heard the sound, filter the report by `sub_id_19` contains `sound`.

The `sub_id_15` and `sub_id_16` values are rounded on purpose: grouping a Keitaro report by these fields shows at which stage visitors drop off and lets you compare conversion rates between stages.

### Settings

Edit these at the top of the script: `CONFIG.timeCheckpoints`, `CONFIG.videoStepSec`, `CONFIG.videoSelector`, `CONFIG.formSelector`.

If the page has several videos, set an exact selector: `videoSelector: '#vsl-player'`.
Only **one native HTML5 video player** is supported; YouTube/Vimeo iframe players are not.

### Notes

- The sub IDs used here must not be used by other integrations in your campaign.
- Requests go **only to the current Keitaro domain**, path `/?_update_tokens=1`; no external services.
- `keepalive` is best-effort. It **does not guarantee** that the final state is delivered when the tab closes. If the final request runs in parallel with an older one, they may be processed in reverse order.
- Restoring state after F5 relies on `sessionStorage`; it is not server-side storage and not antifraud.
- Before public use, test it in your own Keitaro v11, in particular that a request to `/?_update_tokens=1` updates exactly the right click.

Keitaro docs: https://docs.keitaro.io/en/landing-pages-and-offers/update-params.html

---

## Українська

Невеликий inline-скрипт, який записує поведінку відвідувача прямо в саби кліку Keitaro: час на сторінці, перегляд VSL зі звуком і появу форми в полі зору. Ці саби можна групувати у звітах Keitaro і порівнювати з конверсіями.

Тільки для **локальних ZIP-лендингів Keitaro v11**, які відкриваються через кампанію трекера.

### Встановлення

1. Відкрийте `index.html` або `index.php` вашого локального лендингу.
2. Вставте **весь вміст** `keitaro-behavior-tracker-basic.js` перед закривальним тегом `</body>`, обгорнувши його в тег `<script>`:

   ```html
   <script>
     /* вміст keitaro-behavior-tracker-basic.js */
   </script>
   ```

3. Завантажте/оновіть ZIP-лендинг у Keitaro та відкрийте його через **тестову кампанію**.
4. Перевірте звіт: `sub_id_15`, `sub_id_16`, `sub_id_19`.

**Увага:** вставляйте код саме inline. Не підключайте `keitaro-behavior-tracker-basic.js` як зовнішній `<script src="...">`, оскільки макрос `{subid}` Keitaro підставляє тільки всередині локального `index.html`/`index.php`.

### Поля

- `sub_id_15`: час перебування у видимій вкладці, округлений вниз до останнього пройденого чекпоінта з `CONFIG.timeCheckpoints`: `0005`, `0015`, `0030`, `0060`… Останній чекпоінт (`1200`) означає «20 хв і більше».
- `sub_id_16`: найдальша позиція HTML5-відео, досягнута під час відтворення з увімкненою гучністю, округлена вниз до кроку `CONFIG.videoStepSec` (15 с): `0000/0185 (000%)`, `0015/0185 (008%)`, `0030/0185 (016%)`… `0000` — звук увімкнули, але до 15-ї секунди не дійшли; `0185/0185 (100%)` — дійшли до кінця. Це **не фактично переглянутий** час: перемотування може завищити показник.
- `sub_id_19`: події через `-`: `play` (відео запускалося), `sound` (відтворення з немутованою гучністю), `form` (форма з'явилася в полі зору). Значення у сталому порядку, наприклад `play-sound-form`. Щоб відібрати тих, хто чув звук, фільтруйте звіт за `sub_id_19` містить `sound`.

Значення `sub_id_15` і `sub_id_16` округлені навмисно: звіт Keitaro з групуванням за цими полями одразу показує, на якому етапі відвалюються відвідувачі, і дозволяє порівняти конверсію між етапами.

### Налаштування

На початку скрипта змінюйте `CONFIG.timeCheckpoints`, `CONFIG.videoStepSec`, `CONFIG.videoSelector`, `CONFIG.formSelector`.

Якщо на сторінці декілька відео, установіть точний селектор: `videoSelector: '#vsl-player'`.
Скрипт підтримує лише **один нативний HTML5-відеоплеєр**; iframe-плеєри YouTube/Vimeo не підтримуються.

### Зауваження

- Призначені `sub_id` не повинні використовуватися іншими інтеграціями вашої кампанії.
- Запити йдуть **тільки на поточний домен Keitaro**, шляхом `/?_update_tokens=1`; зовнішніх сервісів немає.
- `keepalive` — best-effort механізм. Він **не гарантує**, що фінальний стан буде доставлений при закритті вкладки. Якщо фінальний запит надходить паралельно зі старішим запитом, можливий зворотний порядок обробки.
- Відновлення після F5 базується на `sessionStorage`; це не серверне зберігання і не антифрод.
- Перед публічним використанням перевірте у своєму Keitaro v11: зокрема, що запит до `/?_update_tokens=1` оновлює параметри саме потрібного кліка.

Документація Keitaro: https://docs.keitaro.io/en/landing-pages-and-offers/update-params.html
