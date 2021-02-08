'use strict';

const _ = require('lodash');
const errors = require('./errors');

function Paginator(queryParams, options) {
    this._options = _.merge({
        defaultPageSize: 30,
        pageParam: 'page',
        pageSizeParam: 'limit',
        offsetParam: 'offset',
        pageSizeLimit: [1, 150]
    }, options || {});

    this._queryParams = queryParams;
    this._page = null;
    this._pageSize = null;
    this._offset = null;
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
    if (this._offset === null) {
        if (!this._options.offsetParam) {
            this.setOffset(0);
        } else {
            const offset = this.getQueryParam(this._options.offsetParam, 0);
            this.setOffset(offset, true);
        }
    }
    return this._offset;
};

Paginator.prototype.setOffset = function (offset, validateOffset) {
    validateOffset = validateOffset || false;
    if (offset === null || offset === undefined) {
        this._offset = 0;
    } else {
        offset = parseInt(offset, 10);
        if (Number.isNaN(offset) || offset < 0) {
            offset = 0;
        }
        this._offset = offset;
    }
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
