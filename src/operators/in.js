'use strict';

const _ = require('lodash');
const OperatorAbstract = require('./abstract').OperatorAbstract;

/**
 * This class used for simply passing query parameter as is for equal filtering ($eq)
 * It doesn't support request response time options and should be instantiated (new StandardValueOperator) at
 * application startup
 * It can be applied for every query parameter/value. It always should be used the last (lowest priority of applying)
 *
 * @class InOperator
 */
class InOperator extends OperatorAbstract {
    /**
     * Create identity operator
     */
    constructor({ name, sequelizeName, validationRegExp, argNumber }) {
        super({ sequelizeName });
        this.__name = name;
        this.__validationRegExp = validationRegExp;
        this.__argNumber = argNumber;
        this.__argSeparator = ',';
    }

    /**
     * It always applicable
     * @return {Boolean|true}
     */
    isApplicable(value) {
        return value && _.isString(value) && value.indexOf(this.__name) === 0 && this.__validationRegExp.test(value);
    }

    getSequelizeWhere(value, field) {
        return {
            [field]: { "$in": this.getSequelizeArguments(value) }
        };
    }

    /**
     * Getting operator from value as is - identity
     * @param {String} value query parameter value
     * @return {String} operator
     */
    getSequelizeArguments(value) {
        const matches = value.match(/<<>>(?<inValues>[A-Z0-9,]+)/i);
        if (matches && matches.groups) {
            value = matches.groups.inValues.split(",")
        }
        return value;
    }
}

module.exports = { InOperator };
