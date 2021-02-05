'use strict';

const OperatorAbstract = require('./abstract').OperatorAbstract;

/**
 * Used to wrap into percent sign (%) for sql like search combined with OR
 * Similar to ContainsOperator, but with the single input for several entity fields
 *
 * @class ContainsOperator
 */
class SearchByFieldsOperator extends OperatorAbstract {
    /**
     * Create identity operator
     * @param {String[]} fieldsForSearchIn
     * @param {Boolean} percentSafe
     * @param {String} searchParamName
     */
    constructor({ fieldsForSearchIn = [], percentSafe = false, searchParamName = 'search' }) {
        super({ sequelizeName: '$like' });
        this.__searchParamName = searchParamName;
        this.__fieldsForSearchIn = fieldsForSearchIn;
        this.__percentSafe = percentSafe;
    }

    /**
     * It is applicable for the single field ("search" by default)
     *
     * @param {String} value query parameter value
     * @param {String} field transformed field
     * @param {String} originalField original query parameter name
     * @return {Boolean}
     */
    isApplicable(value, field, originalField) {
        return value && this.__searchParamName === originalField && this.__fieldsForSearchIn.length;
    }

    getSequelizeWhere(value, field, originalField) {
        const likeValue = this.getSequelizeArguments(value, field, originalField);
        return {
            '$or': this.__fieldsForSearchIn.reduce((or, topLevelEntityField) => Object.assign(or, {
                [topLevelEntityField]: { [this.__sequelizeName]: likeValue }
            }), {}),
        };
    }

    /**
     * Strip value then surround it by percent signs
     *
     * @param {String} value query parameter value
     * @return {Boolean|String|Object} operator
     */
    getSequelizeArguments(value) {
        const strippedPercent = this.__percentSafe ? value.split('%').join('\\%') : value;
        return `%${strippedPercent}%`;
    }

    extraAllowedFields(allowedFields) {
        return super.extraAllowedFields(allowedFields).concat(this.__searchParamName);
    }
}

module.exports = { SearchByFieldsOperator };
