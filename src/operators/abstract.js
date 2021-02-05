'use strict';
// In abstract class arguments need to be defined, but in fact they don't used
/* eslint no-unused-vars: "off" */
/**
 * Used to build where part used by sequelize
 * Operators powered over parameters value, and should getting useful data withing it
 * Also could add extra query parameters for processing by QueryBuilder
 * @class OperatorAbstract
 * @abstract
 */
class OperatorAbstract {
    /**
     * @param {String} sequelizeName common case is to use operator from sequelize ($like, $eq, ...)
     */
    constructor({ sequelizeName }) {
        this.__sequelizeName = sequelizeName;
    }

    /**
     * Check if passed parameter and value can be processed by this operator
     *
     * @param {String} value query parameter value
     * @param {String} field transformed field
     * @param {String} originalField original query parameter name
     * @return {Boolean}
     * @public
     * @abstract
     */
    isApplicable(value, field, originalField) {
        throw new Error('Not implemented');
        return false;
    }

    /**
     * Build object that should be used by sequelize
     *
     * @param {String} value query parameter value
     * @param {String} field transformed field
     * @param {String} originalField original query parameter name
     * @return {Object}
     * @public
     */
    getSequelizeWhere(value, field, originalField) {
        return {
            [field]: {
                [this.__sequelizeName]: this.getSequelizeArguments(value, field, originalField)
            }
        };
    }

    /**
     * Getting operator data for building where from value
     * It can simply return passed value as is or do extra processing, parsing, stripping
     *
     * @param {String} value query parameter value
     * @param {String} field transformed field
     * @param {String} originalField original query parameter name
     * @return {Boolean|String|Object} operator
     * @protected
     * @abstract
     */
    getSequelizeArguments(value, field, originalField) {
        throw new Error('Not implemented');
        return value;
    }

    /**
     * Getting extra field that can be part of query that should be processed (by the operator)
     * This allow operator to choice query parameter name and process query based on the name not the value, or by both
     *
     * @param {String[]} allowedFields original query parameters name
     * @return {String[]} additional fields
     * @public
     */
    extraAllowedFields(allowedFields) {
        return [];
    }
}

module.exports = { OperatorAbstract };
