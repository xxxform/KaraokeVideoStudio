let started = false;

addEventListener('message', e => {
    const startTime = performance.now();
    const [type, time] = e.data;
    const callBackTime = startTime + time;

    if (type === 'stop') {
        started = false;
        return;
    } 

    started = true;

    if (type === 'render') {
        while (started) {
            if (performance.now() >= callBackTime) {
                postMessage(true);
                started = false;
                return;
            }
        }
    } else {
        (function loop () {
            if (!started) return;
            if (performance.now() >= callBackTime) {
                postMessage(true);
                started = false;
                return;
            }
            requestAnimationFrame(loop);
        })()
        
    }
});