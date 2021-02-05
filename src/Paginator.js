'use strict';

const _ = require('lodash');
const errors = require('./errors');

function Paginator(queryParams, options) {
    this._options = _.merge({
        defaultPageSize: 30,
        pageParam: 'page',
        pageSizeParam: 'per-page',
        pageSizeLimit: [1, 150]
    }, options || {});

    this._queryParams = queryParams;
    this._page = null;
    this._pageSize = null;
}

Paginator.prototype.getQueryParam = function (name, defaultValue) {
    defaultValue = defaultValue || null;
    return this._queryParams.hasOwnProperty(name) && (/boolean|number|string/).test(typeof this._queryParams[name])
        ? this._queryParams[name]
        : defaultValue;
};

Paginator.prototype.getPageCount = function (totalCount) {
    const pageSize = this.getPageSize();

    if (pageSize < 1) {
        return totalCount > 0 ? 1 : 0;
    }
    totalCount = totalCount < 0 ? 0 : totalCount;
    return parseInt((totalCount + pageSize - 1) / pageSize, 10);
};

Paginator.prototype.getPage = function () {
    if (this._page === null) {
        this._page = parseInt(this.getQueryParam(this._options.pageParam, 1), 10);
    }

    if (Number.isNaN(this._page) || this._page <= 0) {
        throw new errors.InvalidArgumentError('Invalid "page" argument. Should be positive Integer');
    }

    return this._page;
};

Paginator.prototype.getPageSize = function () {
    if (this._pageSize === null) {
        if (!this._options.pageSizeLimit) {
            this.setPageSize(this._options.defaultPageSize);
        } else {
            const pageSize = this.getQueryParam(this._options.pageSizeParam, this._options.defaultPageSize);
            this.setPageSize(pageSize, true);
        }
    }

    return this._pageSize;
};

Paginator.prototype.setPageSize = function (pageSize, validatePageSize) {
    validatePageSize = validatePageSize || false;

    if (pageSize === null || pageSize === undefined) {
        this._pageSize = null;
    } else {
        pageSize = parseInt(pageSize, 10);
        if (Number.isNaN(pageSize) || pageSize < 0) {
            pageSize = this._options.defaultPageSize;
        }
        if (validatePageSize && Array.isArray(this._options.pageSizeLimit) && this._options.pageSizeLimit.length === 2) {
            if (pageSize < this._options.pageSizeLimit[0]) {
                pageSize = this._options.pageSizeLimit[0];
            } else if (pageSize > this._options.pageSizeLimit[1]) {
                pageSize = this._options.pageSizeLimit[1];
            }
        }
        this._pageSize = pageSize;
    }
};

Paginator.prototype.getOffset = function () {
    const pageSize = this.getPageSize();
    const offset = pageSize < 1 ? 0 : (this.getPage() - 1) * pageSize;
    if (offset > Number.MAX_SAFE_INTEGER) {
        throw new errors.InvalidArgumentError('Invalid offset argument. Should be positive Integer less then 2^53');
    }
    return offset;
};

Paginator.prototype.getLimit = function () {
    const pageSize = this.getPageSize();
    return pageSize < 1 ? -1 : pageSize;
};

/**
 * Returns meta info for paginated collection
 * @param {int} totalCount - collection total count from Model.findAndCountAll()
 * @param {[]} collection - collection of items
 * @returns {*}
 */
Paginator.prototype.getRes = function (totalCount, collection) {
    if (totalCount === undefined) {
        throw new errors.InvalidArgumentError('Invalid "totalCount" argument');
    }
    if (collection === undefined) {
        throw new errors.InvalidArgumentError('Invalid "collection" argument');
    }

    return {
        meta: {
            totalCount,
            pageCount: this.getPageCount(totalCount),
            currentPage: this.getPage(),
            perPage: this.getPageSize()
        },
        items: collection
    };
};


Paginator.prototype.sendRes = function (/*totalCount, collection*/) {
    // empty
};

module.exports = Paginator;
