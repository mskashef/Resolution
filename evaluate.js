const {isOperator} = require('./infixToPostfix');
//  in: NOT ( NOT p OR NOT r OR q)
// out: p AND r AND NOT q
module.exports.evaluate = (statement) => {
    // console.log(statement)
    const stack = [];
    const result = [];
    while (statement.length > 0) {
        const item = statement.shift();
        let a, b;
        if (isOperator(item)) {
            switch (item) {
                case 'AND':
                    break;
                case 'OR':
                    a = stack.pop();
                    b = stack.pop();
                    result.push([a, b, 'OR']);
                    stack.push([a, b, 'OR']);
                    break;
                case 'NOT':
                    a = stack.pop();
                    result.push([a, 'NOT'])
                    break;
                case 'THEN':
                    break;
            }
        } else {
            stack.push(item);
        }
    }
    return result
}