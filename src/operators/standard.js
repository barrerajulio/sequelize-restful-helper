'use strict';

const _ = require('lodash');
const OperatorAbstract = require('./abstract').OperatorAbstract;

/**
 * This class used for general purpose set of operators
 * It doesn't support request response time options and should be instantiated (new StandardValueOperator) at
 * application startup
 * It support only value encoded operator metadata: value of a query parameter contains special data in the beginning,
 *   for example "$gt:123" or ">:123".
 *
 * @class StandardValueOperator
 */
class StandardValueOperator extends OperatorAbstract {
    /**
     * @param {RegExp} validationRegExp
     * @param {Number} argNumber
     * @param {String} name
     * @param {String} sequelizeName
     */
    constructor({ name, sequelizeName, validationRegExp, argNumber }) {
        super({ sequelizeName });
        this.__name = name;
        this.__validationRegExp = validationRegExp;
        this.__argNumber = argNumber;
        this.__argSeparator = '|';
    }

    /**
     * Check if value can be processed by the operator
     *
     * @param {String} value query parameter value
     * @return {Boolean}
     */
    isApplicable(value) {
        return value && _.isString(value) && value.indexOf(this.__name) === 0 && this.__validationRegExp.test(value);
    }

    /**
     * Getting operator from the value
     *
     * @param {String} value query parameter value
     * @return {String|String[]} operator
     */
    getSequelizeArguments(value) {
        const rawArguments = this.__removeOperatorMetadata(value);
        return this.__parseSequelizeArguments(rawArguments);
    }

    /**
     * Parse value for comparison
     *
     * @param {String} value
     * @return {String|String[]}
     * @private
     */
    __parseSequelizeArguments(value) {
        if (this.__argNumber !== 1 && value.includes(this.__argSeparator)) {
            return (value.split(this.__argSeparator));
        }
        return value;
    }

    /**
     * Removing operator from value and trim spaces
     *
     * @param {String} value
     * @return {String}
     * @private
     */
    __removeOperatorMetadata(value) {
        return value.replace(this.__name, '').trim();
    }
}

module.exports = { StandardValueOperator };
