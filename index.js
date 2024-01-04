let started = false;
let recording = false;
let hiddenPad = false;
let placeholderStrings = [
    [['Вве', -1], ['ди', -1], ['те ', -1], ['текст', -1]],
    [['En', -1], ['ter ', -1], ['the ', -1], ['text', -1]]
]; 
let strings = editor.children;
let syllables = editor.getElementsByTagName('a');
let syllableCursor = -1;
let stringCursor = 0;
let isSecondString = false;
let timer = -1;
let timelineDuration = scale.textContent = 10; //в секундах
let timelinePosition = 0;
let timelineTimer = -1;
let spanSyllableMap = new WeakMap();
let syllableSpanMap = new Map();
let wordsYoffset = .75;
let lineSpacing = 1.4; //todo extra
let bgX = 0;
let bgY = 0;
var img = new Image;
let songName = '';
let rightSyllableColor = 'yellow';
let leftSyllableColor = 'red';
const isMobile = ('ontouchstart' in window);
let latency = isMobile ? 300 : 0;
if (isMobile) latencyInput.value = latency;
lineSpacingInput.value = lineSpacing;
let wakeLock = null;
let loopMode = false;
let cursorAnimationPlayer = null;
let loopStartTime = -1;

var bgCanvasContext = backgroundCanvas.getContext("2d");
var canvasContext = textCanvas.getContext("2d");
var padCanvasContext = padCanvas.getContext("2d");
var renderCanvasContext = renderCanvas.getContext('2d');
canvasContext.font = `${Math.ceil(textCanvas.width / 24)}px Arial`;
canvasContext.textAlign = "left";
canvasContext.textBaseline = 'top'; //горизонтальная линия проходящая в самом низу текста или вверху
canvasContext.fillStyle = "yellow";

//todo закешируй prevString. и если текущая строка !== prevString то пересчитать метрики. Их тоже закешировать

//проблемы с буковй ё. остаё не делится на два слога, своём
//todo тест мобильной версии

//#extra scale сделать contenteditable при dblclick

//порядок слоёв
//фон
//картинка / видео
//текст с подложкой

//для desktop сделать проще. если зажат e.shiftKey будет мультивыделение

//для мобильной версии мультивыделение реализовать
//касанием сначала одним пальцем слева, потом другим справа в нужном диапазоне
//касание слева фиксируется на следующий элемент span, если нет то на первый

//todo стиль для выделенных span. добавлять класс для всех draggable или всегда отслеживать text.onselectstart и document.onselectionchange внутри span если он parent.id === 'words'
//сделать bg другого цвета. 

//после входа создается fixed button выйти из полноекранного.
//по умолчанию она display none, после касания становится видимой на 4 секунды

//todo extra
//мультитач жест zoom для увеличения размера шрифта
//на компьютере - колесико мыши
//тоже самое и с фоновым изображением

//extra возможность добавить фоновое видео
//при удержании пальца/кнопки слог тянется
//мультивыделение при удержании

//при рендере написать сообщение. Пожалйста дождитесь окончания рендера, не закрывайте вкладку(иначе reqFrame заморозится)

//todo интерактивный редактор шрифта на холсте, мини toolpicker.
//сделать так, чтобы этот div был всегда, но клик на нее не срабатывал при !started
//если при !started кликнули в области canvas .75(перенести в переменную) + metrics.actualBoundingBoxDescent + lineSpase + metrics.actualBoundingBoxDescent
//появляется прямоугольная область с шириной в canvas и высотой в строки. 
//Она draggable, её можно перемещать по оси y. При этом перемещается текст по оси y согласно новой координате div top
//Вверху слева этой области или по центру toolbar. 
//в нём: карандашик(вызов редактора текста), шрифт, lineSpacing, цвет закрашенных/не слогов, цвет подложки
//Если потянуть область за верхний край - изменится lineSpacing. За нижний - размер шрифта

//по умолчанию написать в канвас "Введите \n текст" или Text\nText
//растянуть невидимый inputFile на всю ширину canvas при первоначальной загрузке чтобы кликнув на него 
//или найти способ ручного вызова меню выбора файла при клике любого элемента

//При клике на картинку. появляется draggable div представитель картинки. по центру canvas появляется input#size

//нужно ли видео.
//что представляет из себя большинство задних планов караоке видео
//статичная картинка опционально с эффектами(kalinka)
//движущийся фон типа космос и орнаменты(karaoke4u)
//клип или видео(черевато баном youtube, т.к. с него же видео и берутся)
//если у человека есть видео значит он продвинутый пользователь т.е. может скачивать видео,
//пользоваться видеоредактором и использовать хромокей. 
//Значит он может здесь создать видео с ритмическим караоке текстом, удалить хромокей в видеоредакторе и вставить свое видео
//видео в планах extra
//задачи для видео. смещение по времени, так как минусовка может не попадать
//если делать видео то:
//всё действия с отображением строки, все таймеры переносятся в worker
//если делать плавное заполнение, отрисовку отдать worker'у чтобы не блокировать поток. 
//в requestFrame проверять процент заполнение(остальное в заметках)

//при рендере видео вместо картинки. в основном потоке рекурсивный reqAnimFrame рисует bg, видео, подложку, текст
//worker(тк основной поток занят циклом rqFrame) занимается отрисовкой изменений текста по таймеру согласно ритму в свои canvas'ы

//Откудать брать аудио. Если есть аудио то с него(в приоритете). Если аудио нет а есть видео, берём с видео. 
//аудио controls при наличии видео управляет и видео
//Показывать плейсхолдер и срабатывать этот обработчик только тогда
//когда  пуст

//todo воркер для стрима видео на canvas
//https://developer.mozilla.org/en-US/docs/Web/API/MediaSourceHandle только chromium

//todo возможность редактировать(удалять изменять склеивать) слоги в таймлайне. даблклик активирует редактор навешивает на span contenteditable.
//или инструменты клей и ножницы в тулбаре с соответствующими кликами 

//extra шкала секунд на таймлайне

//todo grey вместо brown для слогов без time

//todo мини input редактор времени слога под курсором в editor 

//todo на screenToolpicker добавить если загружено видео input смещение времени видео от 0.
//если > 0, если < 0 перемотка вперед и start, если > 0, несколько секунд черного экрана и плей

//todo fix следа буквы ё

//todo возможность стирать первую строку

//onbefore backspace/del caret prevent  если остался один симв удалить его - вставить br
//todo нельзя просто так взять выделить и написать слово вместо выделенного

//не мешает
//max-width height 100v для renderCanvas(не мешает)
//фикс странного fontsize

//extra кнопка выгрузить проект downloadJSONButton. кнопка загрузить проект из json
//исправить: при нажатии на ножницы и toolbar editor теряет курсор
//почистить код

//инструкция
/*
скрытый checkbox и язык в editor
кнопка del или backspace по выделенным span обнулит их время
Мультивыделение. лкм по первому слогу, зажать шифт и лкм по второму
компенсация задержки. при использовании на телефоне здесь ставим 500 так как отклик на касание происходит не сразу. вам может подходить другое значение, проэксперементируйте
первую строку стереть так. ставим курсор в начало второй и жмем стереть
*/

//todo нормальный fontsize

//сохранение в localstorage всех настроек:
//размер шрифта
//linespacing из переменной
//y offset
//updatelocalstorage xysize для картинки делать только если эта картинка есть. саму картинку не созранять. если в ls есть сведения xysize то не центрировать и применить их
//цвет подложки
//эти настройки будут отдельной записью с префиксом settngs(не со слогами) и будут обновляться toolkit onblur или также повесить mutationObserver

//переделать сохранение updateLocalstorageText
//будет через 10 сек после срабатывания mutationObserver. При повторном срабатывании обнулится и снова запустится setTimeout(commitChanges)

//в toolbar кнопки завернуть в два flexbox чтобы выровнять
//дизайн, выбрать шрифт интерфейса

gotoSyllableTimeButton.onclick = () => {
    const sel = document.getSelection();
    const a = sel.anchorNode.nodeType === Node.TEXT_NODE ? sel.anchorNode.parentElement : sel.anchorNode;
    let nearLeftTime = 0;

    let i = Array.prototype.indexOf.call(syllables, a);
    for (; i > -1; i--) {
        const time = +syllables[i].dataset.time;
        if (time + 1) {
            nearLeftTime = time;
            break;
        }
    }

    if (started) {
        audio.currentTime = nearLeftTime;
        cursorAnimationPlayer.cancel();
        clearTimeout(timelineTimer);
        clearTimeout(timer);
        setCursorPosition();
        showStringsByPosition();
        showTimeline(audio.currentTime, timelineDuration);
        runCursor();
        play();
    } else 
        audio.currentTime = nearLeftTime;
    
    wordEditor.style.display = '';
}

