'use strict';

const OperatorAbstract = require('./abstract').OperatorAbstract;

/**
 * Used to wrap into percent sign (%) for sql like search
 * Produce where for filtering by the known array of entity field by contain criteria, example:
 *   Does user with name "Ivan" contain in the `name` field 'an'? (where user.name like "%an%")
 *
 * @class ContainsOperator
 */
class ContainsOperator extends OperatorAbstract {
    /**
     * Create identity operator
     * @param {String[]} onlyForFields
     * @param {Boolean} percentSafe
     */
    constructor({ onlyForFields = [], percentSafe = false }) {
        super({ sequelizeName: '$like' });
        this.__onlyForFields = onlyForFields;
        this.__percentSafe = percentSafe;
    }

    /**
     * It is operator always
     * @param {String} value query parameter value
     * @param {String} field transformed field
     * @param {String} originalField original query parameter name
     * @return {Boolean}
     */
    isApplicable(value, field, originalField) {
        return value && this.__onlyForFields.indexOf(originalField) !== -1;
    }

    /**
     * Getting operator from value
     * @param {String} value query parameter value
     * @return {Boolean|String|Object} operator
     */
    getSequelizeArguments(value) {
        const strippedPercent = this.__percentSafe ? value.split('%').join('\\%') : value;
        return `%${strippedPercent}%`;
    }

    /**
     * Add known fields for processing
     *
     * @param {String[]} allowedFields original query parameters name
     * @return {String[]} additional fields
     * @public
     */
    extraAllowedFields(allowedFields) {
        return super.extraAllowedFields(allowedFields).concat(this.__onlyForFields);
    }
}

module.exports = { ContainsOperator };
