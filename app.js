const chalk = require('chalk')
const fs = require('fs');
Array.prototype.last = function () {
    return this.slice(-1)[0];
}

function not (statement) {
    let newStatement = [];
    for (const item of statement) {
        if (item === 'NOT') {
            if (newStatement.length > 0 && newStatement.last() === 'NOT') {
                newStatement.pop();
            } else {
                newStatement.push(item);
            }
        } else newStatement.push(item);
    }
    statement = newStatement;
    const res = [];
    let skippedNot = false;
    for (const item of statement) {
        if (item === 'NOT') {
            skippedNot = true;
            continue;
        }
        if (item === 'OR') res.push('AND');
        else if (item === 'AND') res.push('OR');
        else {
            if (skippedNot) {
                res.push(item)
            } else {
                res.push('NOT', item)
            }
            skippedNot = false;
        }
    }
    return res;
}

function then (s1, s2) { // NOT s1 OR s2
    let then = not(s1);
    let newThen = [[]];
    let newS2 = [[]];
    for (const item of then) {
        if (item === 'AND') newThen.push([]);
        else newThen.last().push(item);
    }
    for (const item of s2) {
        if (item === 'AND') newS2.push([]);
        else newS2.last().push(item);
    }

    let finalResult = [];
    for (const item of newThen) {
        for (const item2 of newS2) {
            finalResult.push([...item, 'OR', ...item2]);
        }
    }
    return finalResult;
}

function notThen (s1, s2) {
    let then = s1;
    let newThen = [[]];
    let newS2 = [[]];
    for (const item of then) {
        if (item === 'AND') newThen.push([]);
        else newThen.last().push(item);
    }
    s2 = not(s2);
    for (const item of s2) {
        if (item === 'AND') newS2.push([]);
        else newS2.last().push(item);
    }

    let finalResult = [];
    for (const item of newThen) {
        for (const item2 of newS2) {
            finalResult.push(item, item2);
        }
    }
    return uniq(finalResult);
}

const readInput = () => fs.readFileSync('./input.txt').toString();

function getData(input) {
    const lines = input.split(require('os').EOL)
    return {
        KBs: lines.slice(0, lines.length - 1).map(kb => kb.split(':')[1].trim().split(/\s+/).map(item => item.trim())),
        T: lines.slice(-1)[0].split(':')[1].trim().split(/\s+/).map(item => item.trim())
    }
}

function statementToCNF (input) {
    if (input.includes('THEN')) {
        const res = then(input.slice(0, input.indexOf('THEN')), input.slice(input.indexOf('THEN') + 1, input.length));;
        if (Array.isArray(res[0]))
            return res;
        return [res];
    } else {
        return [input];
    }
}

function notTheorem (input) {
    if (input.includes('THEN')) {
        const res = notThen(input.slice(0, input.indexOf('THEN')), input.slice(input.indexOf('THEN') + 1, input.length));;
        if (Array.isArray(res[0]))
            return res;
        return [res];
    } else {
        return [not(input)];
    }
}

function convertToCNF (input) {
    const CNFKBs = [];
    input.KBs.map(kb => {
        let arr = statementToCNF(kb);
        for (const item of arr)
            CNFKBs.push(item);
    })
    return {
        KBs: CNFKBs,
        T: notTheorem(input.T)
    }
}

function getKB (cnfInput) {
    return [
        ...cnfInput.KBs,
        ...cnfInput.T,
    ]
}

function uniq(list) {
    let finalSetResult = new Set();
    for (const item of list) {
        finalSetResult.add(JSON.stringify(item));
    }
    finalSetResult = [...finalSetResult].map(a => JSON.parse(a));
    return finalSetResult;
}

function getFinalKB (kb) {
    let res = [];
    for (const item of kb) {
        if (item.includes('AND')) {
            let resPrime = [];
            for (const member of item) {
                if (member === 'AND') {
                    res.push(resPrime)
                    resPrime = [];
                } else resPrime.push(member);
            }
            res.push(resPrime);
        } else res.push(item);
    }
    return uniq(res);
}

function resolution (finalKB) {
    for (let i = 0; i < finalKB.length; i++) {
        const kb1 = finalKB[i];
        for (let j = 0; j < finalKB.length; j++) {
            const kb2 = finalKB[j];
            if (JSON.stringify(kb1) === JSON.stringify(kb2)) continue;
            console.log('         >', chalk.cyan(JSON.stringify(finalKB)))
            if (kb1.includes('OR') || kb2.includes('OR')) {
                if (kb1.includes('OR') && kb2.includes('OR')) continue; // SAME
                let withOr, withoutOr, hasNot = false;
                if (kb1.includes('OR')) {
                    withOr = kb1;
                    withoutOr = kb2;
                } else {
                    withOr = kb2;
                    withoutOr = kb1;
                }
                if (withoutOr.includes('NOT')) hasNot = true;

                const checkingVariable = withoutOr[hasNot ? 1 : 0];
                const index = withOr.indexOf(checkingVariable);
                if (index !== -1) {
                    const isNegative = withOr[index - 1] === 'NOT';
                    if ((hasNot && !isNegative) || (!hasNot && isNegative)) {
                        const newWithOr = [];
                        for (const item of withOr) {
                            if (item === checkingVariable) {
                                if (isNegative) newWithOr.pop();
                            } else {
                                newWithOr.push(item)
                            }
                        }
                        if (newWithOr[0] === 'OR') newWithOr.shift();
                        if (newWithOr.last() === 'OR') newWithOr.pop();
                        finalKB[j] = newWithOr;
                        finalKB = uniq(finalKB);
                    }
                }
                // go on
            } else {
                if (kb1.length === kb2.length) continue; // can not resolve || equivalent
                let withNot;
                let withoutNot;
                if (kb1.length === 2) {
                    withNot = kb1;
                    withoutNot = kb2;
                } else {
                    withNot = kb2;
                    withoutNot = kb1;
                }
                if (withNot[1] === withoutNot[0]) {  // TANAGHOZ
                    console.log(chalk.bold('\n         + Contradiction:'), JSON.stringify(withNot), JSON.stringify(withoutNot), chalk.yellow('══>'), chalk.rgb(0,255,0)('Theorem is proved!   :)'))
                    return 1;
                    // TODO finish
                }
                // go on
            }
        }
    }
    return 0;
}

const input = getData(readInput());
const cnfInput = convertToCNF(input);
console.log('──────────────────────────────────────────────────────────────────────────────')
console.log('► input:', chalk.bgBlue(chalk.black(JSON.stringify(input))));
console.log('► CNF:  ', chalk.bgYellow(chalk.black(JSON.stringify(cnfInput))))
const kb = getKB(cnfInput);
const finalKB = getFinalKB(kb);
console.log('► KB:   ', chalk.bgMagenta(chalk.black(JSON.stringify(finalKB))));
console.log('──────────────────────────────────────────────────────────────────────────────')
console.log('► Steps:')
const result = resolution(finalKB);

if (result === 0) {
    console.log()
    console.log('        ',  chalk.yellow('╚═>'), chalk.red('Theorem is not proved!   :('))
}

console.log()
console.log()
console.log()
// console.log(JSON.stringify(then(tokenizeStatement('d'), tokenizeStatement('NOT a AND b'))))