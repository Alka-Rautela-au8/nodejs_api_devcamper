const advancedResults = (model, populate) => async(req, res, next) => {

    // Copy req.query                                         
    const reqQuery = {...req.query};

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit']

    // Loop over removeFields and delete then from reqQuery
    removeFields.forEach( param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource 
    let query = model.find(JSON.parse(queryStr));

    // Select fields
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields)
    }

    // Sort
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(" ");  // incase we added more parameters in sort like sort=name,id  ---> name,_id.split(',') ---> ['name', '_id'] -----> ['name', '_id'].join(" ") ----> "name id"
        query = query.sort(sortBy);
    }else{
        query = query.sort('-createdAt');  //default
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit; //number of models to skip
    const endIndex= page * limit;
    const total = await model.countDocuments() //method for counting all the documents
    
    query = query.skip(startIndex).limit(limit);

    if(populate){
        query = query.populate(populate)
    }

    // Executing query
    const results = await query;

    // Pagination result
    const pagination = {};

    if(endIndex < total){
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if(startIndex > 0){
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    res.advancedResults = {
        success: true, 
        count: results.length,
        pagination,
        data: results
    }

    next();
}

module.exports = advancedResults;