const RestfullHelper = require('./SequelizeQueryBuilder');

class SearchableQueryBuilder extends RestfullHelper {

    /**
     *
     * @param {Object} queryParams - request query from Express (req.query)
     * @param {Object} options - option object
     * @param {array} [options.allowedFilters=[]] - array of field names that model can be filtered by
     * @param {array} [options.allowedOrder=[]] - array of relation names that model can be ordered by
     * @param {String[]} [options.searchFields=[]] - array of field names that model can be searched by in "OR" mode
     * @param {String[]} [options.strictSearchFields=[]] - array of field names that model can be searched by in "one2one" mode
     * @param {String} [options.orderParam="sort"] - name of query parameter which responsive for "order by" value
     * @param {String} [options.searchParam="search"] - name of query parameter for search
     * @param {*} [options.paginator={*}] - Paginator's params
     */
    constructor(queryParams, options) {
        const extendedOptions = Object.assign({}, options, {
            operators: [
                new RestfullHelper.operators.ContainsOperator({ onlyForFields: options.strictSearchFields }),
                new RestfullHelper.operators.SearchByFieldsOperator({
                    fieldsForSearchIn: options.searchFields,
                    searchParamName: options.searchParam
                })
            ].concat(RestfullHelper.operators.standardOperators)
        });

        super(queryParams, extendedOptions);
    }
}


module.exports = SearchableQueryBuilder;
