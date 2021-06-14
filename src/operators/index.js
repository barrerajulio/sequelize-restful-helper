'use strict';
const { standardOperators, operatorsBySequelizeName } = require('./defaultSet');

const StandardValueOperator = require('./standard').StandardValueOperator;
const IdentityOperator = require('./identity').IdentityOperator;
const InOperator = require('./in').InOperator;
const SearchByFieldsOperator = require('./search').SearchByFieldsOperator;
const ContainsOperator = require('./contains').ContainsOperator;
const OperatorAbstract = require('./abstract').OperatorAbstract;

module.exports = {
    OperatorAbstract,
    SearchByFieldsOperator,
    ContainsOperator,
    InOperator,
    IdentityOperator,
    StandardValueOperator,
    standardOperators,
    operatorsBySequelizeName,
};