let lastSelectedSyllables = null;

const cloneSyllablesBySpanRange = inEditor => () => {
    const sel = document.getSelection();
    const spansRange = sel.getRangeAt(0);
    const syllablesRange = document.createRange();
    const startSyllable = inEditor ? spansRange.startContainer?.parentElement : spanSyllableMap.get(spansRange.startContainer?.parentElement);
    const endSyllable = inEditor ? spansRange.endContainer?.parentElement : spanSyllableMap.get(spansRange.endContainer?.parentElement);
    if (!startSyllable || !endSyllable) return;
    syllablesRange.setStartBefore(startSyllable); 
    syllablesRange.setEndAfter(endSyllable);
    lastSelectedSyllables = syllablesRange.cloneContents();
    if (lastSelectedSyllables?.children?.length && lastSelectedSyllables?.firstElementChild?.tagName === 'A') {
        const li = document.createElement('li');
        li.append(lastSelectedSyllables);
        lastSelectedSyllables = li;
    }
    pasteTimelineButton.hidden = false;
}

const pasteSelectedSyllables = () => {
    if (!lastSelectedSyllables) return;
    const currentTime = audio.currentTime;
    let allA = lastSelectedSyllables.querySelectorAll('a');
    let currentString = strings[stringCursor];

    let endTime = Infinity;
    if (currentString?.firstElementChild) {
        let i = Array.prototype.indexOf.call(syllables, currentString?.firstElementChild);
        for (; i < syllables.length; i++) {
            const time = +syllables[i].dataset.time;
            if (time + 1) {
                endTime = time;
                break;
            }
        }
    }

    let isCrop = false;
    let firstTime = -1;
    let lastTime = -1;
    allA.forEach(a => {
        const crop = () => {
            let li = a.parentElement;
            a.remove();
            if (li?.children?.length === 0) 
                li.remove();
        }
        if (isCrop) {
            crop();
            return;
        }
        const time = +a.dataset.time;
        if (!(time + 1)) return; 
        //если время установлено
        if (!~firstTime) {
            firstTime = time;
            a.dataset.time = currentTime;
        } else {
            const delta = a.dataset.time - firstTime;
            a.dataset.time = lastTime = currentTime + delta;
            if (lastTime > endTime) {
                isCrop = true;
                crop();
            }
        }
    });

    allA = lastSelectedSyllables.querySelectorAll('a');

    if (currentString) currentString.before(lastSelectedSyllables);
    else editor.append(lastSelectedSyllables);

    
    showTimeline(timelinePosition, timelineDuration, lastTime > timelinePosition + timelineDuration ? lastTime : 0);
    cursor.style.left = getTimelinePercent() + '%';

    if (started) {
        cursorAnimationPlayer.cancel();
        clearTimeout(timelineTimer);
        clearTimeout(timer);
        setCursorPosition();
        showStringsByPosition();
        runCursor();
        play();
    } else {
        setCursorPosition();
        showStringsByPosition();
    }

    const first = syllableSpanMap.get(allA[0]);
    const last = syllableSpanMap.get(allA[allA.length - 1]) || words.lastElementChild;
    const range = document.createRange();
    range.setStart(first.firstChild, 0);
    range.setEnd(last.firstChild, 0);
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(range);
    multipleSelectionMode = true;
}

const loopCheckboxHandler = () => {
    loopMode = loopModeCheckbox.checked;
    loopStartTime = loopMode ? audio.currentTime : -1; 
}
loopModeCheckbox.onchange = loopCheckboxHandler;
pasteTimelineButton[isMobile ? 'ontouchstart' : 'onmousedown'] = pasteSelectedSyllables;
words.onpaste = pasteSelectedSyllables;
editor.oncopy = cloneSyllablesBySpanRange(true);
words.oncopy = cloneSyllablesBySpanRange(false);

if (!isMobile)
toolbarElem.ondblclick = e => {
    if (['INPUT', 'SELECT'].includes(e.target.tagName)) return;
    if (latencyInputLabel.hidden) {
        lineSpacingInputLabel.hidden = false;
        latencyInputLabel.hidden = false;
    } else {
        lineSpacingInputLabel.hidden = true;
        latencyInputLabel.hidden = true;
    }
}

videoSizeX.onchange = videoSizeY.onchange = () => {
    const newWidth = +videoSizeX.value;
    const newHeight = +videoSizeY.value;
    if (!newWidth || !newHeight || newWidth < 1 || newHeight < 1 ) return; 
    renderCanvas.width = backgroundCanvas.width = padCanvas.width = textCanvas.width = newWidth;
    renderCanvas.height = backgroundCanvas.height = padCanvas.height = textCanvas.height = newHeight;

    canvasContext.font = `${Math.ceil(textCanvas.width / fontSizeInput.value)}px ${fontFamily.value}`;
    canvasContext.textAlign = "left";
    canvasContext.textBaseline = 'top';
    bgCanvasContext.fillStyle = backgroundColor.value;
    drawBackground();
    drawPad();
    recalcMetrics();
    canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    showStringsByPosition();
}

latencyInput.oninput = () => {
    const newVal = +latencyInput.value;
    if (newVal > -1) latency = newVal;
}

lineSpacingInput.oninput = () => {
    const newVal = +lineSpacingInput.value;
    if (newVal > -1) lineSpacing = newVal;
    drawPad();
    recalcMetrics();
    canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    showStringsByPosition();
}

fontSizeInput.oninput = () => {
    const val = +fontSizeInput.value;
    if (val < 0 || !val) return;
    canvasContext.font = `${Math.ceil(textCanvas.width / val)}px ${fontFamily.value}`;
    drawPad();
    recalcMetrics();
    canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    showStringsByPosition();
}

fontFamily.onchange = () => {
    canvasContext.font = `${Math.ceil(textCanvas.width / fontSizeInput.value)}px ${fontFamily.value}`;
    drawPad();
    recalcMetrics();
    canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    showStringsByPosition();
}

rightSyllableColorInput.oninput = () => {
    rightSyllableColor = rightSyllableColorInput.value;
    canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    const isPlaceholder = !songName;
    if (isPlaceholder) syllableCursor = 1;
    showStringsByPosition();
    if (isPlaceholder) syllableCursor = 0;
}

leftSyllableColorInput.oninput = () => {
    leftSyllableColor = leftSyllableColorInput.value;
    canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
    const isPlaceholder = !songName;
    if (isPlaceholder) syllableCursor = 1;
    showStringsByPosition();
    if (isPlaceholder) syllableCursor = 0;
}

let bgWithPad;

