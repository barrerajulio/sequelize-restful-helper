'use strict';

const _ = require('lodash');
const Paginator = require('./Paginator');
const errors = require('./errors');
const operators = require('./operators');

/**
 * @typedef SequelizeQueryInclude
 * @property {Object|Association} [association]
 * @property {Sequelize.Model|Model} [model]
 * @property {string} [as]
 * @property {boolean} [required]
 * @property {Object} [where]
 * @property {SequelizeQueryInclude|SequelizeQueryInclude[]} [include]
 */

/**
 * Query builder for sequelize
 * @class SequelizeQueryBuilder
 */
class SequelizeQueryBuilder {

    /**
     * @param {SequelizeQueryInclude[]} sparseIncludes
     * @return {SequelizeQueryInclude[]}
     */
    static mergeIncludes(sparseIncludes) {
        return sparseIncludes.reduce((includes, include) => {
            const oldIncludeIndex = _.findIndex(includes, _.pick(include, ['association', 'model', 'as']));
            if (oldIncludeIndex >= 0) {
                const newInclude = _.defaultsDeep(_.omit(include, 'include'), includes[oldIncludeIndex]);
                if (newInclude.include && include.include) {
                    newInclude.include = SequelizeQueryBuilder.mergeIncludes(newInclude.include.concat(include.include));
                } else if (include.include) {
                    newInclude.include = [].concat(include.include);
                }
                includes[oldIncludeIndex] = newInclude;
            } else {
                includes.push(include);
            }
            return includes;
        }, []);
    }

    /**
     *
     * @param {object} queryParams - request query from Express (req.query)
     * @param {object} options - option object
     * @param {string[]} [options.allowedFilters=[]] - array of field names that model can be filtered by
     * @param {string[]} [options.allowedOrder=[]] - array of relation names that model can be ordered by
     * @param {object} [options.filterAliases={}] - object with filter name to real field name mapping
     * @param {string} [options.orderParam="sort"] - name of query parameter which responsive for "order by" value
     * @param {Model} [options.model] - Sequelize model to build relations include query
     * @param {OperatorAbstract[]} [options.operators=[new operators.IdentityOperator()]] - rules for filtration building, default - identity
     * @param {*} [options.paginator={*}] - Paginator's params
     */
    constructor(queryParams, options) {
        this._queryParams = queryParams;
        this._options = _.defaultsDeep(options, {
            allowedFilters: [],
            allowedOrder: [],
            filterAliases: {},
            orderParam: 'sort',
            paginator: {
                defaultPageSize: 30,
                pageParam: 'page',
                pageSizeParam: 'limit',
                offsetParam: 'offset',
                pageSizeLimit: [1, 150]
            },
            model: null
        });
        if (!this._options.operators) {
            this._options.operators = [new operators.IdentityOperator()]
        }
        this._model = this._options.model;
        this._options.allowedFilters = _.difference(this._options.allowedFilters, [
            this._options.orderParam,
            this._options.paginator.pageParam,
            this._options.paginator.offsetParam,
            this._options.paginator.pageSizeParam
        ]);

        this._paginator = null;

        this._options.operators.forEach(operator => {
            this._options.allowedFilters = this._options.allowedFilters.concat(operator.extraAllowedFields(this._options.allowedFilters));
        });
        this._options.allowedFilters = _.uniq(this._options.allowedFilters);
    }

    /**
     * Returns object with Sequelize findOptions for request with pagination, sorting & filters
     * See: http://docs.sequelizejs.com/en/latest/api/model/#findalloptions-promisearrayinstance
     *
     * @returns {{offset, limit, order: (String|String[][]|null), where: Object, include: Array, attributes: {include: Array, exclude: Array}}}
     */
    getSequelizeOptions() {
        return {
            offset: this.getPaginator().getOffset(),
            limit: this.getPaginator().getLimit(),
            order: this.generateOrder(),
            where: this.generateFilters(),
            include: this.generateIncludes(),
            attributes: { include: [], exclude: [] }
        };
    }

    /**
     * @returns {Paginator}
     */
    getPaginator() {
        if (this._paginator === null) {
            this._paginator = new Paginator(this._queryParams, this._options.paginator);
        }

        return this._paginator;
    }

    /**
     * Returns expression for order sequelize statement
     * @return {[[String, String]]|null}
     */
    generateOrder() {
        let fields = this._queryParams[this._options.orderParam];

        if (!_.isString(fields)) {
            return null;
        }

        const order = [];
        fields = fields
            .trim()
            .split(',')
            .filter(field => field.trim() !== '');

        _.forEach(fields, field => {
            let direction = 'ASC';
            if (field.substr(0, 1) === '-') {
                direction = 'DESC';
                field = field.substr(1);
            }

            if (this._options.allowedOrder.indexOf(field) !== -1) {
                order.push([field, direction]);
            }
        });

        return order.length === 0 ? null : order;
    }

    /**
     * Generate where statement for sequelize from filter params
     * @return {Object} where - where filter
     */
    generateFilters() {
        return this.__traverseAllowedFilters(this._options.allowedFilters, false, this._queryParams, (where, value, transformedFilter, filter) => {
            return _.merge(where, this.__makeComparison(transformedFilter, value, filter));
        }, {});
    }

