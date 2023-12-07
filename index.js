let started = false;
let strings = []; 
let syllableCursor = -1;
let stringCursor = -1;
let timer = -1;
let timelineDuration = scale.textContent = 10; //в секундах
let timelinePosition = 0;
let timelineTimer = -1;

//проблемы с буковй ё. остаё не делится на два слога
//todo нижняя редактируемая линейка слов

//todo. неудобно редактировать слова. 
//или сделать перетаскиваемый курсор 
//или при перемотке двигать курсор и не перерисовывать таймлайн пока курсор не выйдет за его пределы по времени

fileInput.onchange = () => {
    if (fileInput.files[0])
        audio.src = (window.URL || window.webkitURL).createObjectURL(fileInput.files[0]);
}

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
            const span = document.createElement('span');
            span.textContent = syllable.syllable;
            syllable.element = span;
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
}

textarea.onchange = createSyllableMap;
//_ склеивает частицу в один слог со словом. пробел, /, - разделители слогов
// первым делом нужно сплит по \n - организация строчек песни в массив.
// каждый слог должен быть привязан ко времени в секундах. 

//каждый запуск ищется последний слог, у которого нет времени т.е time === -1.
// или последний который больше currentTime
//performance.now() возвращает время в ms от загрузки страницы.

//extra: при удержании пальца/кнопки слог тянется

// audio.currentTime //в секундах, writable
//.duration длительность
// .textTracks бывает и такое
// .addTextTrack()
//on play playing pause timeupdate
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
    firstString.innerHTML = '';

    currentString.forEach((({element, timelineSpan}, index) => {
        element.classList.remove('color');
        firstString.appendChild(element);
        if (index < syllableCursor) {
            element.classList.add('color');
            if (timelineSpan) timelineSpan.classList.add('color');
        } 
    }));

    if (nextString) {
        secondString.innerHTML = '';
        nextString.forEach((({element}) => {
            element.classList.remove('color');
            secondString.appendChild(element);
        }));
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
        const prevString = strings[stringCursor];
        const p = prevString[0].element.parentElement; //строка что закончилась

        if (strings[stringCursor + 1]) {//виртуальная следующая строка существует в strings
            ++stringCursor;

            //отображаем новую строку вместо той что закончилась
            let nextString = strings[stringCursor + 1]; 
            if (nextString) {
                p.innerHTML = '';
                nextString.forEach((({element}) => {
                    element.classList.remove('color');
                    p.appendChild(element);
                }));
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
        syllable.element.classList.add('color');
        if (syllable.timelineSpan) syllable.timelineSpan.classList.add('color');
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
    syllable.element.classList.add('color');

    const currentPersent = (audio.currentTime - timelinePosition) / (timelineDuration / 100) + '%';
    if (syllable.timelineSpan)  //секунд от начала timelinePosition
        syllable.timelineSpan.style.left = currentPersent;
    else {
        syllable.timelineSpan = syllable.element.cloneNode(true);
        syllable.timelineSpan.style.left = currentPersent;
        words.append(syllable.timelineSpan);
    }
    
    shiftWordCursors();
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
        word.timelineSpan = word.element.cloneNode(true);
        word.timelineSpan.classList.remove('color');
        const relativeTime = word.time - from; //секунд от начала from для word
        const secondInOnePersent = duration / 100; 
        const res = relativeTime / secondInOnePersent; // сколько процентов в rel;
        //перевести секунды
        word.timelineSpan.style.left = res + '%';
        words.append(word.timelineSpan);
    })
}

plus.onclick = () => {
    clearTimeout(timelineTimer);
    showTimeline(audio.currentTime, +(scale.textContent = timelineDuration -= 3));
    if (started) requestAnimationFrame(runCursor);
}
minus.onclick = () => {
    clearTimeout(timelineTimer);
    showTimeline(audio.currentTime, +(scale.textContent = timelineDuration += 3));
    if (started) requestAnimationFrame(runCursor);
}

audio.onplay = e => {
    setCursorPosition();
    showStringsByPosition();
    runCursor();
    play();
    main.onclick = clickHandler;
    started = true;
}

audio.onpause = e => {
    let currentRelativeTime = audio.currentTime - timelinePosition; //секунд от начала timelinePosition
    cursor.style.transitionDuration = 0 + 's';
    cursor.style.left = currentRelativeTime / (timelineDuration / 100) + '%';
    clearTimeout(timelineTimer);
    clearTimeout(timer);
    main.onclick = null
    started = false;
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
    showTimeline(audio.currentTime, timelineDuration);
    console.log('ontimeupdate');
}