const drawString = (stringIndex, toSyllableIndex = -1/*, параметр указывающий что незакрашенная строка уже нарисована  */) => {
    const string = strings[stringIndex];
    let text = string.textContent;
    const metrics = canvasContext.measureText(text); //если будет тормозить сделать кеширование в Map string: x для всех строк
    const x = textCanvas.width / 2 - metrics.width / 2;
    const y = textCanvas.height * wordsYoffset + ((stringIndex % 2) ? metrics.fontBoundingBoxDescent * lineSpacing : 0); //todo после перехода на vh удалить привязку к metrics
    const halfOfLineSpacing = (metrics.fontBoundingBoxDescent * lineSpacing / 2);

    // if (stringIndex % 2) canvasContext.clearRect(0, y - halfOfLineSpacing / 2, textCanvas.width, textCanvas.height); //вторая строка
    // else canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height * wordsYoffset + halfOfLineSpacing); //первая строка
    canvasContext.clearRect(0, y, textCanvas.width, metrics.fontBoundingBoxDescent * 1.1); // * 1.1 нужен чтобы убрать следы от обводки stroke

    canvasContext.fillStyle = rightSyllableColor;
    canvasContext.fillText(text, x, y);

    if (~toSyllableIndex) {
        let filledText = ''; 
        Array.prototype.some.call(string.children, (a, i) => { //todo в вызывающей функции учесть br. они могут быть в конце
            filledText += a.textContent;
            if (i === toSyllableIndex) return true;
        });
        canvasContext.fillStyle = leftSyllableColor;
        canvasContext.fillText(filledText, x, y);
        canvasContext.strokeStyle = leftSyllableColor;
        canvasContext.strokeText(filledText, x, y);
    } 

    if (recording) {
        //появился текст - показать подложку
        if (hiddenPad && text) {
            hiddenPad = false;
            renderCanvasContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
            renderCanvasContext.drawImage(backgroundCanvas, 0, 0, renderCanvas.width, renderCanvas.height); 
            renderCanvasContext.drawImage(padCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
            bgWithPad = renderCanvasContext.getImageData(0, 0, renderCanvas.width, renderCanvas.height);
        } else
        //две пустые строки при рендере - убрать подложку
        if (toSyllableIndex === 0 && !hiddenPad && !text && !strings[stringIndex + 1]?.textContent) {
            hiddenPad = true;
            renderCanvasContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
            renderCanvasContext.drawImage(backgroundCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
            bgWithPad = renderCanvasContext.getImageData(0, 0, renderCanvas.width, renderCanvas.height);
        }
        
        renderCanvasContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
        renderCanvasContext.putImageData(bgWithPad, 0, 0);
        renderCanvasContext.drawImage(textCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
    }
}

words.parentElement.ondblclick = e => {
    fileInput.click();
}

const drawPad = () => {
    const measure = canvasContext.measureText('').fontBoundingBoxDescent;
    padCanvasContext.clearRect(0, 0, padCanvas.width, padCanvas.height)
    padCanvasContext.fillStyle = bgColor.value;
    padCanvasContext.globalAlpha = bgOpacity.value / 100;
    padCanvasContext.fillRect(0, backgroundCanvas.height * wordsYoffset - measure / 3, padCanvas.width, (measure * lineSpacing + measure) + measure / 3 * 2);
}

const drawBackground = () => {
    bgCanvasContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    if (img)
        bgCanvasContext.drawImage(img, bgX, bgY, img.width * (bgSize.value / 100), img.height * (bgSize.value / 100)); 
}

bgColor.oninput = bgOpacity.oninput = drawPad;

const getLength = ({clientX: x1, clientY: y1}, {clientX: x2, clientY: y2}) => {
    const leg1 = Math.abs(x2 - x1);
    const leg2 = Math.abs(y2 - y1);
    return Math.sqrt(leg1 ** 2 + leg2 ** 2);
}

bgEditToolkit.onclick = () => {
    if (started || bgEditToolkit.classList.contains('active')) return;
    bgEditToolkit.classList.add('active');
    const placeholder = 'Нажмите два раза для выбора изображения';

    if (!img.src) 
        bgEditToolkit.firstElementChild.textContent = placeholder;

    bgEditToolkit.ondblclick = () => {
        bgfileInput.click();
    }

    const removeHandlers = () => {
        toolbarElem.style.display = '';
        document.body.removeEventListener('mouseup', removeHandlers);
        document.body.removeEventListener('touchend', removeHandlers);
        bgEditToolkit[isMobile ? 'ontouchmove' : 'onmousemove'] = null;
    }

    bgEditToolkit[isMobile ? 'ontouchstart' : 'onmousedown'] = e => {
        let startLength = -1;
        const startBgSize = +bgSize.value;
        if (e.touches?.length === 2) startLength = getLength(...e.touches);
        
        let tapY = (e.y || e.touches[0].clientY);
        let tapX = (e.x || e.touches[0].clientX);
  
        toolbarElem.style.display = 'none';

        bgEditToolkit[isMobile ? 'ontouchmove' : 'onmousemove'] = moveEvent => {
            if (~startLength) {
                const newLength = getLength(...moveEvent.touches);
                bgSize.value = startBgSize * (newLength / startLength);
                drawBackground();
                return;
            }

            const x = (moveEvent.x || moveEvent.touches[0].clientX);
            const y = (moveEvent.y || moveEvent.touches[0].clientY);
            
            bgX += x - tapX;
            bgY += y - tapY;

            drawBackground();

            tapX = x;
            tapY = y;
        }
        document.body.addEventListener('mouseup', removeHandlers);
        document.body.addEventListener('touchend', removeHandlers);
    }
    
    document.body.onclick = e => {
        if (e.target.closest('#bgEditToolkit') || e.target.closest('#toolbarElem')) return;
        bgEditToolkit.ondblclick = bgEditToolkit.onmousedown = bgEditToolkit.ontouchstart = document.body.onmouseup = document.body.ontouchend = null;
        if (bgEditToolkit.firstElementChild.textContent === placeholder) 
            bgEditToolkit.firstElementChild.textContent = '';
        removeHandlers();
        bgEditToolkit.classList.remove('active');
    }
}
//exit
wordEditor[isMobile ? 'ontouchstart' : 'onmousedown'] = e => {
    if (!(e.target.closest('#editor') || e.target.closest('.toolbar'))) {
        showTimeline(timelinePosition, timelineDuration);
        cursor.style.left = getTimelinePercent() + '%';
        setCursorPosition();
        showStringsByPosition();
        wordEditor.style.display = '';
    };
}

textEditToolkit.onclick = () => {
    if (started || textEditToolkit.classList.contains('active')) return;
    textEditToolkit.classList.add('active');
    const placeholder = 'Нажмите два раза на текст чтобы редактировать его';
    bgEditToolkit.firstElementChild.textContent = placeholder;

    textEditToolkit.ondblclick = () => {
        wordEditor.style.display = 'block';
        const syllable = strings[stringCursor];
        if (!syllable) {
            if (editor.lastElementChild) editor.lastElementChild.scrollIntoView();
            return;
        }
        syllable.scrollIntoView();
        syllable.classList.add('active');
        setTimeout(() => syllable && syllable.classList.remove('active'), 2000);
    }

    const removeHandlers = () => {
        toolbarElem.style.display = '';
        textEditToolkit.onmousemove = textEditToolkit.ontouchmove = document.body.onmouseup = document.body.ontouchend = null;
    }

    const wrapper = textEditToolkit.parentElement.getBoundingClientRect();

    textEditToolkit[isMobile ? 'ontouchstart' : 'onmousedown'] = e => {
        let startLength = -1;
        const startFontSize = +fontSizeInput.value;
        if (e.touches?.length === 2) startLength = getLength(...e.touches);

        const tapY = (e.y || e.targetTouches[0].clientY) - wrapper.y;
        const spanY = e.target.getBoundingClientRect().y - wrapper.y
        const pxToSpan = tapY - spanY;
        //перетаскивая вниз на мобильном появляется шторка
        toolbarElem.style.display = 'none';
        textEditToolkit[isMobile ? 'ontouchmove' : 'onmousemove'] = moveEvent => {
            if (~startLength) {
                const newLength = getLength(...moveEvent.touches);
                fontSizeInput.value = startFontSize * (startLength / newLength);
                canvasContext.font = `${Math.ceil(textCanvas.width / fontSizeInput.value)}px ${fontFamily.value}`;
                recalcMetrics();
            } else {
                const y = (moveEvent.y || (moveEvent.targetTouches[0].clientY)) - wrapper.y - pxToSpan;
                const newPercent = y / (wrapper.height / 100);
                textEditToolkit.style.top = newPercent + '%';
                wordsYoffset = newPercent / 100;
            }

            canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
            drawString(stringCursor, syllableCursor); //todo может быть баг если stringCursor === -1 
            if (strings[stringCursor + 1]) drawString(stringCursor + 1);
            drawPad();
        }
        document.body.onmouseup = document.body.ontouchend = removeHandlers;
    }
    
    document.body[isMobile ? 'ontouchstart' : 'onmousedown'] = e => {
        if (e.target.closest('#textEditToolkit') || e.target.closest('#toolbarElem')) return;
        textEditToolkit.ondblclick = textEditToolkit.onmousedown = textEditToolkit.ontouchstart = null;
        if (bgEditToolkit.firstElementChild.textContent === placeholder) 
            bgEditToolkit.firstElementChild.textContent = '';
        removeHandlers();
        textEditToolkit.classList.remove('active');
    }
}

const updateLocalStorageWords = () => {
    if (songName)
        localStorage.setItem(songName, parseDomJson());
}

//todo если слог без data-time или time = -1 его нет на timeline
//это проявляется когда пользователь хочет добавить обратный отсчёт

//поведение contenteditable
//при нажатии enter посредине span, левая часть будет новым span а правая останется тем же
//если удалить содержимое span может остаться пустая строка и если нажать enter новый span в новой строке не создастся

//для созданных a создать атрибут data-id ссылку на объект syllable, то-же и для строк li.
//чтобы создать строковую ссылку на объект использовать getRandomInt(0, 10000)
//и записать его в obj = {}; obj[data-id] = syllable

const setPrevSyllableTime = a => {
    const index = Array.prototype.indexOf.call(syllables, a);
    if (index < 1) {
        a.dataset.time = 0;
        return;
    }

    const prev = syllables[index - 1]; //todo test
    if (+prev.dataset.time > -1) a.dataset.time = prev.dataset.time;
}

let records
const observer = new MutationObserver((list) => {
    const added = [];
    const removed = [];

    list.forEach(record => {
        if (record.addedNodes.length) {
            added.push(...record.addedNodes);
        } else
        if (record.removedNodes.length) {
            removed.push(...record.removedNodes);
        }
    });

    if (!editor.childNodes.length) {
        editor.append(document.createElement('li'));
    }

    //следить, если был вставлен сырой textNode с parent'ом li - обернуть его в a
    //баг. выделить вручную две полные строки и вставить символ с клавиатуры будет обернут в span и всё сломает
    for (let additon of added) {
        if (!additon.parentElement) continue;
        if (additon.tagName === 'A' && additon.firstElementChild && (additon.nextElementSibling || additon.previousElementSibling)) {
            console.log('a with br removed');
            additon.remove();
        }
        if (additon.tagName === 'A' && !additon.nextElementSibling && !additon.previousElementSibling && !additon?.dataset?.time) {
            //проблема со сбивающимся временем слогов при редактировании enter и разбиении
            //todo! сделать это onpaste enter
            //todo! найти ближайший слог слева, у которого есть time. если нет - установить 0. если есть - его значение
            //или найти справа
            //проблема с paste, тк там вставка происходит пачкой li
            //также будут проблемы с setCursorPosition
            //если слева соседей нет ставим 0. если есть - его время
            setPrevSyllableTime(additon);
            //while(--index >= 0) {}
        } else
        if (additon.tagName === 'A' && additon?.parentElement?.tagName !== 'LI') {
            console.log('a removed')
            additon.remove();
        }
        //у firefox проблема. br может быть вне a и в не пустой строке. здесь fix
        if (additon?.tagName === 'BR' && additon?.parentElement?.tagName !== 'A') {  //todo тест выяснить отсутствие кейсов возникания пустых a
            console.log('br wrapped in a');
            let a = document.createElement('a');
            a.append(document.createElement('br'));
            additon.replaceWith(a);
            setPrevSyllableTime(a);
            const range = window.getSelection().getRangeAt(0);
            range.setStart(a, 0);
            range.setEnd(a, 0);
        } else

        if (additon.nodeType === Node.TEXT_NODE && additon?.parentElement?.tagName !== 'A') {
            let a = document.createElement('a');
            a.textContent = additon.textContent;

            if (additon.parentElement?.tagName === 'SPAN') 
                additon.parentElement.replaceWith(additon);

            if (!additon.parentElement.closest('li')) { 
                let li = document.createElement('li');
                additon.replaceWith(li);
                li.append(a);
            } else if (!additon.parentElement.closest('a')) {
                additon.replaceWith(a);
            }
            setPrevSyllableTime(a);
            
            //поставить курсор правильно, в конец элемента a
            if (window.getSelection && document.createRange && a.parentElement) {
                var sel = window.getSelection();
                var range = document.createRange();
                range.setStart(a.firstChild, a.textContent.length); //setStart(p, 0) установит начало диапазона на нулевом дочернем элементе тега p(напр текстовый узел)
                range.collapse(true);
                sel.removeAllRanges(); //чтобы не возникло multirange
                sel.addRange(range); //выделить этот диапазон на странице
            }
        } 
        else if (additon.nodeType === Node.TEXT_NODE && (additon.previousSibling || additon.nextSibling)) {
            console.log('sibling textNode removed');
            if (additon.previousSibling) {
                additon.textContent = additon.previousSibling.textContent + additon.textContent;
                additon.previousSibling.remove();
            } else {
                additon.textContent += additon.nextSibling.textContent;
                additon.nextSibling.remove();
            }
        }
    }

    records = [added, removed];
});

 observer.observe(editor, { childList: true, subtree: true, characterData: true })

let timerToSave = -1;
const saveLocalStorageObserver = new MutationObserver(() => {
    clearTimeout(timerToSave);
    timerToSave = setTimeout(updateLocalStorageWords, 3500);
});

saveLocalStorageObserver.observe(editor, { childList: true, subtree: true, characterData: true, attributeFilter: ['data-time'] });

editor.onblur = () => {
    countDownButton.style.visibility = 'hidden';
}

wordEditor.firstElementChild.ondblclick = () => 
    autosplitLanguageWrapper.hidden = !autosplitLanguageWrapper.hidden;

editor.oncut = e => {
    //можно сохранить выделенное в Range.surroundContents(docfragment)
    //затем при onpaste если есть docfrag вставить его если не сложно
    //event.clipboardData.setData('text/html', div.innerHTML);
    //event.clipboardData.getData('text/html');
    /*
    event.clipboardData.setData('text/html', div.innerHTML); 
    event.clipboardData.setData('text/plain', div.innerHTML.toString());
     */
}

//устанавливает правильное выделение перед удалением 
const setValidEditorSelection = range => {
    const start = range.startContainer;
    let end = range.endContainer;
    if (['LI', 'A'].includes(start.tagName)) {
        range.setStartBefore(start.closest('li'));
    } else
    if (start.nodeType === Node.TEXT_NODE) {
        const a = start.parentElement;
        const li = a.parentElement;
        const isFirst = li.children[0] === a;
        const isAllSelect = !range.startOffset && (end !== start || range.endOffset === end.textContent.length);

        if (isFirst && isAllSelect) range.setStartBefore(li);
    }

    if (['LI', 'A'].includes(end.tagName)) {
        range.setEndAfter(end.closest('li'));
    } else
    if (end.nodeType === Node.TEXT_NODE) {
        const a = end.parentElement;
        const li = a.parentElement;
        const isLast = li.children[li.children.length - 1] === a || a.nextElementSibling?.tagName === 'BR';
        const isAllSelect = range.endOffset === end.textContent.length;

        if (isLast && isAllSelect) range.setEndAfter(li);
    }
}

const parseAndPastePlainText = text => {
    text = text.replaceAll(/\r\n/g, '\n');
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);

    if (!sel.rangeCount) return;
    const start = range.startContainer;
    setValidEditorSelection(range);
    
    const splitted = text.split('\n');
    //
    let beforeStartATime = -1; 
    if (splitted.length < 3) { //Если вставили меньше трёх строк - задать время последнего слога. Иначе - на ритм
        if (range.startContainer.nodeType === Node.TEXT_NODE) {
            beforeStartATime = start.parentElement.dataset.time;
        } else {
            const li = strings[range.startOffset - 1];
            if (li?.lastElementChild?.dataset?.time) {
                beforeStartATime = li.lastElementChild.dataset.time;
            }
        }
    }
    // 
    const strs = splitted.map(str => {
        const li = document.createElement('li');
        
        str = str.replaceAll(/( |^)([бвгджзйклмнпрстфхцчшщ]{1})( )/gi, "$1$2_");

        str = str.split(' ').filter(s => s).forEach(word => {
            const addSyllable = syllable => {
                const a = document.createElement('a');
                a.dataset.time = beforeStartATime;
                a.textContent = syllable.replaceAll('_', ' ');
                li.append(a);
            }

            const handler = word => {
                if (autoSplit.checked) convert(word).split('/').forEach(addSyllable);
                else addSyllable(word);
            }

            if (word.includes('-')) {
                word.split('-').forEach((word, i, arr) => {
                    handler(word);
                    if (i !== arr.length - 1)
                        li.lastChild.textContent += '-'
                });
                li.lastChild.textContent += ' ';
                return;
            }
            
            handler(word);

            li.lastChild.textContent += ' ';
        });

        return li;
    });

    let beforeStartElement;
    //первая строка выделена не полностью
    if (range.startContainer.nodeType === Node.TEXT_NODE) { 
        beforeStartElement = start.parentElement; //a
        range.deleteContents();
        const [first, ...others] = strs;
        beforeStartElement.after(...first.children);
        beforeStartElement.parentElement.after(...others);
    } else {
        beforeStartElement = strings[range.startOffset - 1];
        range.deleteContents();

        if (!beforeStartElement) {
            editor.prepend(...strs);
        } else {
            beforeStartElement.after(...strs);
        }
    }
}

editor.onpaste = async e => {
    e.preventDefault();
    let text = (e.originalEvent || e).clipboardData.getData('text/plain');
    parseAndPastePlainText(text);
    
    //range.selectNodeContents(textNode); обвести элемент выделением
}

const splitSyllables = () => {
    const sel = document.getSelection();
    const range = sel.getRangeAt(0);
    if (range.startContainer.nodeType !== Node.TEXT_NODE) return;
    const textNode = sel.anchorNode;
    const rawText = textNode.textContent;
    if (range.startOffset === rawText.length || range.startOffset === 0) return;
    if (textNode?.parentElement?.tagName !== 'A') return;
    
    const a = textNode.parentElement;
    const slashPosition = sel.anchorOffset;
    const left = rawText.slice(0, slashPosition);
    const right = rawText.slice(slashPosition);
    const newA = document.createElement('a');
    if (a.dataset.time)
        newA.dataset.time = a.dataset.time;
    textNode.textContent = left;
    newA.textContent = right;
    a.after(newA);
    range.setStart(newA, 0);
    range.setEnd(newA, 0);
}

const uniteSyllables = () => {
    const sel = document.getSelection();
    const range = sel.getRangeAt(0);
    if (range.startContainer.nodeType !== Node.TEXT_NODE) return;
    const a = range.startContainer.parentElement;
    const nextA = a?.nextElementSibling;
    if (nextA?.tagName !== 'A') return;
    a.textContent += nextA.textContent;
    nextA.remove(); 
    //todo extra склейка нескольких в пределах строки
}

cutButton.onclick = splitSyllables;
uniteButton.onclick = uniteSyllables;
// todo в новом li почемуто формируется span, а в ссылке вложенная ссылка если перенести строку
//если курсор стоит после ссылки текстовые ноды вставляются новые много. нужно установить курсор правильно 
//todo кнопка клей и cut

resetSyllableTimeButton.onclick = e => {
    const sel = document.getSelection();
    if (sel.type === 'None') return;
    const range = sel.getRangeAt(0);

    const getNearestA = (element, isEnd) => {
        let result = null;
        if (element.nodeType === Node.TEXT_NODE) result = element.parentElement;
        else if (element.tagName === 'A') result = element;
        else if (element.tagName === 'LI') result = element[(isEnd ? 'last' : 'first') + 'ElementChild'];
        else if (element.tagName === 'UL') result = strings[range[(isEnd ? 'end' : 'start') + 'Offset']]?.[(isEnd ? 'last' : 'first') + 'ElementChild']
        return result;
    }
    
    let nearestStartA = getNearestA(range.startContainer, false); 
    let nearestEndA = getNearestA(range.endContainer, true);
    if (!nearestStartA || !nearestEndA) return;

    const startIndex = Array.prototype.indexOf.call(syllables, nearestStartA);
    const endIndex = Array.prototype.indexOf.call(syllables, nearestEndA);
    
    const selectedSyllables = Array.prototype.slice.call(syllables, startIndex, endIndex + 1);
    selectedSyllables.forEach(a => {
        a.dataset.time = '-1';
        syllableSpanMap.delete(a);
    });
}
//todo баг. когда стираем, в конце остается красный квадрант
//todo! сбивается курсор если есть два слога подряд с одинаковым временем
countDownButton[isMobile ? 'ontouchstart' : 'onmousedown'] = () => { 
    const sel = document.getSelection();
    if (sel.type === 'None') return;
    const range = sel.getRangeAt(0);

    const a = range.startContainer?.parentElement?.parentElement?.firstElementChild;
    const aTime = +a.dataset.time;
    if (!(aTime + 1)) return //время не установлено
    //также вставить пустые строки после последних строк перед проигрышем. посмотреть как в других караоке
    let currentIndex = Array.prototype.indexOf.call(syllables, a);
    let nearestTime = 0;
    while (currentIndex--) {
        const time = +syllables[currentIndex]?.dataset?.time;
        if (!(time + 1)) continue;
        else {
            nearestTime = time;
            break;
        }
    }
    
    if ((aTime - nearestTime) < 4) return;

    const currentLi = a.parentElement;
    const liIndex = Array.prototype.indexOf.call(strings, currentLi); //чёт нечёт
    const template = [ //сначала самую последнюю
        [['', aTime - 3]],
        [['', aTime - 3]],
        [['', aTime - 3]],
        [['3', aTime - 3]],
        [[currentLi.textContent, aTime - 2]],
        [['2', aTime - 2]],
        [[currentLi.textContent, aTime - 1]],
        [['1', aTime - 1]],
    ] //todo если на мобильном будет мерцание - от строк с числами отнять 0,5, поставить их время раньше следующего слога
    if (liIndex % 2) template.unshift([['', aTime - 3]],);
    //сместить template[0] влево на полсекунды чтобы можно было перетаскивать
    template[0][0][1] -= .5;

    currentLi.before(...parseJsonToDomElements(template));
}

editor.onbeforeinput = e => { 
    const sel = document.getSelection(); //e.inputType deleteContentBackward deleteContentForward
    if (sel.type !== 'Caret' || !e?.data?.trim) return;
    
    if (e.data.length === 1) {
        if (e.data.at(-1) === '/') {
            e.preventDefault();
            splitSyllables();
        } 
        else if (e.data.at(-1) === '_') {
            e.preventDefault();
            uniteSyllables();
        }
    } else if (e.data.includes(' ')) {// или '\n'
        e.preventDefault();
        parseAndPastePlainText(e.data);
    }
}

editor.oninput = e => {
    const sel = document.getSelection();
    if (sel.type !== 'Caret') return;
    const range = sel.getRangeAt(0);

    const handler = checker => {
        const textNode = range.startContainer;
        if (textNode.parentElement.tagName === 'SPAN') 
            textNode.parentElement.replaceWith(textNode);
        const rawText = textNode.textContent;
        const a = textNode.parentElement;
        const slashPosition = range.startOffset - 1;
        const left = rawText.slice(0, slashPosition); 
        if (checker && checker(left)) return;
        const right = rawText.slice(slashPosition);
        const time = a.dataset.time;
        textNode.textContent = right;

        const addSyllable = syllable => {
            if (!syllable) return;
            const newA = document.createElement('a');
            newA.textContent = syllable;
            if (isFinite(time)) newA.dataset.time = time;
            a.before(newA);
        };

        if (autoSplit.checked) {
            convert(left).split('/').forEach(addSyllable);
        } else {
            addSyllable(left);
        }

        range.setStart(textNode, 1);
        range.setEnd(textNode, 1);
    }

    if (e.data?.trim && e.data.at(-1) === ' ') {
        handler(left => {  //если это частица - ничего не делать
            return autoSplit.checked && left.trim().length === 1 && /[бвгджзйклмнпрстфхцчшщ]/i.test(left);
        });
    } else if (e.data?.trim && e.data.at(-1) === '-') {
        handler();
    } 
    else if (e.inputType = "insertParagraph" && range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.parentElement.tagName === 'A' && autoSplit.checked) {
        const a = range.startContainer.parentElement;
        const time = a.dataset.time;
        const cursorPostition = range.startOffset;
        let pasted = '';
        let flag = true;
        
        const addSyllable = syllable => {
            if (!syllable) return;
            const newA = document.createElement('a');
            newA.textContent = syllable;
            if (isFinite(time)) newA.dataset.time = time;
            a.before(newA);

            const newPasted = pasted + syllable;
            if (flag && newPasted[cursorPostition]) {
                range.setStart(newA.firstChild, cursorPostition - pasted.length);
                range.setEnd(newA.firstChild, cursorPostition - pasted.length);
                flag = false;
            } else 
                pasted = newPasted;
        };

        convert(a.textContent).split('/').forEach(addSyllable);
        a.remove();
    }
}

const recalcMetrics = () => {
    const onePercent = textCanvas.height / 100;
    const measureHeight = canvasContext.measureText('').fontBoundingBoxDescent; //todo в разных шрифтах высота букв разная. при смене шрифта менять 
    const lineHeight = (measureHeight * lineSpacing + measureHeight) / onePercent;
    textEditToolkit.style.height = lineHeight + '%';
}

bgSize.oninput = () => {
    if (!+bgSize.value) return;
    drawBackground();
}

backgroundColor.oninput = () => {
    bgCanvasContext.fillStyle = backgroundColor.value;
    drawBackground()
}

const parseJsonToDomElements = strings => {
    const lis = [];
    
    strings.forEach(string => {
        const li = document.createElement('li');
        string.forEach(([word, time]) => {
            const a = document.createElement('a'); 
            a.textContent = word;
            if (isFinite(time)) a.dataset.time = time;
            li.append(a);
        });
        if (li.children.length === 1 && !li.firstElementChild.textContent)
            li.firstElementChild.append(document.createElement('br'));
        lis.push(li);
    });

    return lis;
}

const parseJsonWords = strings => {
    editor.innerHTML = '';
    editor.append(...parseJsonToDomElements(strings));
}

const parseDomJson = () => {
    const lis = [];
    for (let li of strings) {
        const string = Array.prototype.map.call(li.children, word => 
            [word.textContent, isFinite(word.dataset.time) ? word.dataset.time : -1]
        );
        lis.push(string);
    }
    return JSON.stringify(lis);
}

document.addEventListener('DOMContentLoaded', () => {
    if (isMobile) {
        fontSizeInput.hidden = true;
        lineSpacingInputLabel.hidden = false;
        bgSizeWrapper.hidden = true;
        latencyInputLabel.hidden = false;
    }
    bgCanvasContext.fillStyle = backgroundColor.value;
    parseJsonWords(placeholderStrings);
    drawPad();
    drawString(0);
    drawString(1);
    setTimeout(() => document.documentElement.scrollTop = document.documentElement.scrollHeight, 0);
    textEditToolkit.style.top = wordsYoffset * 100 + '%';
    recalcMetrics();
    drawBackground();
})

render.onclick = async () => {
    const suggestedName = songName + "(Караоке).webm";
    const chunks = [];
    const handle = await (window.showSaveFilePicker ? window.showSaveFilePicker({ suggestedName }) : {
        createWritable: () => ({
            write: data => chunks.push(data),
            close: () => {
                if (!chunks.length) return;
                const blob = new Blob(chunks, { type: 'video/webm'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = suggestedName;
                a.click();
                URL.revokeObjectURL(url);
            }
        })
    });
    const writable = await handle.createWritable();
    const stream = audio.captureStream();
    stream.addTrack(renderCanvas.captureStream().getVideoTracks()[0]);

    //если значение не установлено, новый фрейм будет захвачен при изменении canvas. иначе fps   new MediaStream([stream, audioStream])
    var recorder = new MediaRecorder(stream, {
        videoBitsPerSecond : 250000000, mimeType: 'video/webm;codecs=vp9' // vp9,opus todo MediaRecorder.isTypeSupported('video/mpeg')
    });

    recorder.addEventListener("dataavailable", async (event) => {
        await writable.write(event.data);
        if (recorder.state === "inactive") {
            await writable.close();
        }
    });

    audio.addEventListener('pause', () => {
        document.querySelector('body > .bottom > .timeline').style.visibility = '';
        recording = false;
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
    }, { once: true });

    document.querySelector('body > .bottom > .timeline').style.visibility = 'hidden';
    renderCanvasContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
    renderCanvasContext.drawImage(backgroundCanvas, 0, 0, renderCanvas.width, renderCanvas.height); 
    if (!strings[0]?.textContent && !strings[1]?.textContent) hiddenPad = true;
    else renderCanvasContext.drawImage(padCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
    bgWithPad = renderCanvasContext.getImageData(0, 0, renderCanvas.width, renderCanvas.height);

    recording = true;
    audio.currentTime = 0;
    document.body.click(); //убрать toolbar
    recorder.start();
    audio.play();
};

const getTimelinePercent = (time = audio.currentTime) => 
    (time - timelinePosition) / (timelineDuration / 100);

//_ склеивает частицу в один слог со словом. пробел, /, - разделители слогов
// первым делом нужно сплит по \n - организация строчек песни в массив.
// каждый слог должен быть привязан ко времени в секундах. 

//каждый запуск ищется последний слог, у которого нет времени т.е time === -1.
// или последний который больше currentTime
//performance.now() возвращает время в ms от загрузки страницы.

//.duration длительность
// .textTracks бывает и такое
// .addTextTrack()
//audio.onplaying = (e) => console.log('onplaying'); также как и play

// в таймлайне будут отображаться текущие строки

const setCursorPosition = () => { //устанавливает позицию курсора на следующий слог
    let syllableIndex = -1;
    
    const stringIndex = Array.prototype.findIndex.call(strings, string => { 
        let index = Array.prototype.findIndex.call(string.children, syllableTag => {
            const time = +syllableTag.dataset.time;
            return isNaN(time) || time === -1 || time > audio.currentTime
        });
        if (~index) {
            syllableIndex = index;
            return true;
        }
    });

    syllableCursor = ~syllableIndex ? syllableIndex : 0;
    stringCursor = ~stringIndex ? stringIndex : -1;

    if (!recording) {
        const currSyllable = strings[stringCursor]?.children?.[syllableCursor];
        if (currSyllable && !(+currSyllable?.dataset?.time + 1)) cursor.textContent = currSyllable.textContent;
        else cursor.textContent = '';
    }
}

const showStringsByPosition = () => {
    let currentString = strings[stringCursor];
    let nextString = strings[stringCursor + 1];

    if (!currentString) return;
    
    drawString(stringCursor, syllableCursor - 1);

    if (!recording)
    for (let span of words.children) {
        const syllable = spanSyllableMap.get(span); 
        const isAdd = audio.currentTime > syllable.dataset.time;
        span.classList[isAdd ? 'add' : 'remove']('color');
        //if (isAdd && cursor.textContent) cursor.textContent = '';  //todo если на курсоре есть слог убрать его
    }

    if (nextString) drawString(stringCursor + 1); 
}

fileInput.onchange = () => {
    if (fileInput.files[0]) {
        let songNameOld = songName; 
        const name = fileInput.files[0].name;
        songName = name.slice(0, name.lastIndexOf('.'));
        audio.src = (window.URL || window.webkitURL).createObjectURL(fileInput.files[0]);
        placeholder.style.display = 'none'
        let savedSong = localStorage.getItem(songName);
        
        if (savedSong) {
            if (!confirm(`Найдена сохраненная версия караоке этой песни. Загрузить её?`)) return;
            parseJsonWords(JSON.parse(savedSong));
            stringCursor = 0;
            syllableCursor = 0;
            showStringsByPosition();
            showTimeline(audio.currentTime, timelineDuration);
        } else if (songNameOld && localStorage.getItem(songNameOld)) { //перед этой песней была другая(плюс), записать в минусовку её данные
            updateLocalStorageWords();
            //updateLocalStorageSettings
        }
    }   
}

bgfileInput.onchange = e => {
    const file = bgfileInput.files[0];
    if (file) {
        img.onload = () => {
            bgCanvasContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            bgY = 0; //множитель до полноэкранного заполнения по высоте
            const multiplier = backgroundCanvas.height / img.height;
            bgX = backgroundCanvas.width / 2 - (img.width * multiplier) / 2; //центрируем
            bgSize.value = multiplier * 100; 
            drawBackground();
            bgEditToolkit.firstElementChild.style.display = 'none';
        }
        img.src = URL.createObjectURL(file);
    }
}

// strings[0][0].element.before(document.createElement('div')) вставит div перед span.  
// .after - после. полезно при редактировании
// node.replaceWith(nodes || strings) - заменяет node заданными узлами или строками. то что надо для wysiwig

const runCursor = () => {
    let timelineRight = timelinePosition + timelineDuration - audio.currentTime; 
    cursorAnimationPlayer = cursor.animate([{left: getTimelinePercent() + "%"}, {left: "100%"}], timelineRight * 1000);

    timelineTimer = setTimeout(function next() {
        if (loopMode) {
            audio.currentTime = loopStartTime;
            cursorAnimationPlayer.cancel();
            clearTimeout(timer);
            setCursorPosition();
            showStringsByPosition();
            runCursor();
            play();
            return;
        } else {
            showTimeline(audio.currentTime, timelineDuration);
            cursorAnimationPlayer = cursor.animate([{left: "0%"}, {left: "100%"}], timelineDuration * 1000);
        }
        
        timelineTimer = setTimeout(next, timelineDuration * 1000);
    }, timelineRight * 1000);
}

const shiftWordCursors = () => {
    if (syllableCursor === 0 && strings[stringCursor + 1]) { //отображаем новую строку вместо той что закончилась
        drawString(stringCursor + 1);
    }
    let currentString = strings[stringCursor]; //todo здесь отобразить слог на очереди
    let nextSyllable = currentString.children[syllableCursor + 1];
    if (nextSyllable) syllableCursor++; //следующий слог
    else { //строка закончилась, удалить её и заменить на следующую. перевести курсор на second/first
        syllableCursor = 0; //тут обновить в интерфейсе строки

        if (strings[stringCursor + 1]) {//виртуальная следующая строка существует в strings
            ++stringCursor;
        } else { //конец песни
            stringCursor = -1;
        }
    }

    if (!recording) {
        const currSyllable = strings[stringCursor]?.children?.[syllableCursor];
        if (currSyllable && !(+currSyllable?.dataset?.time + 1)) cursor.textContent = currSyllable.textContent
        else cursor.textContent = '';
    }
}

//ищет ближайший слог со временем и при достижении рисует его и сдвигает к нему курсор
const timerToNearSyllableWithTime = (syllable, show) => {
    const nextSyllableIndex = Array.prototype.indexOf.call(syllables, syllable);
    //if (!~nextSyllableIndex) return;
    for (let i = nextSyllableIndex + 1; i < syllables.length; i++) {
        const a = syllables[i];
        const time = +a.dataset.time;
        if (!(time + 1)) continue;

        const aIndex = Array.prototype.indexOf.call(a.parentElement.children, a);
        const liIndex = Array.prototype.indexOf.call(strings, a.parentElement);
        timeToNext = (time - audio.currentTime) * 1000 - latency;
        return timer = setTimeout(() => {
            stringCursor = liIndex;
            syllableCursor = aIndex;
            show(a);
        }, timeToNext);
    }
}

const play = () => {
    if (stringCursor === -1) return; //todo не допускать строк без a
    let currentString = strings[stringCursor];
    let nextSyllable = currentString.children[syllableCursor];
    const time = +nextSyllable.dataset.time;
    let timeToNext = (time - audio.currentTime) * 1000 - latency;
    const show = function show(syllable) {
        drawString(stringCursor, syllableCursor);
        if (!recording) {
            const span = syllableSpanMap.get(syllable);
            if (span?.classList) span.classList.add('color');
        }
        
        shiftWordCursors();
        if (stringCursor === -1) return;
        currentString = strings[stringCursor];
        nextSyllable = currentString.children[syllableCursor];
        const time = +nextSyllable.dataset.time;
        let timeToNext = (time - audio.currentTime) * 1000 - latency;
        if (!(time + 1)) return timerToNearSyllableWithTime(nextSyllable, show);
        if (timeToNext < 4) show(nextSyllable);
        else timer = setTimeout(show, timeToNext, nextSyllable);
    }

    if (!(time + 1)) return timerToNearSyllableWithTime(nextSyllable, show);
    timer = setTimeout(show, timeToNext, nextSyllable);
}

const clickHandler = () => { // как из js изменить css класс глобально? или css переменную
    // для timeline. 
    // когда мы делаем клик, нужно вычислять процент курсора таймлайна
    // и искать первый span что на пути изменить его процент и время. 
    // если span'а нет - добаить согласно слогу на позицию % курсора
    const clickTime = audio.currentTime;
    if (!~stringCursor) return;
    let currentString = strings[stringCursor];
    let syllable = currentString.children[syllableCursor];
    syllable.dataset.time = clickTime;
    drawString(stringCursor, syllableCursor);

    shiftWordCursors();

    const currentPercent = (clickTime - timelinePosition) / (timelineDuration / 100) + '%';
    const span = syllableSpanMap.get(syllable);
    if (span?.style && span?.parentElement) { //секунд от начала timelinePosition 
        span.style.left = currentPercent;
        span.classList.add('color');
        clearTimeout(timer);
        play(); //todo слог -1 при скраббинге остается на курсоре
    } else {
        const span = document.createElement('span');
        span.textContent = syllable.textContent || 'Пусто'; //todo здесь span.textContent может рассинхронизироваться при редактировании
        syllableSpanMap.set(syllable, span);
        spanSyllableMap.set(span, syllable);
        span.classList.add('color');
        span.style.left = currentPercent;
        const syllableIndex = Array.prototype.indexOf.call(syllables, syllable);
        const prevSpan = syllableSpanMap.get(syllables[syllableIndex - 1]);
        if (prevSpan?.parentElement) prevSpan.after(span);
        else words.prepend(span);
    } 
}

const showTimeline = (from, duration, overflow = 0) => {
    timelinePosition = from; //заменить на позиция + latency
    cursor.animate([{left: "100%"}, {left: "0%"}], 0);
    words.innerHTML = '';
    //будет тормозить - ориентироваться на курсор. не должно тк перебор 300 элементов с +syllable.dataset.time занял 0.3ms
    //Курсор устанавливать как первый найденный. при перемотке назад поиск идет от курсора на убывание 
    Array.prototype.some.call(syllables, syllable => {
        const time = +syllable.dataset.time;
        if (isNaN(time) || time < from) return false;
        if (time > (overflow || from + duration)) return true;

        const span = document.createElement('span');
        span.textContent = syllable.textContent || 'Пусто';
        syllableSpanMap.set(syllable, span);
        spanSyllableMap.set(span, syllable);
        
        const relativeTime = time - from; //секунд от начала from для word
        const secondInOnePersent = duration / 100; 
        const res = relativeTime / secondInOnePersent; // сколько процентов в rel;
        //перевести секунды
        span.style.left = res + '%';
        words.append(span);
    });
}

const updateTimelineDuration = () => {
    if (started) cursorAnimationPlayer.cancel();
    clearTimeout(timelineTimer);
    showTimeline(audio.currentTime, timelineDuration);
    if (started) requestAnimationFrame(runCursor);
}

scale.oninput = e => {
    const newVal = +scale.textContent;
    if (!newVal || newVal < 1) return;
    timelineDuration = newVal;
    updateTimelineDuration();
}

plus.onclick = () => {
    const newVal = timelineDuration - 3;
    if (newVal < 1) return;
    scale.textContent = timelineDuration = newVal;
    updateTimelineDuration();
}
minus.onclick = () => {
    const newVal = timelineDuration + 3;
    if (newVal > audio.duration) return;
    scale.textContent = timelineDuration = newVal;
    updateTimelineDuration();

    //todo анимация подсветки возможности ввода через outline
    //scale.classList.add('active');
    
    // scale.style.transitionDuration = 0 + 's';
    // scale.classList.add('active');

    // requestAnimationFrame(() => {
    //     scale.style.transitionDuration = 2 + 's';
    //     requestAnimationFrame(() => {
    //         setTimeout(() => {
    //             scale.classList.remove('active');
    //             setTimeout(() => {
    //                 scale.style.transitionDuration = 0 + 's';
    //             }, 1000);
    //         }, 1000)
    //     });
    // });
}

audio.onplay = e => {
    setCursorPosition();
    showStringsByPosition();
    if (!recording) {
        runCursor();
        main[isMobile ? 'ontouchstart' : 'onmousedown'] = clickHandler;
    }
    play();
    
    started = true;
    if (navigator.wakeLock) 
        navigator.wakeLock.request('screen')
            .then(res => wakeLock = res)
            .catch(() => {});
}

audio.onpause = e => {
    cursorAnimationPlayer.cancel();
    cursor.style.left = getTimelinePercent() + '%';
    clearTimeout(timelineTimer);
    clearTimeout(timer);
    main[isMobile ? 'ontouchstart' : 'onmousedown'] = null;
    started = false;

    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
    if (loopMode && ~loopStartTime) 
        audio.currentTime = loopStartTime;
}

/*
multipleSelectionMode
Пользователь зажимает span на какое-то время. 
multipleSelectionMode становится true;
пользователь выделяет несколько элементов
пользователь отпускает
если был выделен хоть один элемент то продолжаем, иначе multipleSelectionMode = false

*/

const getSelectedSpans = selection => {
    const spans = Array.from(words.children); //anchorNode всегда textNode
    let fromSpanIndex = spans.indexOf(selection.anchorNode?.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode);
    let toSpanIndex = spans.indexOf(selection.focusNode?.nodeType === Node.TEXT_NODE ? selection.focusNode.parentElement : selection.focusNode);
    if (fromSpanIndex > toSpanIndex) [fromSpanIndex, toSpanIndex] = [toSpanIndex, fromSpanIndex];
    return spans.slice(fromSpanIndex, toSpanIndex + 1);
}

const deleteHandler = () => {
    const sel = getSelection();
    const range = sel.getRangeAt(0);
    if (!range.startContainer?.parentElement) return;
    const par = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;

    if (!(par.closest('#words') || par.closest('#editor'))) return;

    if (par.closest('#words')) {
        const selected = getSelectedSpans(sel);
        sel.removeAllRanges();
        const newRange = document.createRange();
        selected.forEach((span, i, arr) => {
            const syllable = spanSyllableMap.get(span);
            if (syllable) {
                if (!i) { //выделяем всю строку от начала
                    if (syllable.parentElement.firstElementChild === syllable) 
                        newRange.setStartBefore(syllable.parentElement); 
                    else newRange.setStartBefore(syllable);
                }
                if (i === arr.length - 1) { //до конца
                    if (syllable.parentElement.lastElementChild === syllable) 
                        newRange.setEndAfter(syllable.parentElement); 
                    else newRange.setEndAfter(syllable);
                }
                syllable.dataset.time = '-1', span.remove();
            }
        });
        sel.addRange(newRange);
        deleteTimelineSyllableButton.textContent = '🗑';
    } else if (par.closest('#editor') && deleteTimelineSyllableButton.textContent === '🗑') {
        range.deleteContents();
        deleteTimelineSyllableButton.hidden = true;
        deleteTimelineSyllableButton.textContent = '🕒';
    }

    if (started) {
        clearTimeout(timer);
        setCursorPosition();
        showStringsByPosition();
        play();
    } else {
        setCursorPosition();
        showStringsByPosition();
    }
}

document.onkeydown = e => {
    if (!(e.key === 'Delete' || e.key === 'Backspace')) return;
    deleteHandler();
}

deleteTimelineSyllableButton.onclick = () => {
    const sel = getSelection();
    if (!sel.rangeCount) return;
    deleteHandler();
}

let prevSelectedSpans = [];
//todo переделать
document.onselectionchange = e => {
    const selection = getSelection(); 

    if (prevSelectedSpans.length) {
        prevSelectedSpans.forEach(span => span.classList.remove('active'));
        prevSelectedSpans.length = 0;
    }

    const par = selection.anchorNode?.parentElement;
    if (!par) return;

    if (par.closest('#words')) {
        prevSelectedSpans = getSelectedSpans(selection);
        prevSelectedSpans.forEach(span => span.classList.add('active'));
    }

    if (par.closest('#editor')) {
        const a = par.parentElement?.firstElementChild;

        if (+a?.dataset?.time + 1) {
            const aTime = +a.dataset.time;
            let i = Array.prototype.indexOf.call(syllables, a);
            let nearestTime = 0;
            while (i--) {
                const time = +syllables[i]?.dataset?.time;
                if (time + 1) { nearestTime = time; break }
            }
            if ((aTime - nearestTime) >= 4) countDownButton.style.visibility = 'visible';
            else if (countDownButton.style.visibility === 'visible') countDownButton.style.visibility = 'hidden';
        } else if (countDownButton.style.visibility === 'visible') { 
            countDownButton.style.visibility = 'hidden';
        }
    }
}

let multipleSelectionMode = false;

words[isMobile ? 'ontouchstart' : 'onmousedown'] = e => {
    //как только e.targetTouches.length == 2 переходим в multipleSelectionMode
    words.onmousemove = words.ontouchmove = words.onmouseup = words.ontouchend = null;
    const clear = () => {
        deleteTimelineSyllableButton.textContent = '🕒';
        deleteTimelineSyllableButton.hidden = true;
        document.getSelection().removeAllRanges();
        multipleSelectionMode = false;
        main.firstElementChild[isMobile ? 'ontouchstart' : 'onmousedown'] = null;
    };

    if (e.shiftKey) {multipleSelectionMode = true; return}
    if (e.touches?.length == 2) {
        getSelection().setBaseAndExtent(e.touches[0].target.childNodes[0], 0, e.touches[1].target.childNodes[0], 0);
        multipleSelectionMode = true;
        return;
    }
    if (e.target.tagName !== 'SPAN') return clear();
    deleteTimelineSyllableButton.hidden = false;

    const syllable = spanSyllableMap.get(e.target);
    const pxToSpan = (e.x || e.targetTouches[0].clientX) - e.target.getBoundingClientRect().x;

    const selection = getSelection();
    const startRange = window.getSelection().rangeCount ? getSelection().getRangeAt(0).cloneRange() : null;
    let spansToDrag = [];
    
    if (multipleSelectionMode) {
        spansToDrag = getSelectedSpans(selection);
        if (isMobile) cloneSyllablesBySpanRange(false);
        document.getSelection().removeAllRanges();
        if (!spansToDrag.includes(e.target)) {
            multipleSelectionMode = false; 
            return
        };
    }
    
    let moveHandler = moveEvent => {
        const nextSpan = parseFloat(e.target?.nextElementSibling?.style?.left || '100%'); 
        const prevSpan = parseFloat(e.target?.previousElementSibling?.style?.left || '0%'); 

        const newPercent = ((moveEvent.x || moveEvent.targetTouches[0].clientX) - pxToSpan) / (words.clientWidth / 100);
        const secondInOnePercent = timelineDuration / 100; 
        
        if (!(prevSpan < newPercent && newPercent < nextSpan)) return;
        
        const currentTime = timelinePosition + newPercent * secondInOnePercent;
        syllable.dataset.time = currentTime;
        e.target.style.left = newPercent + '%';
        
        if (started) {
            clearTimeout(timer);
            setCursorPosition();
            showStringsByPosition();
            play();
        } else {
            setCursorPosition();
            showStringsByPosition();
        }
    }

    let multipleMoveHandler = moveEvent => {
        const fromSpan = parseFloat(spansToDrag[0].style?.left);
        const toSpan = parseFloat(spansToDrag[spansToDrag.length - 1].style?.left); //todo заменить на spansToDrat.at(-1) доступ с конца массива
        const nextSpan = parseFloat(spansToDrag[spansToDrag.length - 1].nextElementSibling?.style?.left || Infinity);
        const prevSpan = parseFloat(spansToDrag[0].previousElementSibling?.style?.left || 0);

        // вычислить разницу. Брать prevPercent
        const newPercent = ((moveEvent.x || moveEvent.targetTouches[0].clientX) - pxToSpan) / (words.clientWidth / 100);
        const deltaPercent = newPercent - parseFloat(e.target.style.left); // > 0 если перетащили влево
        const secondInOnePercent = timelineDuration / 100; 
        
        if (!(prevSpan < fromSpan + deltaPercent && toSpan + deltaPercent < nextSpan)) return;
        
        spansToDrag.forEach(span => {
            const syllable = spanSyllableMap.get(span);
            const newPercent = parseFloat(span.style.left) + deltaPercent;
            const currentTime = timelinePosition + newPercent * secondInOnePercent;
            syllable.dataset.time = currentTime;
            span.style.left = newPercent + '%';
        });

        if (started) {
            clearTimeout(timer);
            setCursorPosition();
            showStringsByPosition();
            play();
        } else {
            setCursorPosition();
            showStringsByPosition();
        }
    }

    words[isMobile ? 'ontouchend' : 'onmouseup'] = () => {
        if (multipleSelectionMode) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(startRange);
        }
        words.onmousemove = words.ontouchmove = null;
        //multipleSelectionMode = false;
    };

    words[isMobile ? 'ontouchmove' : 'onmousemove'] = multipleSelectionMode ? multipleMoveHandler : moveHandler;

    main.firstElementChild[isMobile ? 'ontouchstart' : 'onmousedown'] = clear;

    // words.onmousemove = words.ontouchmove = words.onmouseup = words.ontouchend = null;

    //если мы держим и не двигаемся 1.5 секунды - активируем режим мультивыделения
    //как на мобилке так и на десктопе
}

//тикает при воспроизведении. 
//если пользователь мотает:
// браузер генерит onpause 
//при передвижении быстро как при скролле генерит ontimeupdate 
// генерит onplay после окончания перемотки
audio.ontimeupdate = e => {
    if (started) return;
    setCursorPosition();
    showStringsByPosition();

    const currentPercent = getTimelinePercent(); //todo поменять остальные relative
    if (currentPercent < 0 || currentPercent > 99) {
        showTimeline(audio.currentTime, timelineDuration);
    } else {
        cursor.style.left = currentPercent + '%';
    }
    if (loopMode && !started) loopStartTime = audio.currentTime; //если пользователь мотает с loopMode
}

