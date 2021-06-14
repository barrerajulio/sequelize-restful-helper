const SequelizeQueryBuilder = require('./src/SequelizeQueryBuilder');
const restfulHelper = new SequelizeQueryBuilder(
    {
        "id": { "$gt": 1 },
        "is_active": { "$eq": 1 },
    }
    , // give the request query object
    {
        allowedFilters: ['id', 'name', 'is_active'], // white list.
        allowedOrder: ['id'], // white list
        filterAliases: {
            is_active: 'products.is_visible_for_customer', // req.query.is_active -> where: {is_visible_for_customer: ...}
        },
        operators: [
            SequelizeQueryBuilder.operators.operatorsBySequelizeName.$eq,
        ]
    }
);

console.log(restfulHelper.getSequelizeOptions());
