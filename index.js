let started = false;
let recording = false;
let strings = [
    [{syllable: 'Вве', time: -1}, {syllable: 'ди', time: -1}, {syllable: 'те ', time: -1}, {syllable: 'текст', time: -1}],
    [{syllable: 'En', time: -1}, {syllable: 'ter ', time: -1}, {syllable: 'the ', time: -1}, {syllable: 'text', time: -1}]
]; 
let syllableCursor = -1;
let stringCursor = 0;
let isSecondString = false;
let timer = -1;
let timelineDuration = scale.textContent = 10; //в секундах
let timelinePosition = 0;
let timelineTimer = -1;
let spanSyllableMap = new WeakMap();
let wordsYoffset = .75;
let lineSpacing = 1.4;
let fontSize = 8;
let bgX = 0;
let bgY = 0;
var img = new Image;

var bgCanvasContext = backgroundCanvas.getContext("2d");
var canvasContext = textCanvas.getContext("2d");
var padCanvasContext = padCanvas.getContext("2d");
var renderCanvasContext = renderCanvas.getContext('2d');
//canvasContext.font = `${fontSize}vh Arial`;
canvasContext.font = `${Math.ceil(textCanvas.width / 24)}px Arial`;
canvasContext.textAlign = "left";
canvasContext.textBaseline = 'top'; //горизонтальная линия проходящая в самом низу текста или вверху
canvasContext.fillStyle = "yellow";

//todo закешируй prevString. и если текущая строка !== prevString то пересчитать метрики. Их тоже закешировать
//todo размер шрифта можно указывать как vh или vw
//todo после изменения размеров холста весь canvas сбрасывается и старый ctx больше недоступен. также заново нужно задавать стили шрифта и всего что в общем потоке здесь объявлено

//проблемы с буковй ё. остаё не делится на два слога
//todo тест мобильной версии
//фоновая картинка 
//настройки скрыть за троеточием

//loopmode. если on, когда timeline кончается, песня перематывается в начало timeline
//#scale сделать contenteditable

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

//выполнено
//перемотка двигает курсор и не перерисовывает таймлайн пока курсор не выйдет за его пределы по времени

//todo extra
//мультитач жест zoom для увеличения размера шрифта
//на компьютере - колесико мыши
//тоже самое и с фоновым изображением

//extra возможность добавить фоновое видео
//при удержании пальца/кнопки слог тянется
//мультивыделение при удержании

//при рендере написать сообщение. Пожалйста дождитесь окончания рендера, не закрывайте вкладку(иначе reqFrame заморозится)
//использовать api Screen Wake Lock API  кофе чтобы не заснула   

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

//input audio растянуть

//todo выбрать шрифт интерфейса

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

//Откудать брать аудио. Если есть аудио то с него(в приоритете). Если аудио нет а есть видео, берём с видео. 
//аудио controls при наличии видео управляет и видео
//Показывать плейсхолдер и срабатывать этот обработчик только тогда
//когда  пуст

//todo воркер для стрима видео на canvas
//https://developer.mozilla.org/en-US/docs/Web/API/MediaSourceHandle только chrome


let bgWithPad;

