function isOperator(item) {
    return ['AND', 'NOT', 'OR', 'THEN', '(', ')'].includes(item);
}

module.exports.isOperator = isOperator;

function priority(op) {
    if (op === 'NOT') return 4;
    if (op === 'AND') return 3;
    if (op === 'OR') return 2;
    if (op === 'THEN') return 1;
    throw new Error(`Invalid operator: '${op}'`);
}

module.exports.infixToPostfix = (infix) => {
    const stack = [];
    const result = [];
    for (const item of infix) {
        if (isOperator(item)) {
            if (item === '(' || (stack.length > 0 && stack.slice(-1)[0] === '(')) {
                stack.push(item);
            } else if (item === ')') {
                let popped = stack.pop();
                while (stack.length > 0 && popped !== '(') {
                    result.push(popped);
                    popped = stack.pop();
                }
            } else {
                while (stack.length > 0 && priority(item) <= priority(stack.slice(-1)[0]))
                    result.push(stack.pop());
                stack.push(item);
            }
        } else result.push(item);
    }
    while (stack.length > 0) result.push(stack.pop());
    return result;
}