    /**
     * Generate include statement for relations for sequelize from filter params
     *
     * @return {Array} include - include relations
     */
    generateIncludes() {
        const filteringIncludes = this.__generateIncludes(this._options.allowedFilters, this._queryParams);
        return SequelizeQueryBuilder.mergeIncludes(filteringIncludes)
    }

    /**
     *
     * @param {String} originalFilter
     * @param {String} transformedFilter
     * @param {Model} model
     * @return {*}
     * @private
     */
    __buildIncludeRelation(originalFilter, transformedFilter, model) {
        const parts = transformedFilter.split('.');
        const field = parts.pop();
        return this.__buildIncludeRelationInner(originalFilter, parts, field, model);
    }

    /**
     *
     * @param originalFilter
     * @param {String|Array} transformedFilter
     * @param {String|undefined} field to map value
     * @param {Model} model
     * @return {*}
     * @private
     */
    __buildIncludeRelationInner(originalFilter, transformedFilter, field, model) {
        // iterating from left to right
        const association = transformedFilter.shift();
        const associationInfo = this.__getAssociatedInfo(model, association);
        const result = {
            association: associationInfo.association,
            model: associationInfo.model, // merge with scope
            as: associationInfo.as, // merge with scope
            required: true, // wrong count
        };
        if (transformedFilter.length > 0) {
            result.include = [this.__buildIncludeRelationInner(originalFilter, transformedFilter, field, associationInfo.model)];
        } else {
            // Making where query inside include blocks
            result.where = this.__makeComparison(field, this._queryParams[originalFilter], originalFilter);
        }
        return result;
    }

    /**
     * Get next associated model
     *
     * @param {Model} model
     * @param {String} associationName
     * @return {{association: Association, model: Model, as: String}}
     * @private
     */
    __getAssociatedInfo(model, associationName) {
        const association = model.associations[associationName];
        if (!association) {
            throw new Error(`Association with alias "${associationName}" does not exists`);
        }
        model = association.target;

        return {
            association,
            model,
            as: association.as,
        };
    }

    /**
     * Get real filter string by alias
     *
     * @param {string} filter
     * @returns {string}
     * @private
     */
    __getFilterByAlias(filter) {
        if (this._options.filterAliases.hasOwnProperty(filter)) {
            return this._options.filterAliases[filter];
        }
        return filter;
    }

    /**
     * If field contains dots it is relational filter
     *
     * @param {string} field
     * @returns {boolean}
     * @private
     */
    __isRelationalFilter(field) {
        return field.includes('.');
    }

    /**
     * @param {String[]} allowedFilters
     * @param {Boolean|null} isRelational
     * @param {Object} fields
     * @param {Function} traverseCb - (accumulator, fieldValue) => accumulator
     * @param {Object|Array} result
     * @return {Object|Array}
     * @private
     */
    __traverseAllowedFilters(allowedFilters = [], isRelational, fields = {}, traverseCb = _.identity, result) {
        return allowedFilters.reduce((accumulator, filter) => {
            const value = fields[filter];
            if (!value) {
                return accumulator;
            }
            const transformedFilter = this.__getFilterByAlias(filter);
            if (!_.isNull(isRelational) && this.__isRelationalFilter(transformedFilter) !== isRelational) {
                return accumulator;
            }
            return traverseCb(accumulator, value, transformedFilter, filter)
        }, result);
    }

    /**
     * Generate include statement for relations for sequelize from filter params
     *
     * @return {Array} include - include relations
     */
    __generateIncludes(allowedFilters, fields = {}) {
        if (!this._model) {
            return [];
        }

        return this.__traverseAllowedFilters(allowedFilters, true, fields, (includes, value, transformedFilter, filter) => {
            return includes.concat(this.__buildIncludeRelation(filter, transformedFilter, this._model));
        }, []);
    }

    /**
     * Transforms query string statement to sequelize statement
     * @param {String} field - field name
     * @param {String|Number|Boolean} value - raw query string value
     * @param {String} originalField original query parameter name
     * @return {{}} where object
     * @private
     */
    __makeComparison(field, value, originalField) {
        if (field === undefined) {
            throw new errors.InvalidArgumentError('field param cannot be empty');
        }
        if (originalField === undefined) {
            throw new errors.InvalidArgumentError('originalField param cannot be empty');
        }
        if (value === undefined) {
            throw new errors.InvalidArgumentError('value param cannot be empty');
        }

        const operator = this.__getOperator(value, field, originalField);
        // const result = {[field]: {}};
        return operator.getSequelizeWhere(value, field, originalField);
    }

    /**
     * Getting operator for query parameter
     * @param {String} value query parameter value
     * @param {String} field transformed field
     * @param {String} originalField original query parameter name
     * @return {OperatorAbstract}
     * @private
     */
    __getOperator(value, field, originalField) {
        const operator = this._options.operators.find((operator) => operator.isApplicable(value, field, originalField));
        if (operator instanceof operators.OperatorAbstract) {
            return operator;
        }
        const debugInfo = `field: ${field}, originalField: ${originalField}, actual type: ${typeof operator}`;
        throw new errors.InvalidArgumentError(`operator must be instance of OperatorAbstract, ${debugInfo}`);
    }
}

SequelizeQueryBuilder.operators = operators;

module.exports = SequelizeQueryBuilder;
