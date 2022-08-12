export const getRandomInt = (start = 0, finish = 100): number => {
    const s = Math.ceil(start);
    const f = Math.floor(finish);

    return Math.floor(Math.random() * (f - s + 1)) + s;
};
