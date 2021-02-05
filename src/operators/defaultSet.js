'use strict';

const _ = require('lodash');
const IdentityOperator = require('./identity').IdentityOperator;
const StandardValueOperator = require('./standard').StandardValueOperator;


const stadardOperatorNames = Object.freeze({
    '<>': '$between',
    '!<>': '$notBetween',
    '>': '$gt',
    ':>': '$gte',
    '<': '$lt',
    ':<': '$lte',
    '!': '$ne'
});

const stadardOperatorValidations = Object.freeze({
    '<>': /^<>.+\|.+$/,
    '!<>': /^!<>.+\|.+$/,
    '>': /^>(\.|\d).*$/,
    ':>': /^:>(\.|\d).*$/,
    '<': /^<(\.|\d).*$/,
    ':<': /^:<(\.|\d).*$/,
    '!': /^!.+$/
});

const operatorsBySequelizeName = Object.keys(stadardOperatorNames)
    .map((name) => ({
        name,
        sequelizeName: stadardOperatorNames[name],
        validationRegExp: stadardOperatorValidations[name],
        argNumber: stadardOperatorValidations[name].toString().indexOf('|') === -1 ? 1 : 2
    }))
    .reduce((map, operatorOptions) => {
        map[operatorOptions.sequelizeName] = new StandardValueOperator(operatorOptions);
        return map;
    }, {});
operatorsBySequelizeName.$eq = new IdentityOperator();

const standardOperators = _.values(operatorsBySequelizeName);

module.exports = { standardOperators, operatorsBySequelizeName };
