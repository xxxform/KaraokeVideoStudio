//slogi.su
var vowel = new String('аеёиоуыэюяАЕЁИОУЫЭЮЯ');
var voiced = new String('бвгджзлмнрхцчшщБВГДЖЗЛМНРХЦЧШЩ');
var deaf = new String('кпстфКПСТФ');
var brief = new String('йЙ');
var other = new String('ьъЬЪ');
var cons = new String('бвгджзйклмнпрстфхцчшщБВГДЖЗЙКЛМНПРСТФХЦЧШЩ');
function isNotLastSep(a) {
    var b = false;
    for (var i = 0; i < a.length; i++) {
        if (vowel.indexOf(a.substr(i, 1)) != -1) {
            b = true;
            break
        }
    }
    return b
}
function convert(s) {
    function addSep(a) {
        if (a != false) {
            e = e + ' ';
            return
        }
        var b = e.search(/[аеёиоуыэюя]/i);
        if (b < 0) {
            return
        }
        var c = e.search('/');
        if (c > -1) {
            return
        }
        f.push(e);
        e = ''
    }
    var d = new String();
    var e = new String();
    var f = new Array();
    var g = s.split(" ");
    var h = g.length;
    for (var j = 0; j < h; j++) {
        if (g[j].length < 2) {
            g[j] = g[j].replace('/', '')
        }
        for (var i = 0; i < g[j].length; i++) {
            d = g[j].substr(i, 1);
            e += d;
            var k = g[j].substr(i + 1, 1);
            var l = k.search(/[а-я]|ё/i); //на о произошла сепарация
            if (l > -1) {
                if ((i != 0) && (i != g[j].length - 1) && (brief.indexOf(d) != -1) && (isNotLastSep(g[j].substr(i + 1, g[j].length - i + 1)))) {
                    addSep(false);
                    continue
                }
                if ((i < g[j].length - 1) && (vowel.indexOf(d) != -1) && (vowel.indexOf(g[j].substr(i + 1, 1)) != -1)) {
                    addSep(false);
                    continue
                }
                if ((i < g[j].length - 2) && (vowel.indexOf(d) != -1) && (cons.indexOf(g[j].substr(i + 1, 1)) != -1) && (vowel.indexOf(g[j].substr(i + 2, 1)) != -1)) {
                    addSep(false);
                    continue
                }
                if ((i < g[j].length - 2) && (vowel.indexOf(d) != -1) && (deaf.indexOf(g[j].substr(i + 1, 1)) != -1) && (cons.indexOf(g[j].substr(i + 2, 1)) != -1) && (isNotLastSep(g[j].substr(i + 1, g[j].length - i + 1)))) {
                    addSep(false);
                    continue
                }
                if ((i > 0) && (i < g[j].length - 1) && (voiced.indexOf(d) != -1) && (vowel.indexOf(g[j].substr(i - 1, 1)) != -1) && (vowel.indexOf(g[j].substr(i + 1, 1)) == -1) && (other.indexOf(g[j].substr(i + 1, 1)) == -1) && (isNotLastSep(g[j].substr(i + 1, g[j].length - i + 1)))) {
                    addSep(false);
                    continue
                }
                if ((i < g[j].length - 1) && (other.indexOf(d) != -1) && ((vowel.indexOf(g[j].substr(i + 1, 1)) == -1) || (isNotLastSep(g[j].substr(0, i))))) {
                    addSep(false);
                    continue
                }
            }
        }
        if (j !== h-1)
            addSep(true);
    }
    f.push(e);
    return f.join('/')
}
