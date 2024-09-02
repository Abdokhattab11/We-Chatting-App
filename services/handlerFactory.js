const asyncHandler = require("express-async-handler");
const AppError = require("../utils/CustomError");
const ApiFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);
    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }
    res.status(204).json({
      success: true,
    });
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findOneAndUpdate({ _id: id }, req.body, {
      new: true,
    });
    if (!doc) {
      return new AppError("No document found with that ID", 404);
    }
    //to trigger post save middleware to calculate ratings avg
    res.status(200).json({
      success: true,
      doc,
    });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    //console.log(req.body);
    //console.log(`current user:${req.user}`);
    const doc = await Model.create(req.body);
    res.status(201).json({
      success: true,
      doc,
    });
  });
exports.getOne = (Model, populateOpt) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);
    if (!query) {
      return next(new AppError("not found document", 404));
    }
    query = query.populate(populateOpt);
    query = await query;
    res.status(200).json({
      success: true,
      query,
    });
  });

exports.getAll = (Model, modelName) =>
  asyncHandler(async (req, res, next) => {
    //console.log(process.env.NODE_ENV);
    let filter = {};
    if (req.filterObj) filter = req.filterObj;
    const docsCount = await Model.countDocuments();
    const query = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .paginate(docsCount)
      .sorting()
      .limitFields()
      .searching(modelName);
    //2) consume query
    const { mongooseQuery, paginationResults } = query;
    const docs = await mongooseQuery;
    res.status(200).json({
      success: true,
      results: docs.length,
      docs,
      paginationResults,
    });
  });