const drawString = (stringIndex, toSyllableIndex = -1/*, параметр указывающий что незакрашенная строка уже нарисована  */) => {
    const string = strings[stringIndex].map(({syllable}) => syllable);
    const text = string.join('');
    const metrics = canvasContext.measureText(text); //если будет тормозить сделать кеширование в Map string: x для всех строк
    const x = textCanvas.width / 2 - metrics.width / 2;
    const y = textCanvas.height * wordsYoffset + ((stringIndex % 2) ? metrics.fontBoundingBoxDescent * lineSpacing : 0); //todo после перехода на vh удалить привязку к metrics
    const halfOfLineSpacing = (metrics.fontBoundingBoxDescent * lineSpacing / 2);

    // if (stringIndex % 2) 
    //     canvasContext.clearRect(0, y - halfOfLineSpacing / 2, textCanvas.width, textCanvas.height); //вторая строка
    // else 
    //     canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height * wordsYoffset + halfOfLineSpacing); //первая строка
    canvasContext.clearRect(0, y, textCanvas.width, metrics.fontBoundingBoxDescent * 1.1); // * 1.1 нужен чтобы убрать следы от обводки stroke

    canvasContext.fillStyle = "yellow";
    canvasContext.fillText(text, x, y);

    if (~toSyllableIndex) {
        const substring = string.slice(0, toSyllableIndex + 1).join('');
        canvasContext.fillStyle = "red";
        canvasContext.fillText(substring, x, y);
        canvasContext.strokeStyle = 'red';
        canvasContext.strokeText(substring, x, y);
    } 

    if (recording) {
        renderCanvasContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
        renderCanvasContext.putImageData(bgWithPad, 0, 0);
        renderCanvasContext.drawImage(textCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
    }
}

words.ondblclick = e => {
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

bgEditToolkit.onclick = () => {
    if (started || bgEditToolkit.classList.contains('active')) return;
    bgEditToolkit.classList.add('active');
    const placeholder = 'Нажмите два раза чтобы выбрать фоновое изображение или видео';

    if (!img.src) 
        bgEditToolkit.firstElementChild.textContent = placeholder;

    bgEditToolkit.ondblclick = () => {
        bgfileInput.click();
    }

    const removeHandlers = () => {
        toolbarElem.style.display = '';
        document.body.removeEventListener('mouseup', removeHandlers);
        document.body.removeEventListener('touchend', removeHandlers);
        bgEditToolkit.onmousemove = bgEditToolkit.ontouchmove = null;
    }

    bgEditToolkit.onmousedown = bgEditToolkit.ontouchstart = e => {
        let tapY = (e.y || e.targetTouches[0].clientY);
        let tapX = (e.x || e.targetTouches[0].clientX);
  
        toolbarElem.style.display = 'none';

        bgEditToolkit.onmousemove = bgEditToolkit.ontouchmove = moveEvent => {
            const x = (moveEvent.x || moveEvent.targetTouches[0].clientX);
            const y = (moveEvent.y || moveEvent.targetTouches[0].clientY);
            
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

textEditToolkit.onclick = () => {
    if (started || textEditToolkit.classList.contains('active')) return;
    textEditToolkit.classList.add('active');
    const placeholder = 'Нажмите два раза на текст чтобы редактировать его';
    bgEditToolkit.firstElementChild.textContent = placeholder;

    textEditToolkit.ondblclick = () => {
        wordEditor.style.display = 'block';
    }

    const removeHandlers = () => {
        toolbarElem.style.display = '';
        textEditToolkit.onmousemove = textEditToolkit.ontouchmove = document.body.onmouseup = document.body.ontouchend = null;
    }

    const wrapper = textEditToolkit.parentElement.getBoundingClientRect();

    textEditToolkit.onmousedown = textEditToolkit.ontouchstart = e => {
        const tapY = (e.y || e.targetTouches[0].clientY) - wrapper.y;
        const spanY = e.target.getBoundingClientRect().y - wrapper.y
        const pxToSpan = tapY - spanY;
        //перетаскивая вниз на мобильном появляется шторка
        toolbarElem.style.display = 'none';
        textEditToolkit.onmousemove = textEditToolkit.ontouchmove = moveEvent => {
            const y = (moveEvent.y || (moveEvent.targetTouches[0].clientY)) - wrapper.y - pxToSpan;
            const newPercent = y / (wrapper.height / 100);
            textEditToolkit.style.top = newPercent + '%';
            wordsYoffset = newPercent / 100;
            canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
            drawString(stringCursor, syllableCursor); //todo может быть баг если stringCursor === -1 
            if (strings[stringCursor + 1]) drawString(stringCursor + 1);
            drawPad();
        }
        document.body.onmouseup = document.body.ontouchend = removeHandlers;
    }
    
    document.body.onmousedown = document.body.ontouchstart = e => {
        if (e.target.closest('#textEditToolkit') || e.target.closest('#toolbarElem')) return;
        textEditToolkit.ondblclick = textEditToolkit.onmousedown = textEditToolkit.ontouchstart = null;
        if (bgEditToolkit.firstElementChild.textContent === placeholder) 
            bgEditToolkit.firstElementChild.textContent = '';
        removeHandlers();
        textEditToolkit.classList.remove('active');
    }
}

exitEditorButton.onclick = () => {
    wordEditor.style.display = '';
}

//поведение contenteditable
//при нажатии enter посредине span, левая часть будет новым span а правая останется тем же
//если удалить содержимое span может остаться пустая строка и если нажать enter новый span в новой строке не создастся

//для созданных a создать атрибут data-id ссылку на объект syllable, то-же и для строк li.
//чтобы создать строковую ссылку на объект использовать getRandomInt(0, 10000)
//и записать его в obj = {}; obj[data-id] = syllable

let lastAction;
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
        if (additon.nodeType === Node.TEXT_NODE && additon?.parentElement?.tagName !== 'A') {
            let a = document.createElement('a');
            a.textContent = additon.textContent;

            if (additon.parentElement?.tagName === 'SPAN') 
                additon.parentElement.replaceWith(additon);
            
            if (additon.parentElement?.tagName !== 'LI') { 
                let li = document.createElement('li');
                li.append(a);
                additon.replaceWith(li);
            } else {
                additon.replaceWith(a);
            }
            
            //поставить курсор правильно, в конец элемента a
            if (window.getSelection && document.createRange) {
                // IE 9 and non-IE
                var sel = window.getSelection();
                var range = document.createRange();
                range.setStart(a.firstChild, a.textContent.length); //setStart(p, 0) установит начало диапазона на нулевом дочернем элементе тега p(напр текстовый узел)
                range.collapse(true);
                sel.removeAllRanges(); //чтобы не возникло multirange
                sel.addRange(range); //выделить этот диапазон на странице
            } else if (document.body.createTextRange) {
                // IE < 9
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(a);
                textRange.collapse(true);
                textRange.select();
            }

        }
    }

    for (let removation of removed) {
        
    }

    records = [added, removed];

});

 observer.observe(editor, { childList: true, subtree: true, characterData: true })

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

//функция вернёт следующий элемент диапазона
//это может быть a, br
//сюда можно передавать как textNode так и а или li
const getNextElement = element => {
    if (element.tagName === 'LI') return element.firstElementChild;
    if (element.nodeType === Node.TEXT_NODE) return element.parentElement;
}

const getElement = start => {
    if (start.tagName === 'UL') start = start.firstElementChild;
    if (start.tagName === 'LI') start = start.firstElementChild; //br || a
    if (start.nodeType === Node.TEXT_NODE) start = start.parentElement;
}

const getElementsInRange = (start, end) => {
    start = getElement(start);
    end = getElement(end);

}

document.onselectionchange = () => {
    console.log(document.getSelection());
  };

editor.onpaste = async e => {
    e.preventDefault();
    let text = (e.originalEvent || e).clipboardData.getData('text/plain');
    text = text.replaceAll(/\r\n/g, '\n');

    const sel = window.getSelection();

    if (sel.rangeCount) { //меняем выделение на правильное
        const range = sel.getRangeAt(0);
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

        range.deleteContents();
        range.insertNode(document.createTextNode(text));

        //todo здесь именно в этом блоке необходимо разбить вставленный текст на li и вставить
    }
    return;
  
    //onselectionstart на contenteditable вычислять и navigator.clipboard.readText() если поддерживается и заменять его на чистый
    
    // const strs = text.split('\n');

    // strs.map(str => {
    //     const li = document.createElement('li');
    //     str = str.replaceAll(/( |^)([бвгджзйклмнпрстфхцчшщ]{1})( )/gi, "$1$2_");

    //     str = str.split(' ').filter(s => s).forEach(function hanlder(word) {
    //         if (word.includes('-')) {
    //             word.split('-').forEach(hanlder);//если в слове несколько тире некорректно
    //             li.lastChild.previousSibling.textContent += '-';
    //             return;
    //         }

    //         if (autoSplit.checked) {
    //             convert(word).split('/').forEach(syllable => {
    //                 const span = document.createElement('span');
    //                 span.textContent = syllable;
    //                 li.append(span);
    //             });
    //         } else {
    //             const span = document.createElement('span');
    //             span.textContent = word;
    //             li.append(span);
    //         }

    //         li.lastChild.textContent += ' '; //пробел в конце слова

    //         editor.append(li);
    //     });

    //     return li;
    // });
    // //разбить по пробелам и '-', обернуть в span'ы

    // const [first, ...others] = strs;
    // //вставить strs[0] на место курсора в текущую строку, остальные вставить следующими строками

    
    
    // var range = document.getSelection().getRangeAt(0);
    // range.deleteContents();
    
    // var textNode = document.createTextNode(text);
    // range.insertNode(textNode);
    // range.selectNodeContents(textNode);
    // range.collapse(false);

    // var selection = window.getSelection();
    // selection.removeAllRanges();
    // selection.addRange(range);
}

const stringsToEditor = () => {
    
}
//todo addEventListener("animationstart", (event) => {}); transitionend
stringsToEditor();
// todo в новом li почемуто формируется span, а в ссылке вложенная ссылка если перенести строку
//если курсор стоит после ссылки текстовые ноды вставляются новые много. нужно установить курсор правильно 
editor.onbeforeinput = e => { 
    lastAction = e.inputType;

    if (e.data === '/') {
        e.preventDefault();
        const sel = document.getSelection();
        const range = sel.getRangeAt(0);
        const textNode = sel.anchorNode;
        const rawText = textNode.textContent;
        if (textNode?.parentElement?.tagName !== 'A' || !sel.anchorOffset || sel.anchorOffset === rawText.length) return; 
        //todo сделать для удобства ручной разбивки. при sel.anchorOffset === rawText.length создается новый пустой 'a' впереди и переводится на него курсор
        const a = textNode.parentElement;
        const slashPosition = sel.anchorOffset;
        const left = rawText.slice(0, slashPosition);
        const right = rawText.slice(slashPosition);
        const newA = document.createElement('a');
        textNode.textContent = left;
        newA.textContent = right;
        a.after(newA);
        range.setStart(newA, 0);
        range.setEnd(newA, 0);
    } 
    else if (e.data === '_') {

    }
    
    //e.preventDefault(); нельзя отменить тк срабатывает после изменения
    //onbeforeinput отменить можно

    // else 
    // if (e.inputType === 'insertParagraph') {
    //     for (let li of editor.children) {
    //         if (li.textContent) continue;
    //         const a = document.createElement('a')
    //         a.textContent = '';
    //         li.append(a);
    //         a.focus();

    //         var sel = window.getSelection();
    //         var range = document.createRange();
    //         range.setStart(a, 0);
    //         range.collapse(true);
    //         sel.removeAllRanges();
    //         sel.addRange(range);
    //     }
    // }

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

const parseJsonWords = strings => {
    strings.forEach(string => {
        const li = document.createElement('li');
        string.forEach(word => {
            const a = document.createElement('a'); 
            a.textContent = word.syllable;
            li.append(a);
        });
        editor.append(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bgCanvasContext.fillStyle = backgroundColor.value;
    parseJsonWords(strings);
    drawPad();
    drawString(0);
    drawString(1);
    setTimeout(() => document.documentElement.scrollTop = document.documentElement.scrollHeight, 0);
    textEditToolkit.style.top = wordsYoffset * 100 + '%';
    recalcMetrics();
})

const run = async () => {
    //const desktop = streamToVideo(desktopStream);

    video = document.createElement('video');
    video.srcObject = desktopStream;
    video.play();
    
    //const context = renderCanvas.getContext('2d');
    // renderCanvas.width = 1920;
    // renderCanvas.height = 1080;
    
    // (function draw() {
    //     bgCanvasContext.drawImage(video, 0, 0, 1920, 1080);
    //     requestAnimationFrame(draw);
    // })();
};

render.onclick = async () => {
    const name = fileInput.files[0].name;
    const fileName = name.slice(0, name.lastIndexOf('.'))
    const suggestedName = fileName + "(Караоке).webm";
    const handle = await window.showSaveFilePicker({ suggestedName });
    const writable = await handle.createWritable();
    //https://web.dev/patterns/files/save-a-file?hl=ru#js todo showSaveFilePicker есть только в chrome

    const stream = audio.captureStream();
    stream.addTrack(renderCanvas.captureStream().getVideoTracks()[0]);

    //если значение не установлено, новый фрейм будет захвачен при изменении canvas. иначе fps   new MediaStream([stream, audioStream])
    var recorder = new MediaRecorder(stream, {
        videoBitsPerSecond : 250000000, mimeType: 'video/webm;codecs=vp9' //todo MediaRecorder.isTypeSupported('video/mpeg')
    });

    recorder.addEventListener("dataavailable", async (event) => {
        await writable.write(event.data);
        if (recorder.state === "inactive") {
            await writable.close();
        }
    });

    audio.addEventListener('pause', function stopRecord(){
        recording = false;
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
        audio.removeEventListener('pause', stopRecord);
    });

    renderCanvasContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
    renderCanvasContext.drawImage(backgroundCanvas, 0, 0, renderCanvas.width, renderCanvas.height); 
    renderCanvasContext.drawImage(padCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
    bgWithPad = renderCanvasContext.getImageData(0, 0, renderCanvas.width, renderCanvas.height);

    recording = true;
    audio.currentTime = 0;
    recorder.start();
    audio.play();
};

 //если менять размер то всем блокам: backgroundCanvas.height = textCanvas.height = renderCanvas.height = 7000

function streamToVideo(stream) {
    let video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // video.style.width = stream.width;
    // video.style.height = stream.height;

    

    return video;
}

async function getDesktop() {
    return await navigator.mediaDevices.getDisplayMedia({video: true});
}

const updateLocalStorage = () => {
    if (fileInput.files[0])
        localStorage.setItem(fileInput.files[0].name, JSON.stringify({rawText: textarea.value, strings}));
}

const getTimelinePercent = (time = audio.currentTime) => 
    (time - timelinePosition) / (timelineDuration / 100);

const createSyllableMap = e => {
    strings.length = 0; 
    //минус - все расставленные точки будут потеряны при редактировании текста
    //компроммис - пересобрать только редактированную строку
    
    strings.push(...textarea.value.split(/\n/).map(string => {
        //time - когда будет закрашен этот слог, index - где слог кончается
        const syllables = [{ syllable: '', time: -1 }];
        //массив слогов с вырезанными /_ с time закрытия. в слог входит пробел

        for (let symbol of string) {
            const lastSyllable = syllables[syllables.length - 1];
            
            if (symbol === '/') {
                syllables.push({ syllable: '', time: -1 });
                continue;
            } else
            if (symbol === '_') {
                lastSyllable.syllable += ' ';
                continue;
            } else
            if (symbol === ' ') {
                syllables.push({ syllable: '', time: -1 });
            } else
            if (symbol === '-') {
                syllables.push({ syllable: '-', time: -1 });
                continue;
            }
            lastSyllable.syllable += symbol;
        }

        syllables.forEach(syllable => {
            syllable.timelineSpan = null;
        })

        return syllables;
    }));


}

splitButton.onclick = () => {
    textarea.value = textarea.value
        .split('\n')
        .map(string => {
            let words = string.trim().split(' ').map(word => convert(word.trim())).join(' ');
            return words.replaceAll(/( |^)([бвгджзйклмнпрстфхцчшщ]{1})( )/gi, "$1$2_");
        })
        .join('\n');
        createSyllableMap();
        updateLocalStorage();
}

textarea.onchange = () => {createSyllableMap(); updateLocalStorage();}
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
    
    const stringIndex = strings.findIndex(string => { //если отмотать назад, ставит неправильно
        let index = string.findIndex(syllable => syllable.time === -1 || syllable.time > audio.currentTime);
        if (~index) {
            syllableIndex = index;
            return true;
        }
    });

    syllableCursor = ~syllableIndex ? syllableIndex : 0;
    stringCursor = ~stringIndex ? stringIndex : 0;
}

const showStringsByPosition = () => {
    let currentString = strings[stringCursor];
    let nextString = strings[stringCursor + 1];

    if (!currentString) return;
    
    drawString(stringCursor, syllableCursor - 1);

    for (let span of words.children) {
        const syllable = spanSyllableMap.get(span);
        span.classList[audio.currentTime > syllable.time ? 'add' : 'remove']('color');
    }

    if (nextString) drawString(stringCursor + 1); 
}

fileInput.onchange = () => {
    if (fileInput.files[0]) {
        audio.src = (window.URL || window.webkitURL).createObjectURL(fileInput.files[0]);
        let savedSong = localStorage.getItem(fileInput.files[0].name);
        
        if (savedSong && confirm(`Найдена сохраненная версия караоке этой песни. Загрузить её?`)) {
            savedSong = JSON.parse(savedSong);
            strings = savedSong.strings;
            stringCursor = 0;
            syllableCursor = 0;
            showStringsByPosition();
            showTimeline(audio.currentTime, timelineDuration);
        }
        placeholder.style.display = 'none';
    }   
}

bgfileInput.onchange = e => {
    const file = bgfileInput.files[0];
    if (file) {
        if (file.type.includes('video')) {
            
            return;
        } 
        
        img.onload = () => {
            bgCanvasContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            bgX = bgY = 0;
            bgCanvasContext.drawImage(img, 0, 0); 
            //todo extra сжать по ширине и высоте до полного экрана, установить size
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
    cursor.style.transitionDuration = timelineRight + 's';
    cursor.style.left = '100%';

    timelineTimer = setTimeout(function next() {
        showTimeline(timelinePosition + timelineDuration, timelineDuration);
        requestAnimationFrame(() => {
            cursor.style.transitionDuration = timelineDuration + 's';
            cursor.style.left = '100%';
        });
        timelineTimer = setTimeout(next, timelineDuration * 1000);
    }, timelineRight * 1000);
}

const shiftWordCursors = () => {
    let currentString = strings[stringCursor];
    let nextSyllable = currentString[syllableCursor + 1];
    if (nextSyllable) syllableCursor++; //следующий слог
    else { //строка закончилась, удалить её и заменить на следующую. перевести курсор на second/first
        syllableCursor = 0; //тут обновить в интерфейсе строки

        if (strings[stringCursor + 1]) {//виртуальная следующая строка существует в strings
            ++stringCursor;

            //отображаем новую строку вместо той что закончилась
            let nextString = strings[stringCursor + 1]; 
            if (nextString) {
                drawString(stringCursor + 1);
            }
        } else { //конец песни
            stringCursor = -1;
        }
    }
}

const play = () => {
    let currentString = strings[stringCursor];
    let nextSyllable = currentString[syllableCursor];
    let timeToNext = (nextSyllable.time - audio.currentTime) * 1000;
    if (timeToNext < 0) return;
    
    timer = setTimeout(function show(syllable) {
        drawString(stringCursor, syllableCursor);
        if (syllable.timelineSpan?.classList) syllable.timelineSpan.classList.add('color');
        shiftWordCursors();
        if (stringCursor === -1) return;
        currentString = strings[stringCursor];
        nextSyllable = currentString[syllableCursor];

        let timeToNext = (nextSyllable.time - audio.currentTime) * 1000;
        if (timeToNext < 0) return;
        timer = setTimeout(show, timeToNext, nextSyllable);
    }, timeToNext, nextSyllable);

    // мы сейчас на audio.current time
    // следующий слог 
}

const clickHandler = () => { // как из js изменить css класс глобально? или css переменную
    // для timeline. 
    // когда мы делаем клик, нужно вычислять процент курсора таймлайна
    // и искать первый span что на пути изменить его процент и время. 
    // если span'а нет - добаить согласно слогу на позицию % курсора

    if (!~stringCursor) return;
    let currentString = strings[stringCursor];
    let syllable = currentString[syllableCursor];
    syllable.time = audio.currentTime;
    //syllable.element.classList.add('color');
    drawString(stringCursor, syllableCursor);

    shiftWordCursors();

    const currentPercent = (audio.currentTime - timelinePosition) / (timelineDuration / 100) + '%';
    if (syllable.timelineSpan?.style) { //секунд от начала timelinePosition
        syllable.timelineSpan.style.left = currentPercent;
        clearTimeout(timer);
        play();
    } else {
        syllable.timelineSpan = document.createElement('span');
        syllable.timelineSpan.textContent = syllable.syllable;
        spanSyllableMap.set(syllable.timelineSpan, syllable);
        syllable.timelineSpan.style.left = currentPercent;
        words.append(syllable.timelineSpan);
    } 
}

const showTimeline = (from, duration) => {
    timelinePosition = audio.currentTime;
    cursor.style.transitionDuration = '0s';
    cursor.style.left = '0%';
    words.innerHTML = '';

    const wordList = strings.flat().filter(({time}) => {
        return time >= from && time < from + duration;
    });
    wordList.forEach(word => {
        word.timelineSpan = document.createElement('span');
        word.timelineSpan.textContent = word.syllable;
        spanSyllableMap.set(word.timelineSpan, word);
        word.timelineSpan.classList.remove('color');
        const relativeTime = word.time - from; //секунд от начала from для word
        const secondInOnePersent = duration / 100; 
        const res = relativeTime / secondInOnePersent; // сколько процентов в rel;
        //перевести секунды
        word.timelineSpan.style.left = res + '%';
        words.append(word.timelineSpan);
    })
}

const updateTimelineDuration = () => {
    clearTimeout(timelineTimer);
    showTimeline(audio.currentTime, timelineDuration);
    if (started) requestAnimationFrame(runCursor);
}

scale.oninput = e => {
    const newVal = +scale.textContent;
    if (!newVal || newVal < 1) return;
    timelineDuration = newVal;
}

plus.onclick = () => {
    const newVal = timelineDuration - 3;
    if (newVal < 1) return;
    scale.textContent = timelineDuration = newVal;
    updateTimelineDuration();
}
minus.onclick = () => {
    scale.textContent = timelineDuration += 3;

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
    runCursor();
    play();
    main.onmousedown = main.ontouchstart = clickHandler;
    started = true;
}

audio.onpause = e => {
    let currentRelativeTime = audio.currentTime - timelinePosition; //секунд от начала timelinePosition
    cursor.style.transitionDuration = 0 + 's';
    cursor.style.left = currentRelativeTime / (timelineDuration / 100) + '%';
    clearTimeout(timelineTimer);
    clearTimeout(timer);
    main.onmousedown = main.ontouchstart = null
    started = false;
    updateLocalStorage(); //todo 
}

main.addEventLi

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
    let fromSpanIndex = spans.indexOf(selection.anchorNode.parentElement);
    let toSpanIndex = spans.indexOf(selection.focusNode.parentElement);
    if (fromSpanIndex > toSpanIndex) [fromSpanIndex, toSpanIndex] = [toSpanIndex, fromSpanIndex];
    return spans.slice(fromSpanIndex, toSpanIndex + 1);
}

let prevSelectedSpans = [];
//переделать
document.onselectionchange = e => {
    prevSelectedSpans.forEach(span => span.classList.remove('active'));
    const selection = getSelection();
    if(selection.anchorNode?.parentElement?.parentElement !== words || selection.focusNode?.parentElement?.parentElement !== words) return;
    prevSelectedSpans = getSelectedSpans(selection);
    prevSelectedSpans.forEach(span => span.classList.add('active'));
}

let multipleSelectionMode = false;

words.onmousedown = words.ontouchstart = e => {
    //как только e.targetTouches.length == 2 переходим в multipleSelectionMode
    words.onmousemove = words.ontouchmove = words.onmouseup = words.ontouchend = null;

    if (e.shiftKey) {multipleSelectionMode = true; return}
    if (e.touches?.length == 2) {
        getSelection().setBaseAndExtent(e.touches[0].target.childNodes[0], 0, e.touches[1].target.childNodes[0], 0);
        multipleSelectionMode = true;
        return;
    }
    if (started || e.target.tagName !== 'SPAN') return

    const syllable = spanSyllableMap.get(e.target);
    const pxToSpan = (e.x || e.targetTouches[0].clientX) - e.target.getBoundingClientRect().x;

    const selection = getSelection();
    let spansToDrag = [];
    
    if (multipleSelectionMode) {
        spansToDrag = getSelectedSpans(selection); 
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
        syllable.time = currentTime;
        e.target.style.left = newPercent + '%';
    }

    let multipleMoveHandler = moveEvent => {
        const fromSpan = parseFloat(spansToDrag[0].style?.left);
        const toSpan = parseFloat(spansToDrag[spansToDrag.length - 1].style?.left);
        const nextSpan = parseFloat(spansToDrag[spansToDrag.length - 1].nextElementSibling?.style?.left || 100);
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
            syllable.time = currentTime;
            span.style.left = newPercent + '%';
        });
    }

    words.onmouseup = words.ontouchend =  () => {
        if (multipleSelectionMode) document.getSelection().removeAllRanges();
        words.onmousemove = words.ontouchmove = null;
        multipleSelectionMode = false;
    };

    words.onmousemove = words.ontouchmove = multipleSelectionMode ? multipleMoveHandler : moveHandler;

    // words.onmousemove = words.ontouchmove = words.onmouseup = words.ontouchend = null;

    //если мы держим и не двигаемся 1.5 секунды - активируем режим мультивыделения
    //как на мобилке так и на десктопе
}

main.addEventListener('click', () => {
    document.getSelection().removeAllRanges();
    multipleSelectionMode = false;
});

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
        cursor.style.transitionDuration = 0 + 's';
        cursor.style.left = currentPercent + '%';
    }
}

