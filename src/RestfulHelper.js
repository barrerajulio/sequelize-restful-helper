'use strict';

const SequelizeQueryBuilder = require('./SequelizeQueryBuilder');


/**
 * Query builder for sequelize with old known operators set
 * @class SequelizeQueryBuilderWithDefaultOperators
 */
class SequelizeQueryBuilderWithDefaultOperators extends SequelizeQueryBuilder {
    /**
     *
     * @param {object} queryParams - request query from Express (req.query)
     * @param {object} options - option object
     * @param {string[]} [options.allowedFilters=[]] - array of field names that model can be filtered by
     * @param {string[]} [options.allowedOrder=[]] - array of relation names that model can be ordered by
     * @param {object} [options.filterAliases={}] - object with filter name to real field name mapping
     * @param {string} [options.orderParam="sort"] - name of query parameter which responsive for "order by" value
     * @param {Model} [options.model] - Sequelize model to build relations include query
     * @param {*} [options.paginator={*}] - Paginator's params
     */
    constructor(queryParams, options) {
        const extendedOptions = Object.assign({}, options, {
            operators: SequelizeQueryBuilder.operators.standardOperators
        });

        super(queryParams, extendedOptions);
    }
}

module.exports = SequelizeQueryBuilderWithDefaultOperators;
