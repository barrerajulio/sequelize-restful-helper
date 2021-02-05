'use strict';

const _ = require('lodash');
const OperatorAbstract = require('./abstract').OperatorAbstract;

/**
 * This class used for simply passing query parameter as is for equal filtering ($eq)
 * It doesn't support request response time options and should be instantiated (new StandardValueOperator) at
 * application startup
 * It can be applied for every query parameter/value. It always should be used the last (lowest priority of applying)
 *
 * @class IdentityOperator
 */
class IdentityOperator extends OperatorAbstract {
    /**
     * Create identity operator
     */
    constructor() {
        super({ sequelizeName: '$eq' });
    }

    /**
     * It always applicable
     * @return {Boolean|true}
     */
    isApplicable() {
        return true;
    }

    getSequelizeWhere(value, field) {
        return {
            [field]: this.getSequelizeArguments(value)
        };
    }

    /**
     * Getting operator from value as is - identity
     * @param {String} value query parameter value
     * @return {String} operator
     */
    getSequelizeArguments(value) {
        return value;
    }
}

module.exports = { IdentityOperator };
